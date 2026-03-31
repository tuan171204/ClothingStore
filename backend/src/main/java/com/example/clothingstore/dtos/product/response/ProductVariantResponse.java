package com.example.clothingstore.dtos.product.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder @NoArgsConstructor @AllArgsConstructor
public class ProductVariantResponse {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionGroup {
        private String name;                    // "Màu sắc"
        private List<String> values;            // ["Đỏ", "Xanh", "Trắng"]
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkuMatrix {
        private Long skuId;
        private Map<String, String> options;    // { "Màu sắc": "Đỏ", "Size": "M" }
        private boolean inStock;
        private Integer stockQuantity;
        private BigDecimal price;
        private String imgUrl;
    }

    private List<OptionGroup> options;
    private List<SkuMatrix> skus;
}
