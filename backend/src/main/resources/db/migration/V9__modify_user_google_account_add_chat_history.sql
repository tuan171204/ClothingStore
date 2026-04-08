ALTER TABLE users MODIFY password VARCHAR(255) NULL; ALTER TABLE users ADD provider VARCHAR(20) DEFAULT 'LOCAL';

CREATE TABLE IF NOT EXISTS spring_ai_chat_memory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    content TEXT,
    metadata TEXT, -- Lưu dạng chuỗi JSON
    type VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id)
);