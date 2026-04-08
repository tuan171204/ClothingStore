package com.example.clothingstore.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.memory.repository.jdbc.MysqlChatMemoryRepositoryDialect;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class AiChatConfig {
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

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, VectorStore vectorStore, ChatMemory chatMemory) {

        var documentRetriever = VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .topK(3)
                .similarityThreshold(0.4)
                .build();

        var ragAdvisor = RetrievalAugmentationAdvisor.builder()
                .documentRetriever(documentRetriever)
                .build();

        return builder
                .defaultSystem("""
                    Bạn là nhân viên tư vấn thời trang AI của hệ thống ClothingStore.
                    Nhiệm vụ của bạn là tư vấn nhiệt tình dựa trên các thông tin sản phẩm được cung cấp.
                    QUY TẮC PHẢN HỒI:
                    1. Sử dụng Markdown để định dạng câu trả lời.
                    2. Tên sản phẩm phải được in đậm bằng cách đặt trong dấu ** (Ví dụ: **Áo Thun Nam**).
                    3. Liệt kê các đặc tính sản phẩm (Màu sắc, Kích thước, Giá) bằng danh sách gạch đầu dòng (-).
                    4. Phân tách các sản phẩm bằng một dòng kẻ ngang (---).
                    5. Trả lời ngắn gọn, thân thiện và sử dụng ngôn ngữ tiếng Việt tự nhiên.
                    """)
                .defaultAdvisors(
                        ragAdvisor,
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                )
                .build();
    }
}