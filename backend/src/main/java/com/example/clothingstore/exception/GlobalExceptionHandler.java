package com.example.clothingstore.exception;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.order.response.CheckoutResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 1. Xử lý các lỗi Business Logic chủ động (AppException)
    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    // 2. Xử lý lỗi Validation (khi bạn dùng @Valid, @NotNull, @NotBlank ở DTO)
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handlingValidationException(MethodArgumentNotValidException exception) {
        // Lấy tất cả các thông báo lỗi từ DTO nối lại với nhau
        String errorMessage = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message(ErrorCode.VALIDATION_ERROR.getMessage() + " [" + errorMessage + "]")
                .build();
        return ResponseEntity.badRequest().body(apiResponse);
    }

    // 3. Xử lý lỗi từ chối truy cập (Access Denied - 403) từ Spring Security
    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse<Void>> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.FORBIDDEN;
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    // 4. Xử lý lỗi sai phương thức HTTP (Ví dụ API yêu cầu POST nhưng bạn gọi GET)
    @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiResponse<Void>> handlingMethodNotSupportedException(HttpRequestMethodNotSupportedException exception) {
        ErrorCode errorCode = ErrorCode.METHOD_NOT_ALLOWED;
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage() + " (" + exception.getMethod() + ")")
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    // 5. Xử lý lỗi gửi sai định dạng JSON (Malformed JSON) hoặc sai kiểu dữ liệu
    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse<Void>> handlingHttpMessageNotReadableException(HttpMessageNotReadableException exception) {
        ErrorCode errorCode = ErrorCode.MALFORMED_JSON;
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    // 6. Bỏ qua lỗi truy cập tài nguyên tĩnh không tồn tại (như lỗi ws/ws của Swagger)
    @ExceptionHandler(value = NoResourceFoundException.class)
    ResponseEntity<ApiResponse<Void>> handlingNoResourceFoundException(NoResourceFoundException exception) {
        // Không cần in log đỏ exception.printStackTrace() ở đây để tránh rác console
        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION; // Hoặc bạn có thể tạo ErrorCode.NOT_FOUND (404)
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message("Tài nguyên không tồn tại: " + exception.getResourcePath())
                .build();
        return ResponseEntity.status(404).body(apiResponse);
    }

    // 7. Xử lý TẤT CẢ các lỗi còn lại (Dòng rào chắn cuối cùng)
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse<Void>> handlingException(Exception exception) {
        // Ghi log chi tiết ra console để dev tìm lỗi
        log.error("Unhandled Exception: ", exception);

        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler({
            AsyncRequestNotUsableException.class,
            ClientAbortException.class,
            IOException.class
    })
    public void handleNetworkDisconnectExceptions(Exception ex) {
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("Broken pipe") || msg.contains("aborted by the software"))) {
            System.out.println("INFO: Client ngắt kết nối đột ngột (Local/Windows Disconnect).");
        }
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<CheckoutResponse>> handleOptimisticLocking(OptimisticLockingFailureException ex) {
        // Trả về JSON giống hệt như lỗi hết hàng (Status 409 Conflict)
        // Kèm theo danh sách stockMismatches
        return null;
    }
}