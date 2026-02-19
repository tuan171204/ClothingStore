package com.example.clothingstore.document;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "products") // Tên "bảng" trong Elasticsearch (gọi là index)
public class ProductDocument {

    @Id
    private Long id; // ID này sẽ map chính xác với ID của Product trong MySQL

    // FieldType.Text báo cho ES biết đây là đoạn văn bản cần được "băm" ra để tìm kiếm
    // analyzer = "standard" là bộ phân tích mặc định, hỗ trợ tìm kiếm khá tốt
    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

}