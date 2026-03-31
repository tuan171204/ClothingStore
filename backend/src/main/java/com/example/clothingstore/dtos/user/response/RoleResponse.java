package com.example.clothingstore.dtos.user.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleResponse {
    String name;
    // Sau này nếu cần trả về danh sách quyền hạn cho FE, có thể thêm:
    // Set<PermissionResponse> permissions;
}