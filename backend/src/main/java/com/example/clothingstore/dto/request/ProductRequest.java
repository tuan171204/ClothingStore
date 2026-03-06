package com.example.clothingstore.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal importPrice;
    private Long categoryId;
    private Long brandId;
    private String thumbnail;

    // Danh sách Option (Màu, Size)
    private List<OptionRequest> options;

    // Danh sách SKU (Biến thể)
    private List<SkuRequest> skus;

    @Data
    public static class OptionRequest {
        private String name; // VD: "Màu sắc"
        private List<OptionValueRequest> values; // VD: ["Đỏ", "Xanh"]
    }

    @Data
    public static class OptionValueRequest {
        private String value;
    }

    @Data
    public static class SkuRequest {
        private String code;
        private BigDecimal price;
        private BigDecimal importPrice;
        private Integer stockQuantity;
        // Để biết SKU này thuộc màu gì, size gì
        private List<SkuOptionValueRequest> optionValues;
        private String imgUrl;
    }

    @Data
    public static class SkuOptionValueRequest {
        private String optionName; // "Màu sắc"
        private String value;      // "Đỏ"
    }
}