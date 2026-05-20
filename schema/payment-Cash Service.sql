-- =====================================================
-- PAYMENT / CASH SERVICE
-- Handles:
-- 1. agent daily cash sessions
-- 2. transfer payout
-- 3. cash movements
-- 4. cash closure
-- 5. missing/extra funds reports
-- =====================================================


-- =====================================================
-- TABLE: agent_cash_sessions
-- Represents an agent's working cash session for the day
-- Agent must open a session before creating transfers/payouts
-- =====================================================
CREATE TABLE agent_cash_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Agent who owns this cash session
    agent_id BIGINT NOT NULL,

    -- Agency where the agent works during this session
    agency_id BIGINT NOT NULL,

    -- Business date of this session
    session_date DATE NOT NULL,

    -- Cash available at session start
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- OPEN / CLOSED
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Opening timestamp
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Closing timestamp
    closed_at TIMESTAMP NULL,

    CONSTRAINT fk_cash_session_agent
        FOREIGN KEY (agent_id) REFERENCES users(id),

    CONSTRAINT fk_cash_session_agency
        FOREIGN KEY (agency_id) REFERENCES agencies(id),

    -- One cash session per agent per day
    CONSTRAINT uk_agent_session_date
        UNIQUE (agent_id, session_date)
);


-- =====================================================
-- TABLE: payouts
-- Stores withdrawal/payment of a transfer
-- One transfer can be paid only once
-- =====================================================
CREATE TABLE payouts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfer being withdrawn
    transfer_id BIGINT NOT NULL UNIQUE,

    -- Cash session of the agent who pays the beneficiary
    cash_session_id BIGINT NOT NULL,

    -- Beneficiary who receives the money
    beneficiary_id BIGINT NOT NULL,

    -- Agency where withdrawal happened
    payout_agency_id BIGINT NOT NULL,

    -- Agent who processed withdrawal
    paid_by BIGINT NOT NULL,

    -- Must equal transfers.net_amount
    paid_amount DECIMAL(15,2) NOT NULL,

    -- Payment timestamp
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payout_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id),

    CONSTRAINT fk_payout_cash_session
        FOREIGN KEY (cash_session_id) REFERENCES agent_cash_sessions(id),

    CONSTRAINT fk_payout_beneficiary
        FOREIGN KEY (beneficiary_id) REFERENCES customers(id),

    CONSTRAINT fk_payout_agency
        FOREIGN KEY (payout_agency_id) REFERENCES agencies(id),

    CONSTRAINT fk_payout_paid_by
        FOREIGN KEY (paid_by) REFERENCES users(id)
);


-- =====================================================
-- TABLE: cash_movements
-- Tracks every money movement in an agent cash session
-- =====================================================
CREATE TABLE cash_movements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Cash session concerned by this movement
    cash_session_id BIGINT NOT NULL,

    -- Agency concerned
    agency_id BIGINT NOT NULL,

    -- Agent who performed the operation
    user_id BIGINT NOT NULL,

    -- TRANSFER_IN = sender pays amount + fees
    -- PAYOUT_OUT  = beneficiary receives transfer.net_amount
    movement_type VARCHAR(50) NOT NULL,

    -- For TRANSFER_IN: amount = transfer.amount + transfer.fee_amount
    -- For PAYOUT_OUT: amount = transfer.net_amount
    amount DECIMAL(15,2) NOT NULL,

    -- Related transfer, if movement is transfer creation
    transfer_id BIGINT NULL,

    -- Related payout, if movement is withdrawal
    payout_id BIGINT NULL,

    -- Movement timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Optional explanation
    description VARCHAR(255),

    CONSTRAINT fk_cash_movement_session
        FOREIGN KEY (cash_session_id) REFERENCES agent_cash_sessions(id),

    CONSTRAINT fk_cash_movement_agency
        FOREIGN KEY (agency_id) REFERENCES agencies(id),

    CONSTRAINT fk_cash_movement_user
        FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT fk_cash_movement_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id),

    CONSTRAINT fk_cash_movement_payout
        FOREIGN KEY (payout_id) REFERENCES payouts(id)
);


-- =====================================================
-- TABLE: cash_closures
-- End-of-day cash reconciliation for one cash session
-- =====================================================
CREATE TABLE cash_closures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Session being closed
    cash_session_id BIGINT NOT NULL UNIQUE,

    -- Agent who closes the session
    closed_by BIGINT NOT NULL,

    -- Calculated by system:
    -- opening_balance
    -- + SUM(TRANSFER_IN)
    -- - SUM(PAYOUT_OUT)
    expected_balance DECIMAL(15,2) NOT NULL,

    -- Real counted cash by agent
    actual_balance DECIMAL(15,2) NOT NULL,

    -- actual_balance - expected_balance
    difference_amount DECIMAL(15,2) NOT NULL,

    -- Closing timestamp
    closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Optional note
    note VARCHAR(255),

    CONSTRAINT fk_cash_closure_session
        FOREIGN KEY (cash_session_id) REFERENCES agent_cash_sessions(id),

    CONSTRAINT fk_cash_closure_user
        FOREIGN KEY (closed_by) REFERENCES users(id)
);


-- =====================================================
-- TABLE: fund_discrepancies
-- Reports missing or extra funds after cash closure
-- Created only if difference_amount != 0
-- =====================================================
CREATE TABLE fund_discrepancies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related cash closure
    cash_closure_id BIGINT NOT NULL UNIQUE,

    -- Cash session where discrepancy happened
    cash_session_id BIGINT NOT NULL,

    -- Agent/manager who reported the discrepancy
    reported_by BIGINT NOT NULL,

    -- Expected cash from system
    expected_balance DECIMAL(15,2) NOT NULL,

    -- Real counted cash
    actual_balance DECIMAL(15,2) NOT NULL,

    -- actual_balance - expected_balance
    difference_amount DECIMAL(15,2) NOT NULL,

    -- MISSING_FUNDS / EXTRA_FUNDS
    discrepancy_type VARCHAR(50) NOT NULL,

    -- OPEN / RESOLVED
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Explanation
    description VARCHAR(255),

    -- Report timestamp
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_discrepancy_closure
        FOREIGN KEY (cash_closure_id) REFERENCES cash_closures(id),

    CONSTRAINT fk_discrepancy_session
        FOREIGN KEY (cash_session_id) REFERENCES agent_cash_sessions(id),

    CONSTRAINT fk_discrepancy_reported_by
        FOREIGN KEY (reported_by) REFERENCES users(id)
);