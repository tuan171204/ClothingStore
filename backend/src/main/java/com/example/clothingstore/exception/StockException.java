// StockException.java
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
                .map(i -> i.getProductName() + ": yêu cầu " + i.getRequested()
                        + ", còn " + i.getAvailable())
                .reduce("", (a, b) -> a + "; " + b);
    }

    @Getter
    public static class StockIssue {
        private final Long skuId;
        private final String productName;
        private final int requested;
        private final int available;
        // constructor, builder...
        public StockIssue(Long skuId, String productName, int requested, int available) {
            this.skuId = skuId;
            this.productName = productName;
            this.requested = requested;
            this.available = available;
        }
    }
}