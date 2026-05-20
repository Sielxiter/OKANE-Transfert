-- =====================================================
-- TRANSFER SERVICE
-- Handles transfer creation and tracking
-- Withdrawal/payment is handled in Payment/Cash Service
-- =====================================================

CREATE TABLE transfers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Public reference used to track transfer
    reference_code VARCHAR(50) NOT NULL UNIQUE,

    -- Secret withdrawal code used by beneficiary
    withdrawal_code VARCHAR(50) NOT NULL UNIQUE,

    -- Sender customer
    sender_id BIGINT NOT NULL,

    -- Beneficiary customer
    beneficiary_id BIGINT NOT NULL,

    -- Agency where transfer was created
    source_agency_id BIGINT NOT NULL,

    -- Agent who created the transfer
    created_by BIGINT NOT NULL,

    -- Cash session of the agent during transfer creation
    cash_session_id BIGINT NOT NULL,

    -- Currency used in transfer
    currency_id BIGINT NOT NULL,

    -- Amount sent by sender, without fees
    amount DECIMAL(15,2) NOT NULL,

    -- Fees paid by sender
    fee_amount DECIMAL(15,2) NOT NULL,

    -- Exchange rate used at creation moment
    exchange_rate DECIMAL(15,6) NOT NULL,

    -- Amount beneficiary must receive
    net_amount DECIMAL(15,2) NOT NULL,

    -- PENDING / PAID / CANCELLED / EXPIRED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Transfer creation time
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Expiration date/time of withdrawal code
    expires_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transfer_sender
        FOREIGN KEY (sender_id) REFERENCES customers(id),

    CONSTRAINT fk_transfer_beneficiary
        FOREIGN KEY (beneficiary_id) REFERENCES customers(id),

    CONSTRAINT fk_transfer_source_agency
        FOREIGN KEY (source_agency_id) REFERENCES agencies(id),

    CONSTRAINT fk_transfer_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),

    CONSTRAINT fk_transfer_cash_session
        FOREIGN KEY (cash_session_id) REFERENCES agent_cash_sessions(id),

    CONSTRAINT fk_transfer_currency
        FOREIGN KEY (currency_id) REFERENCES currencies(id)
);


-- =====================================================
-- TABLE: transfer_status_history
-- Tracks each status change of a transfer
-- =====================================================
CREATE TABLE transfer_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related transfer
    transfer_id BIGINT NOT NULL,

    -- Previous status
    old_status VARCHAR(50),

    -- New status
    new_status VARCHAR(50) NOT NULL,

    -- User who changed status
    changed_by BIGINT NULL,

    -- Change timestamp
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Optional reason
    reason VARCHAR(255),

    CONSTRAINT fk_status_history_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_status_history_user
        FOREIGN KEY (changed_by) REFERENCES users(id)
);