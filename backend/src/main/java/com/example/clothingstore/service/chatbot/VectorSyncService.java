package com.example.clothingstore.service.chatbot;

import com.example.clothingstore.entity.Product;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorSyncService {

    private final ProductRepository productRepository;
    private final VectorStore vectorStore;

    @Transactional(readOnly = true) // Tối ưu Hibernate Session, không track dirty changes
    public void syncProductsToPinecone() {
        log.info("Bắt đầu đồng bộ dữ liệu sản phẩm đa biến thể lên Pinecone...");

        // 1. Sử dụng Custom Query để tránh N+1
        List<Product> products = productRepository.findAllForVectorSync();
        List<Document> documents = new ArrayList<>();

        for (Product product : products) {
            // 2. Build râu ria: Phân loại và Thương hiệu (Kiểm tra null an toàn)
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Chưa phân loại";
            String brandName = product.getBrand() != null ? product.getBrand().getName() : "No Brand";

            // 3. Build chi tiết các biến thể SKU (Chỉ lấy các SKU đang bán và còn tồn kho)
            String variantsInfo = buildVariantsText(product);

            // 4. Lắp ráp thành đoạn văn tự nhiên (Semantic Text) cho Embedding Model
            String content = String.format("""
                    Tên sản phẩm: %s.
                    Danh mục: %s. Thương hiệu: %s.
                    Giá gốc: %s VNĐ.
                    Mô tả: %s.
                    Danh sách các phân loại (biến thể) đang có sẵn:
                    %s
                    """,
                    product.getName(),
                    categoryName, brandName,
                    product.getBasePrice(),
                    product.getDescription() != null ? product.getDescription() : "Không có",
                    variantsInfo.isEmpty() ? "Hiện tại đã hết hàng các biến thể." : variantsInfo
            );

            // 5. Gắn Metadata để truy xuất nhanh (VD: Lọc các sp thuộc category ID cụ thể)
            Map<String, Object> metadata = Map.of(
                    "productId", product.getId(),
                    "categoryId", product.getCategory() != null ? product.getCategory().getId() : 0,
                    "basePrice", product.getBasePrice().doubleValue(),
                    "hasActiveSkus", !variantsInfo.isEmpty()
            );

            documents.add(new Document(content, metadata));
        }

        // 6. Đẩy dữ liệu theo Batch (Spring AI tự động handle gọi API Gemini và lưu Pinecone)
        if (!documents.isEmpty()) {
            vectorStore.add(documents);
            log.info("Đã đồng bộ thành công {} sản phẩm lên Vector Database!", documents.size());
        } else {
            log.warn("Không có sản phẩm Active nào để đồng bộ.");
        }
    }

    /**
     * Hàm helper bóc tách Option của SKU thành chuỗi văn bản.
     * VD kết quả: "- SKU [Áo-Đen-L]: Màu sắc Đen, Kích thước L. Giá: 250000 VNĐ. Còn hàng."
     */
    private String buildVariantsText(Product product) {
        if (product.getSkus() == null || product.getSkus().isEmpty()) {
            return "";
        }

        return product.getSkus().stream()
                .filter(sku -> Boolean.TRUE.equals(sku.getIsActive()) && sku.getStockQuantity() != null && sku.getStockQuantity() > 0)
                .map(sku -> {
                    // Nối các giá trị option (Đỏ, XL,...) lại với nhau
                    String optionDetails = sku.getValues().stream()
                            .filter(val -> Boolean.TRUE.equals(val.getIsActive()))
                            .map(val -> {
                                var optValue = val.getOptionValue();
                                return optValue.getProductOption().getName() + " " + optValue.getValue();
                            })
                            .collect(Collectors.joining(", "));

                    return String.format("- Mã %s: %s. Giá bán: %s VNĐ.",
                            sku.getCode() != null ? sku.getCode() : "N/A",
                            optionDetails.isEmpty() ? "Bản tiêu chuẩn" : optionDetails,
                            sku.getPrice() != null ? sku.getPrice() : product.getBasePrice()
                    );
                })
                .collect(Collectors.joining("\n"));
    }
}