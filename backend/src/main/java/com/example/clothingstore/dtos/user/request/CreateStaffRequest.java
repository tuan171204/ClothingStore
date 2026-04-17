package com.example.clothingstore.dtos.user.request;
 
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
 
/**
 * Admin creates a staff account.
 * Password will be hashed in service layer.
 * A welcome email with temp password should be sent (extend MailService).
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateStaffRequest {
 
    @NotBlank(message = "Username không được để trống")
    @Size(min = 4, max = 50, message = "Username từ 4 đến 50 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username chỉ chứa chữ, số, dấu . _ -")
    private String username;
 
    @NotBlank(message = "Password không được để trống")
    @Size(min = 8, message = "Password tối thiểu 8 ký tự")
    private String password;
 
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100)
    private String fullName;
 
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;
 
    @Pattern(regexp = "^(0[35789]\\d{8})?$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;
 
    private LocalDate dob;
 
    /**
     * Role to assign: STAFF or ADMIN.
     * SUPER_ADMIN cannot be assigned via API — only via database seed.
     */
    @NotBlank(message = "Role không được để trống")
    @Pattern(regexp = "^(STAFF|ADMIN)$", message = "Role phải là STAFF hoặc ADMIN")
    private String role;
}