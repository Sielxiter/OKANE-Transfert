-- =====================================================
-- FEES & COMMISSION SERVICE
-- Handles:
-- 1. fee grids
-- 2. fee brackets by amount range
-- 3. commission sharing between agency and central
-- =====================================================


-- =====================================================
-- TABLE: fee_grids
-- Represents a pricing grid
-- Example: Morocco -> Senegal fees grid
-- =====================================================
CREATE TABLE fee_grids (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Grid name
    name VARCHAR(150) NOT NULL,

    -- Optional corridor relation
    -- If NULL, grid can be global/default
    corridor_id BIGINT NULL,

    -- Currency used for amount ranges and fees
    currency_id BIGINT NOT NULL,

    -- Active or inactive grid
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Start date of this pricing grid
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- End date, NULL means still active
    effective_to TIMESTAMP NULL,

    -- Admin who created this grid
    created_by BIGINT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fee_grid_corridor
        FOREIGN KEY (corridor_id) REFERENCES transfer_corridors(id),

    CONSTRAINT fk_fee_grid_currency
        FOREIGN KEY (currency_id) REFERENCES currencies(id),

    CONSTRAINT fk_fee_grid_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
);


-- =====================================================
-- TABLE: fee_brackets
-- Stores fee rules by amount interval
-- Example:
-- 0 - 500 MAD => 20 MAD fee
-- 501 - 1000 MAD => 35 MAD fee
-- =====================================================
CREATE TABLE fee_brackets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Parent fee grid
    fee_grid_id BIGINT NOT NULL,

    -- Minimum transfer amount
    min_amount DECIMAL(15,2) NOT NULL,

    -- Maximum transfer amount
    max_amount DECIMAL(15,2) NOT NULL,

    -- FIXED or PERCENTAGE
    fee_type VARCHAR(50) NOT NULL,

    -- If FIXED: fee_value = exact fee amount
    -- If PERCENTAGE: fee_value = percentage rate
    fee_value DECIMAL(15,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fee_bracket_grid
        FOREIGN KEY (fee_grid_id) REFERENCES fee_grids(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE: commission_rules
-- Defines how collected fees are split
-- between agency and central company
-- =====================================================
CREATE TABLE commission_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Related fee grid
    fee_grid_id BIGINT NOT NULL,

    -- Agency part of fee in percentage
    -- Example: 40 means agency gets 40%
    agency_percentage DECIMAL(5,2) NOT NULL,

    -- Central company part of fee in percentage
    -- Example: 60 means central gets 60%
    central_percentage DECIMAL(5,2) NOT NULL,

    -- Active or inactive rule
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_commission_rule_grid
        FOREIGN KEY (fee_grid_id) REFERENCES fee_grids(id)
        ON DELETE CASCADE
);


