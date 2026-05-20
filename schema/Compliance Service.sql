-- =====================================================
-- COMPLIANCE SERVICE
-- Handles:
-- 1. KYC identity verification
-- 2. AML watchlist checking
-- 3. suspicious transaction reports
-- 4. compliance decisions
-- =====================================================


-- =====================================================
-- TABLE: kyc_checks
-- Stores identity verification result for customers
-- =====================================================
CREATE TABLE kyc_checks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Customer being verified
    customer_id BIGINT NOT NULL,

    -- Agent/admin who performed verification
    checked_by BIGINT NULL,

    -- PENDING / VERIFIED / REJECTED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- CIN / PASSPORT pattern validation result
    identity_pattern_valid BOOLEAN NOT NULL DEFAULT FALSE,

    -- Optional explanation
    notes VARCHAR(255),

    -- Verification timestamp
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_kyc_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id),

    CONSTRAINT fk_kyc_checked_by
        FOREIGN KEY (checked_by) REFERENCES users(id)
);


-- =====================================================
-- TABLE: watchlist_entries
-- Fictive OFAC-like blacklist
-- Used to detect blocked/suspicious persons
-- =====================================================
CREATE TABLE watchlist_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Person full name
    full_name VARCHAR(200) NOT NULL,

    -- Optional identity number
    identity_number VARCHAR(100),

    -- Optional country
    country VARCHAR(100),

    -- Reason for being listed
    reason VARCHAR(255),

    -- Active / inactive entry
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Creation timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- TABLE: aml_checks
-- Stores AML checking result for a transfer
-- =====================================================
CREATE TABLE aml_checks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related transfer
    transfer_id BIGINT NOT NULL,

    -- Sender checked
    sender_id BIGINT NOT NULL,

    -- Beneficiary checked
    beneficiary_id BIGINT NOT NULL,

    -- PENDING / PASSED / FLAGGED / BLOCKED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- TRUE if sender matched watchlist
    sender_watchlist_match BOOLEAN NOT NULL DEFAULT FALSE,

    -- TRUE if beneficiary matched watchlist
    beneficiary_watchlist_match BOOLEAN NOT NULL DEFAULT FALSE,

    -- TRUE if amount exceeds suspicious threshold
    amount_threshold_exceeded BOOLEAN NOT NULL DEFAULT FALSE,

    -- Risk score from 0 to 100
    risk_score INT NOT NULL DEFAULT 0,

    -- Explanation of result
    result_notes VARCHAR(255),

    -- Check timestamp
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aml_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id),

    CONSTRAINT fk_aml_sender
        FOREIGN KEY (sender_id) REFERENCES customers(id),

    CONSTRAINT fk_aml_beneficiary
        FOREIGN KEY (beneficiary_id) REFERENCES customers(id)
);


-- =====================================================
-- TABLE: suspicious_reports
-- Generated when AML check detects suspicious activity
-- =====================================================
CREATE TABLE suspicious_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related transfer
    transfer_id BIGINT NOT NULL,

    -- Related AML check
    aml_check_id BIGINT NOT NULL,

    -- Customer concerned by suspicion
    customer_id BIGINT NOT NULL,

    -- WATCHLIST_MATCH / HIGH_AMOUNT / REPEATED_TRANSFERS / MANUAL_REPORT
    report_type VARCHAR(50) NOT NULL,

    -- OPEN / REVIEWED / DISMISSED / CONFIRMED
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Description of suspicious activity
    description TEXT NOT NULL,

    -- Admin/compliance user who reviewed report
    reviewed_by BIGINT NULL,

    -- Review timestamp
    reviewed_at TIMESTAMP NULL,

    -- Report creation timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_suspicious_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id),

    CONSTRAINT fk_suspicious_aml
        FOREIGN KEY (aml_check_id) REFERENCES aml_checks(id),

    CONSTRAINT fk_suspicious_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id),

    CONSTRAINT fk_suspicious_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
);