package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.auth.request.*;
import com.example.clothingstore.dtos.auth.response.AuthenticationResponse;
import com.example.clothingstore.dtos.auth.response.IntrospectResponse;
import com.example.clothingstore.entity.Role;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.entity.auth.InvalidatedToken;
import com.example.clothingstore.repository.RoleRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.repository.auth.InvalidatedTokenRepository;
import com.example.clothingstore.service.mail.MailService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.example.clothingstore.entity.Enum.AuthProvider;

import java.time.LocalDate;
import java.util.Collections;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    StringRedisTemplate redisTemplate;
    MailService mailService;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @NonFinal
    @Value("${app.google.client-id}")
    protected String GOOGLE_CLIENT_ID;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token  = request.getToken();
//        log.info("Token: {}", token);
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (RuntimeException e){
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not existed"));

        if (user.getProvider() != AuthProvider.LOCAL) throw new RuntimeException("Vui lòng đăng nhập bằng " + user.getProvider());

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated)
            throw new RuntimeException("User not existed !");

        var token = generateToken(user);

        String roleName = user.getRole() != null ? user.getRole().getName() : "";

        return AuthenticationResponse.builder()
                .token(token)
                .isAuthenticated(true)
                .role(roleName)
                .build();
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try {
            var signToken = verifyToken(request.getToken(), true);

            String jit = signToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryTime(expiryTime)
                    .build();

            invalidatedTokenRepository.save(invalidatedToken);
        } catch (RuntimeException e) {
            log.info("Token already expired");
        }
    }

    public AuthenticationResponse refreshToken(RefreshTokenRequest request) throws ParseException, JOSEException {
        var signJWT = verifyToken(request.getToken(), true);

        String jit = signJWT.getJWTClaimsSet().getJWTID();
        Date expiryTime = signJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expiryTime)
                .build();

        invalidatedTokenRepository.save(invalidatedToken);

        var username = signJWT.getJWTClaimsSet().getSubject();

        var user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("User not found"));

        var token = generateToken(user);

        String roleName = user.getRole() != null ? user.getRole().getName() : "";

        return AuthenticationResponse.builder()
                .token(token)
                .isAuthenticated(true)
                .role(roleName)
                .build();
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername()) // đại diện cho user đăng nhập
                .issuer("tuanthai.com") // xác định token issue từ ai ( thường là chính trang web )
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                        // thời gian hết hạn của token
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject()); // Payload chứa claimSet, lưu dạng Json Object

        // 2 params là Header và Payload
        JWSObject jwsObject = new JWSObject(header, payload);

        // ký token (chọn thuật toán ký token)
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token ", e);
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = (isRefresh)
                ? new Date(signedJWT
                .getJWTClaimsSet()
                .getIssueTime()
                .toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                .toEpochMilli())
                : // hoặc
                signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        // nếu token không được gen bởi secret sign key của hệ thống hoặc hết hạn thì từ chối
        if (!(verified && expirationTime.after(new Date())))
            throw new RuntimeException("Token unverified or out of date !");

        // nếu token đã bị đưa vào bảng invalidatedToken ( đã đăng xuất ) thì từ chối
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())){
            throw new RuntimeException("Invalidated token");
        }
        return signedJWT;
    }

    private String buildScope(User user){
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (user.getRole() != null) {
            stringJoiner.add(user.getRole().getName());
        }

        return stringJoiner.toString();
    }

    public void forgotPassword(ForgotPasswordRequest request){
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not existed !"));

        String token = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set("RESET_PW:" + token, user.getEmail(), 15, TimeUnit.MINUTES);

        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        mailService.sendResetPasswordEmail(user.getEmail(), resetLink);
    }

    public void resetPassword(ResetPasswordRequest request){
        String email = redisTemplate.opsForValue().get("RESET_PW:" + request.getToken());

        if (email == null){
            throw new RuntimeException("Token invalidated or expired !");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not existed !"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        redisTemplate.delete("RESET_PW:" + request.getToken());
    }

    public AuthenticationResponse googleLogin(GoogleLoginRequest request) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                new GsonFactory())
                .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                .build();

        try {
            GoogleIdToken idToken = verifier.verify(request.idToken());
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();

            // Find or Create User
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> createNewGoogleUser(email, payload));

            // Tái sử dụng method generateToken hiện tại của bạn
            String token = generateToken(user);
            String roleName = user.getRole() != null ? user.getRole().getName() : "";

            return AuthenticationResponse.builder()
                    .token(token)
                    .isAuthenticated(true)
                    .role(roleName)
                    .build();

        } catch (Exception e) {
            log.error("Google Auth Error: {}", e.getMessage());
            throw new RuntimeException("Google authentication failed", e);
        }
    }

    /*
    PRIVATE HELPERS
     */
    private User createNewGoogleUser(String email, GoogleIdToken.Payload payload) {
        try {
            Role customerRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy Role CUSTOMER"));

            User newUser = User.builder()
                    .email(email)
                    .username(email)
                    .fullName((String) payload.get("name"))
                    .avatar((String) payload.get("picture"))
                    .dob(LocalDate.now())
                    .active(true)
                    .provider(AuthProvider.GOOGLE)
                    .role(customerRole)
                    .build();

            return userRepository.save(newUser);

        } catch (DataIntegrityViolationException e) {
            /*
             * GIẢI THÍCH KỸ THUẬT VỀ RACE CONDITION:
             * * - Tình huống: User click button "Login Google" 2 lần cực nhanh (Double click),
             * hoặc mạng lag dẫn đến frontend gửi 2 requests đồng thời (Concurrent requests).
             * - Vấn đề: Cả 2 Threads (T1, T2) cùng lọt vào `findByEmail(email)` tại cùng 1 mili-giây.
             * Cả T1 và T2 đều nhận được kết quả là `Optional.empty()`.
             * Do đó, cả T1 và T2 đều chạy vào hàm `createNewGoogleUser` và gọi lệnh `save(newUser)`.
             * * - Cách khắc phục:
             * Nhờ Entity User của bạn đã có `@Column(nullable = false, unique = true)` ở field `email` và `username`.
             * T1 insert nhanh hơn 1 mili-giây -> Thành công.
             * T2 insert ngay sau đó -> MySQL sẽ ném ra lỗi vi phạm Unique Constraint.
             * Spring Data JPA sẽ bọc lỗi này trong `DataIntegrityViolationException`.
             *
             * - Xử lý tiếp theo (Recovery): Thay vì để API trả về lỗi 500 cho request của T2,
             * ta catch lỗi này, và biết chắc chắn là T1 đã insert thành công rồi,
             * nên ta chỉ cần quay lại `findByEmail` một lần nữa để lấy User đó ra.
             */
            log.warn("Race condition detected during Google User creation for email: {}", email);

            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không thể lấy thông tin user sau Race Condition"));
        }
    }
}
