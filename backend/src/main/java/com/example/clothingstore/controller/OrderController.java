package com.example.clothingstore.controller;

import com.example.clothingstore.dto.OrderDTO;
import com.example.clothingstore.dto.response.OrderResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.service.impl.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    // GET: http://localhost:8080/api/v1/orders
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // GET: http://localhost:8080/api/v1/orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // GET: http://localhost:8080/api/v1/orders/users/{userId}
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrderByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getOrderByUserId(userId));
    }

    // POST: http://localhost:8080/api/v1/orders
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody OrderDTO orderDTO){
        Order newOrder = orderService.createOrder(orderDTO);
        return ResponseEntity.ok(newOrder);
    }

    // POST: http://localhost:8080/api/v1/orders/{id}/ship
    @PostMapping("/{id}/ship")
    public ResponseEntity<Order> shipOrder(@PathVariable Long id) {
        // Sau này thêm @PreAuthorize("hasRole('ADMIN')")
        return ResponseEntity.ok(orderService.confirmAndShipOrder(id));
    }
}
