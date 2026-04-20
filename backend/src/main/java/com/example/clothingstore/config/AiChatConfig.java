package com.example.clothingstore.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.memory.repository.jdbc.MysqlChatMemoryRepositoryDialect;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class AiChatConfig {
    @Bean
    @Primary
    public EmbeddingModel primaryEmbeddingModel(@Qualifier("googleGenAiTextEmbedding") EmbeddingModel googleEmbedding) {
        return googleEmbedding;
    }

    @Bean
    public JdbcChatMemoryRepository chatMemoryRepository(JdbcTemplate jdbcTemplate) {
        return JdbcChatMemoryRepository.builder()
                .jdbcTemplate(jdbcTemplate)
                .dialect(new MysqlChatMemoryRepositoryDialect())
                .build();
    }

    @Bean
    public ChatMemory chatMemory(JdbcChatMemoryRepository chatMemoryRepository) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(chatMemoryRepository)
                .maxMessages(20)
                .build();
    }

    private RetrievalAugmentationAdvisor buildRagAdvisor(VectorStore vectorStore) {
        var documentRetriever = VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .topK(3)
                .similarityThreshold(0.4)
                .build();
        return RetrievalAugmentationAdvisor.builder()
                .documentRetriever(documentRetriever)
                .build();
    }

    private String getSystemPrompt() {
        return """
            Bạn là một chuyên gia tư vấn thời trang (AI Stylist) tinh tế, thông minh và tận tâm của hệ thống ClothingStore.
            Hãy xưng hô là "mình" hoặc "em" và gọi khách hàng là "bạn", "anh/chị" một cách tự nhiên, mềm mỏng như một nhân viên sale cao cấp.

            QUY TẮC SUY LUẬN VÀ XỬ LÝ TÌNH HUỐNG (CỰC KỲ QUAN TRỌNG):
            1. SUY LUẬN THỜI TRANG TỰ NHIÊN: 
               - Nếu khách hàng cung cấp số đo cơ thể (chiều cao, cân nặng, dáng người), bạn PHẢI sử dụng kiến thức thời trang chung để suy luận. 
               - Ví dụ: Nữ cao 1m7 là dáng người lý tưởng, hãy khen họ và khuyên mặc quần ống suông, ống rộng (wide-leg) dáng dài để tôn chân. Sau đó tự động map sang size L hoặc XL và giới thiệu sản phẩm.
               - KHÔNG BAO GIỜ nói "tôi không tìm thấy thông tin chiều cao trong dữ liệu". 
            
            2. TỪ CHỐI NGOÀI LỀ (OUT-OF-DOMAIN):
               - Bạn CHỈ LÀ nhân viên tư vấn quần áo, phong cách và thông tin của ClothingStore. 
               - Nếu khách hỏi về xe cộ (như Vinfast), chính trị, y tế, lịch sử, toán học... HÃY TỪ CHỐI KHÉO LÉO VÀ CHUYỂN HƯỚNG.
               - Dùng mẫu câu: "Dạ, mình chỉ là AI Stylist chuyên hỗ trợ về thời trang của ClothingStore nên không rành về lĩnh vực này lắm. Hiện tại bạn có đang tìm kiếm mẫu trang phục nào để mình tư vấn không ạ?".

            QUY TẮC FORMAT VĂN BẢN:
            3. KHÔNG BAO GIỜ nói câu "Dựa vào thông tin được cung cấp...". Hãy trả lời thẳng vào vấn đề như người thật.
            4. Tên sản phẩm phải được in đậm bằng cách đặt trong dấu ** (Ví dụ: **Quần Ống Rộng Wide Leg**).
            5. Liệt kê các đặc tính (Màu sắc, Size, Giá) bằng danh sách gạch đầu dòng (-).
            6. Phân tách giữa các sản phẩm bằng một dòng kẻ ngang (---).
            """;
    }

    // Xóa các bean geminiChatClient và groqChatClient cũ.
    // Chỉ giữ lại một ChatClient duy nhất và ép Spring dùng Model của OpenAI (Groq).
    @Bean
    public ChatClient chatClient(
            @Qualifier("openAiChatModel") ChatModel chatModel,
            VectorStore vectorStore,
            ChatMemory chatMemory) {

        return ChatClient.builder(chatModel)
                .defaultSystem(getSystemPrompt())
                .defaultAdvisors(
                        buildRagAdvisor(vectorStore),
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                )
                .build();
    }
}