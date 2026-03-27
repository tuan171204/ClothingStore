package com.example.clothingstore.controller;

import com.example.clothingstore.dto.OrderDTO;
import com.example.clothingstore.dto.request.OrderFilterRequest;
import com.example.clothingstore.dto.response.OrderResponse;
import com.example.clothingstore.dto.response.PagedResponse;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.service.impl.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

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
}