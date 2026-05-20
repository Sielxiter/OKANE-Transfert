-- =====================================================
-- AUDIT SERVICE
-- Handles:
-- 1. sensitive action tracking
-- 2. user activity logs
-- 3. security/audit history
-- =====================================================


-- =====================================================
-- TABLE: audit_logs
-- Stores all important actions done in the system
-- Example: transfer created, payout done, user login, fee grid updated
-- =====================================================
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- User who performed the action
    -- Can be NULL for system actions
    user_id BIGINT NULL,

    -- User role at the moment of action
    -- Example: ROLE_ADMIN, ROLE_AGENT
    user_role VARCHAR(50),

    -- Action type
    -- Example:
    -- LOGIN_SUCCESS, LOGIN_FAILED
    -- TRANSFER_CREATED, TRANSFER_CANCELLED
    -- PAYOUT_COMPLETED
    -- CASH_SESSION_OPENED, CASH_SESSION_CLOSED
    -- FEE_GRID_UPDATED
    -- EXCHANGE_RATE_UPDATED
    action VARCHAR(100) NOT NULL,

    -- Entity/table affected by the action
    -- Example: transfers, payouts, users, agencies
    entity_name VARCHAR(100),

    -- ID of the affected entity
    entity_id BIGINT,

    -- Short description of the action
    description VARCHAR(255),

    -- Request IP address
    ip_address VARCHAR(100),

    -- Browser/device info
    user_agent VARCHAR(255),

    -- Action date/time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);