-- =====================================================
-- CHATBOT SERVICE
-- Handles:
-- 1. chatbot conversations
-- 2. chatbot messages history
-- 3. FAQ knowledge base
-- 4. escalation to human agent
-- =====================================================


-- =====================================================
-- TABLE: chatbot_sessions
-- Represents one conversation between user and chatbot
-- =====================================================
CREATE TABLE chatbot_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- User who started the chatbot session
    -- Can be NULL if visitor is not logged in
    user_id BIGINT NULL,

    -- OPEN / CLOSED / ESCALATED
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Language used in conversation: FR / EN / AR
    language VARCHAR(10) NOT NULL DEFAULT 'FR',

    -- Session start time
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Session end time
    ended_at TIMESTAMP NULL,

    CONSTRAINT fk_chatbot_session_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);


-- =====================================================
-- TABLE: chatbot_messages
-- Stores all messages exchanged in a chatbot session
-- =====================================================
CREATE TABLE chatbot_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related chatbot session
    session_id BIGINT NOT NULL,

    -- Sender type: USER / BOT / AGENT
    sender_type VARCHAR(50) NOT NULL,

    -- Optional sender user if message is from logged user or agent
    sender_user_id BIGINT NULL,

    -- Message content
    message TEXT NOT NULL,

    -- Message intent detected by chatbot
    -- Example: TRANSFER_STATUS / FEES / DELAY / GENERAL_FAQ
    detected_intent VARCHAR(100),

    -- Timestamp of message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chatbot_message_session
        FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chatbot_message_sender_user
        FOREIGN KEY (sender_user_id) REFERENCES users(id)
        ON DELETE SET NULL
);


