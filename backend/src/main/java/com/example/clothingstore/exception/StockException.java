// ============================================================
// FILE: backend/src/main/java/com/example/clothingstore/exception/StockException.java
// THAY THẾ TOÀN BỘ FILE — Thêm field raceMessage vào StockIssue
// ============================================================
package com.example.clothingstore.exception;

import lombok.Getter;
import java.util.List;

@Getter
public class StockException extends RuntimeException {

    public enum Type { OUT_OF_STOCK, PARTIAL_AVAILABLE, STOCK_CHANGED }

    private final Type type;
    private final List<StockIssue> issues;

    public StockException(Type type, List<StockIssue> issues) {
        super(buildMessage(issues));
        this.type = type;
        this.issues = issues;
    }

    private static String buildMessage(List<StockIssue> issues) {
        return issues.stream()
                .map(i -> i.getRaceMessage() != null ? i.getRaceMessage()
                        : i.getProductName() + ": yêu cầu " + i.getRequested() + ", còn " + i.getAvailable())
                .reduce("", (a, b) -> a.isEmpty() ? b : a + "; " + b);
    }

    @Getter
    public static class StockIssue {
        private final Long skuId;
        private final String productName;
        private final int requested;
        private final int available;

        /**
         * [FIX] Message thân thiện, rõ ràng cho từng trường hợp:
         * - Hết hàng do race condition
         * - Không đủ số lượng do race condition
         * null = dùng message mặc định (cho pre-validate trước checkout)
         */
        private final String raceMessage;

        // Constructor cũ — dùng cho preValidateStock (không có race context)
        public StockIssue(Long skuId, String productName, int requested, int available) {
            this.skuId = skuId;
            this.productName = productName;
            this.requested = requested;
            this.available = available;
            this.raceMessage = null;
        }

        // Constructor mới — dùng trong executeCheckoutWithRetry (có race context)
        public StockIssue(Long skuId, String productName, int requested, int available, String raceMessage) {
            this.skuId = skuId;
            this.productName = productName;
            this.requested = requested;
            this.available = available;
            this.raceMessage = raceMessage;
        }
    }
}