package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.dto.OrderDTO;
import com.example.clothingstore.dtos.order.request.CancelOrderRequest;
import com.example.clothingstore.dtos.order.request.OrderFilterRequest;
import com.example.clothingstore.dtos.order.request.ReturnOrderRequest;
import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.service.cloudinary.CloudinaryService;
import com.example.clothingstore.service.impl.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CloudinaryService cloudinaryService;

    // ----------------------------------------------------------------
    // GET /orders — Admin: filter + phân trang
    // Params: keyword, status, paymentMethod, fromDate, toDate, page, size
    // ----------------------------------------------------------------
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PagedResponse<OrderResponse>> getOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        OrderFilterRequest filter = new OrderFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setPaymentMethod(paymentMethod);
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setPage(page);
        filter.setSize(size);

        return ResponseEntity.ok(orderService.getOrdersWithFilter(filter));
    }

    // ----------------------------------------------------------------
    // GET /orders/summary — Thống kê tổng tiền theo filter (không phân trang)
    // ----------------------------------------------------------------
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getOrderSummary(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        OrderFilterRequest filter = new OrderFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setPaymentMethod(paymentMethod);
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setPage(0);
        filter.setSize(Integer.MAX_VALUE);

        BigDecimal total = orderService.getTotalAmountByFilter(filter);
        long count = orderService.getOrdersWithFilter(filter).getTotalElements();

        return ResponseEntity.ok(Map.of(
                "totalRevenue", total,
                "totalOrders", count
        ));
    }

    // ----------------------------------------------------------------
    // GET /orders/{id}
    // ----------------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // ----------------------------------------------------------------
    // GET /orders/users/{userId}
    // ----------------------------------------------------------------
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrderByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getOrderByUserId(userId));
    }

    // ----------------------------------------------------------------
    // POST /orders
    // ----------------------------------------------------------------
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody OrderDTO orderDTO) {
        return ResponseEntity.ok(orderService.createOrder(orderDTO));
    }

    // ----------------------------------------------------------------
    // PATCH /orders/{id}/status — Cập nhật trạng thái đơn hàng
    // Body: { "status": "CONFIRMED" }
    // ----------------------------------------------------------------
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        OrderStatus status = OrderStatus.valueOf(body.get("status"));
        orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok().build();
    }

    // ----------------------------------------------------------------
    // POST /orders/{id}/ship — Duyệt & Gửi GHN
    // ----------------------------------------------------------------
    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Order> shipOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmAndShipOrder(id));
    }

    // ════════════════════════════════════════════════════════════════
    // ENDPOINT MỚI: HỦY ĐƠN HÀNG — KHÁCH HÀNG
    // ════════════════════════════════════════════════════════════════

    /**
     * POST /api/v1/orders/{id}/cancel
     *
     * Khách hàng hủy đơn của mình.
     * Chỉ cho phép khi status = PENDING hoặc CONFIRMED.
     *
     * Request body: { "reason": "Thay đổi địa chỉ giao hàng" }
     *
     * Response: OrderResponse đã cập nhật trạng thái CANCELLED.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        OrderResponse response = orderService.cancelOrder(id, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .result(response)
                .message("Đơn hàng đã được hủy thành công.")
                .build());
    }

    // ════════════════════════════════════════════════════════════════
    // ENDPOINT MỚI: YÊU CẦU HOÀN TRẢ — KHÁCH HÀNG
    // ════════════════════════════════════════════════════════════════

    /**
     * POST /api/v1/orders/{id}/return
     *
     * Khách hàng gửi yêu cầu hoàn trả sau khi nhận hàng.
     * Chỉ cho phép khi status = COMPLETED.
     * Status sau khi gọi: RETURN_REQUESTED.
     *
     * Request body:
     * {
     *   "reason":      "DEFECTIVE",
     *   "description": "Sản phẩm bị rách ở đường may bên hông",
     *   "imageUrls":   ["https://res.cloudinary.com/...", "..."]
     * }
     *
     * Response: OrderResponse đã cập nhật trạng thái RETURN_REQUESTED.
     */
    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<OrderResponse>> returnOrder(
            @PathVariable Long id,
            @Valid @RequestBody ReturnOrderRequest request
    ) {
        OrderResponse response = orderService.requestReturnOrder(id, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .result(response)
                .message("Yêu cầu hoàn trả đã được ghi nhận. Chúng tôi sẽ xem xét và phản hồi trong 1–3 ngày làm việc.")
                .build());
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadOrderImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = cloudinaryService.uploadImage(file);
            return ResponseEntity.ok(imageUrl);
        } catch (java.io.IOException e) {
            return ResponseEntity.badRequest().body("Lỗi upload ảnh: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve-return")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> approveReturnOrder(@PathVariable Long id) {
        OrderResponse response = orderService.approveReturnOrder(id);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .result(response)
                .message("Đã duyệt yêu cầu hoàn trả và hoàn lại tồn kho thành công.")
                .build());
    }
}