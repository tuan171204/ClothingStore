package com.example.clothingstore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListResponse {
    private List<ProductResponse> products; // Danh sách sản phẩm của trang hiện tại
    private int totalPages;                 // Tổng số trang
    private long totalElements;             // Tổng số lượng sản phẩm thỏa mãn điều kiện lọc
}