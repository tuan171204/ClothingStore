package com.example.clothingstore.repository.search;

import com.example.clothingstore.document.ProductDocument;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.action.delete.DeleteRequest;
import org.opensearch.action.index.IndexRequest;
import org.opensearch.action.search.SearchRequest;
import org.opensearch.action.search.SearchResponse;
import org.opensearch.client.RequestOptions;
import org.opensearch.client.RestHighLevelClient;
import org.opensearch.common.unit.Fuzziness;
import org.opensearch.common.xcontent.XContentType;
import org.opensearch.index.query.QueryBuilders;
import org.opensearch.search.SearchHit;
import org.opensearch.search.builder.SearchSourceBuilder;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
@Slf4j
public class ProductSearchRepository {

    private final RestHighLevelClient client;
    private final ObjectMapper objectMapper;
    private static final String INDEX_NAME = "products";

    // 1. Lưu hoặc Cập nhật Document vào OpenSearch
    public void save(ProductDocument document) {
        try {
            IndexRequest request = new IndexRequest(INDEX_NAME)
                    .id(String.valueOf(document.getId()))
                    // Chuyển Object thành JSON an toàn qua Jackson
                    .source(objectMapper.writeValueAsString(document), XContentType.JSON);

            client.index(request, RequestOptions.DEFAULT);
            log.info("Đã đồng bộ sản phẩm ID {} lên OpenSearch", document.getId());
        } catch (Exception e) {
            log.error("Lỗi khi lưu sản phẩm lên OpenSearch: {}", e.getMessage());
        }
    }

    // 2. Xóa Document khỏi OpenSearch
    public void deleteById(Long id) {
        try {
            DeleteRequest request = new DeleteRequest(INDEX_NAME, String.valueOf(id));
            client.delete(request, RequestOptions.DEFAULT);
            log.info("Đã xóa sản phẩm ID {} khỏi OpenSearch", id);
        } catch (Exception e) {
            log.error("Lỗi khi xóa sản phẩm trên OpenSearch: {}", e.getMessage());
        }
    }

    // 3. Tìm kiếm mờ (Fuzzy Search)
    public List<ProductDocument> findByNameFuzzy(String keyword) {
        List<ProductDocument> results = new ArrayList<>();
        try {
            SearchRequest searchRequest = new SearchRequest(INDEX_NAME);
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();

            // Tạo cấu trúc query: {"match": {"name": {"query": "keyword", "fuzziness": "AUTO"}}}
            sourceBuilder.query(QueryBuilders.matchQuery("name", keyword).fuzziness(Fuzziness.AUTO));
            searchRequest.source(sourceBuilder);

            SearchResponse response = client.search(searchRequest, RequestOptions.DEFAULT);

            // Tự parse JSON trả về thành Object
            for (SearchHit hit : response.getHits().getHits()) {
                ProductDocument doc = objectMapper.readValue(hit.getSourceAsString(), ProductDocument.class);
                results.add(doc);
            }
        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm mờ trên OpenSearch: {}", e.getMessage());
        }
        return results;
    }
}