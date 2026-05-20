-- =====================================================
-- NOTIFICATION SERVICE
-- Handles:
-- 1. OTP codes for 2FA and sensitive operations
-- 2. email / SMS / push notification history
-- 3. client notification preferences
-- =====================================================


-- =====================================================
-- TABLE: otp_codes
-- Stores temporary OTP codes
-- Used for 2FA, withdrawal confirmation, sensitive actions
-- =====================================================
CREATE TABLE otp_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- User who receives OTP
    user_id BIGINT NOT NULL,

    -- OTP code, usually 6 digits
    code VARCHAR(20) NOT NULL,

    -- LOGIN_2FA / TRANSFER_CONFIRMATION / PASSWORD_RESET / PAYOUT_CONFIRMATION
    purpose VARCHAR(50) NOT NULL,

    -- SMS / EMAIL
    channel VARCHAR(50) NOT NULL,

    -- Expiration time
    expires_at TIMESTAMP NOT NULL,

    -- TRUE if OTP already used
    used BOOLEAN NOT NULL DEFAULT FALSE,

    -- Creation timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Time when OTP was used
    used_at TIMESTAMP NULL,

    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE: notifications
-- Stores all notifications sent by the system
-- =====================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Recipient user
    user_id BIGINT NOT NULL,

    -- EMAIL / SMS / PUSH
    channel VARCHAR(50) NOT NULL,

    -- Notification type:
    -- TRANSFER_CREATED / TRANSFER_PAID / TRANSFER_CANCELLED
    -- OTP / SYSTEM_ALERT
    type VARCHAR(50) NOT NULL,

    -- Notification title
    title VARCHAR(150),

    -- Message content
    message TEXT NOT NULL,

    -- PENDING / SENT / FAILED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- External provider response or error message
    provider_response TEXT,

    -- When notification was created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- When notification was sent
    sent_at TIMESTAMP NULL,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE: notification_preferences
-- Stores how client wants to receive notifications
-- =====================================================
CREATE TABLE notification_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related user
    user_id BIGINT NOT NULL UNIQUE,

    -- Allow email notifications
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Allow SMS notifications
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Allow push notifications
    push_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Preferred language: FR / EN / AR
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'FR',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);