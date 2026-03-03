package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.UserCreationRequest;
import com.example.clothingstore.dto.request.UserUpdateRequest;
import com.example.clothingstore.dto.response.UserResponse;
import com.example.clothingstore.entity.Role;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.mapper.UserMapper;
import com.example.clothingstore.repository.RoleRepository;
import com.example.clothingstore.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class UserService implements com.example.clothingstore.service.UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;

    @Override
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new RuntimeException("Username existed");

        if (userRepository.existsByEmail(request.getUsername()))
            throw new RuntimeException("Email existed");

        User user = userMapper.toUser(request);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setActive(true);

        Role defaultRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role newRole = Role.builder()
                            .name("USER")
                            .build();
                    return roleRepository.save(newRole);
                });

        // Gán role cho user mới
        user.setRole(defaultRole);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new RuntimeException("User existed");
        }

        return userMapper.toUserResponse(user);
    }

    @Override
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @Override
    public UserResponse getUser(String userId) {
        return userMapper.toUserResponse(
                userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"))
        );
    }

    @Override
    public UserResponse updateUser(UserUpdateRequest request, String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        userMapper.updateUser(user, request);

//        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
//        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
//            user.setPassword(passwordEncoder.encode(request.getPassword()));
//        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false); // Khóa tài khoản
        userRepository.save(user);
    }

    @Override
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String userName = context.getAuthentication().getName();
        log.info("Username from jwt: {}", userName);
        User user = userRepository.findByUsername(userName).orElseThrow(
                () -> new RuntimeException("User not found !")
        );

        return userMapper.toUserResponse(user);
    }
}
