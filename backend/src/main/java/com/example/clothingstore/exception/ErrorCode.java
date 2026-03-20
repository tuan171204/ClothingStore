package com.example.clothingstore.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Nhóm 99: Lỗi hệ thống không xác định
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

    // Nhóm 10: Lỗi chung về Dữ liệu và Request
    INVALID_DATA(1000, "Dữ liệu cung cấp không hợp lệ", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(1001, "Dữ liệu đầu vào không đúng định dạng", HttpStatus.BAD_REQUEST),
    MALFORMED_JSON(1002, "Định dạng JSON gửi lên bị sai", HttpStatus.BAD_REQUEST),
    METHOD_NOT_ALLOWED(1003, "Phương thức HTTP không được hỗ trợ", HttpStatus.METHOD_NOT_ALLOWED),

    // Nhóm 11: Lỗi Phân quyền & Bảo mật (Security)
    UNAUTHORIZED(1101, "Không có quyền truy cập (Chưa xác thực)", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1102, "Từ chối truy cập (Không đủ quyền)", HttpStatus.FORBIDDEN),

    // Nhóm 20: Module Brand
    BRAND_ALREADY_EXISTS(2001, "Thương hiệu đã tồn tại", HttpStatus.BAD_REQUEST),
    BRAND_NOT_FOUND(2002, "Không tìm thấy thương hiệu", HttpStatus.NOT_FOUND),

    // Nhóm 30: Module Category
    CATEGORY_ALREADY_EXISTS(3001, "Loại sản phẩm đã tồn tại", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(3002, "Không tìm thấy danh mục sản phẩm", HttpStatus.NOT_FOUND),

    // Nhóm 40: Module User (Thêm sẵn cho sau này)
    USER_NOT_FOUND(4001, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS(4002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;
}