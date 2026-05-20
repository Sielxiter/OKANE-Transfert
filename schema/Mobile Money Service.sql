-- =====================================================
-- MOBILE MONEY SERVICE
-- Handles:
-- 1. mobile money operators
-- 2. transfer payout to mobile wallet
-- 3. simulated operator transaction status
-- 4. reconciliation with operator records
-- =====================================================


-- =====================================================
-- TABLE: mobile_money_operators
-- Stores supported mobile money operators
-- Example: Orange Money, Wave, M-Pesa
-- =====================================================
CREATE TABLE mobile_money_operators (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Operator name
    name VARCHAR(100) NOT NULL,

    -- Operator code
    code VARCHAR(50) NOT NULL UNIQUE,

    -- Country where operator is available
    country_id BIGINT NOT NULL,

    -- Active or disabled operator
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mobile_operator_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);


-- =====================================================
-- TABLE: mobile_money_transfers
-- Stores mobile money payout simulation
-- One transfer can have one mobile money payout
-- =====================================================
CREATE TABLE mobile_money_transfers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related Okane transfer
    transfer_id BIGINT NOT NULL UNIQUE,

    -- Mobile money operator used
    operator_id BIGINT NOT NULL,

    -- Beneficiary customer
    beneficiary_id BIGINT NOT NULL,

    -- Beneficiary wallet phone number
    wallet_phone VARCHAR(30) NOT NULL,

    -- Amount sent to wallet
    -- Must equal transfers.net_amount
    amount DECIMAL(15,2) NOT NULL,

    -- PENDING / SUCCESS / FAILED / CANCELLED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Fake/operator transaction reference
    operator_reference VARCHAR(100) UNIQUE,

    -- Agent or system user who initiated mobile money payout
    initiated_by BIGINT NOT NULL,

    -- Request timestamp
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Completion timestamp
    completed_at TIMESTAMP NULL,

    -- Operator response or failure reason
    provider_response TEXT,

    CONSTRAINT fk_mobile_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id),

    CONSTRAINT fk_mobile_operator
        FOREIGN KEY (operator_id) REFERENCES mobile_money_operators(id),

    CONSTRAINT fk_mobile_beneficiary
        FOREIGN KEY (beneficiary_id) REFERENCES customers(id),

    CONSTRAINT fk_mobile_initiated_by
        FOREIGN KEY (initiated_by) REFERENCES users(id)
);


-- =====================================================
-- TABLE: mobile_money_reconciliations
-- Stores reconciliation result with operator statement
-- Used to verify if simulated operator confirms payment
-- =====================================================
CREATE TABLE mobile_money_reconciliations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related mobile money transfer
    mobile_money_transfer_id BIGINT NOT NULL UNIQUE,

    -- Operator reference checked
    operator_reference VARCHAR(100) NOT NULL,

    -- Expected amount from Okane system
    expected_amount DECIMAL(15,2) NOT NULL,

    -- Amount confirmed by operator
    operator_amount DECIMAL(15,2) NOT NULL,

    -- MATCHED / AMOUNT_MISMATCH / NOT_FOUND
    status VARCHAR(50) NOT NULL,

    -- User who performed reconciliation
    reconciled_by BIGINT NULL,

    -- Reconciliation timestamp
    reconciled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Optional note
    note VARCHAR(255),

    CONSTRAINT fk_mobile_reconciliation_transfer
        FOREIGN KEY (mobile_money_transfer_id) REFERENCES mobile_money_transfers(id),

    CONSTRAINT fk_mobile_reconciliation_user
        FOREIGN KEY (reconciled_by) REFERENCES users(id)
);