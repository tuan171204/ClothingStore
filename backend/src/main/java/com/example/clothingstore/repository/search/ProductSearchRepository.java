package com.example.clothingstore.repository.search;

import com.example.clothingstore.document.ProductDocument;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, Long> {

    // Hàm "thần thánh" của Elasticsearch: Tìm kiếm gần đúng theo tên
    // Nó sẽ tự động phân tích từ khóa, ví dụ gõ "ao thun" vẫn có thể ra "Áo thun polo"
    List<ProductDocument> findByNameMatches(String name);

    // HÀM: Tìm kiếm mờ (Fuzzy Search)
    // fuzziness = "AUTO" cho phép sai số ký tự tùy theo độ dài của từ khóa (VD: jean và jeans chỉ lệch 1 ký tự -> Vẫn tính là đúng)
    @Query("{\"match\": {\"name\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\"}}}")
    List<ProductDocument> findByNameFuzzy(String name);

}