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
    SKU_NOT_FOUND(1010, "Biến thể sản phẩm không tồn tại", HttpStatus.NOT_FOUND),

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
    USER_ALREADY_EXISTS(4002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),

    // Nhóm 50: Module Review
    REVIEW_NOT_FOUND(5001, "Không tìm thấy đánh giá", HttpStatus.NOT_FOUND),
    REVIEW_ALREADY_EXISTS(5002, "Bạn đã đánh giá sản phẩm này rồi", HttpStatus.BAD_REQUEST),
    REVIEW_NOT_VERIFIED_BUYER(5003, "Chỉ khách hàng đã mua mới được đánh giá sản phẩm", HttpStatus.FORBIDDEN),
    REVIEW_EDIT_FORBIDDEN(5004, "Bạn không có quyền sửa đánh giá này", HttpStatus.FORBIDDEN),

    //nhom 60: Module Coupons
    COUPON_NOT_FOUND(6001, "Không tìm thấy mã giảm giá", HttpStatus.NOT_FOUND),
    COUPON_CODE_ALREADY_EXISTS(6002, "Mã giảm giá đã tồn tại", HttpStatus.BAD_REQUEST),
    COUPON_CODE_OUT_OF_STOCK(6003, "Mã giảm giá đã hết lượt sử dụng", HttpStatus.BAD_REQUEST),

    // Nhóm 70: Module Order — MÃ LỖI MỚI
    /** Không tìm thấy đơn hàng theo ID */
    ORDER_NOT_FOUND(7001, "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
    /** Đơn hàng không thể hủy ở trạng thái hiện tại */
    ORDER_CANNOT_CANCEL(7002, "Không thể hủy đơn hàng ở trạng thái hiện tại", HttpStatus.BAD_REQUEST),
    /** Đơn hàng không đủ điều kiện để hoàn trả */
    ORDER_CANNOT_RETURN(7003, "Đơn hàng không đủ điều kiện để hoàn trả", HttpStatus.BAD_REQUEST),
    /** Đã quá thời hạn hoàn trả */
    ORDER_RETURN_EXPIRED(7004, "Đã quá thời hạn hoàn trả", HttpStatus.BAD_REQUEST),
    /** Đơn hàng đã có yêu cầu hoàn trả đang xử lý */
    ORDER_RETURN_ALREADY_REQUESTED(7005, "Đơn hàng đã có yêu cầu hoàn trả đang xử lý", HttpStatus.BAD_REQUEST),

    // Nhóm 80: Flash Sales
    SKU_FLASH_SALES_OUT_OF_STOCK(8001, "Sản phẩm Flash Sale đã cháy hàng!", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;
}