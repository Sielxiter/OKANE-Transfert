-- =====================================================
-- CURRENCY & FX SERVICE
-- Handles:
-- 1. currencies
-- 2. countries
-- 3. allowed transfer corridors
-- 4. exchange rates history
-- =====================================================


-- =====================================================
-- TABLE: currencies
-- Stores supported currencies
-- Example: MAD, EUR, USD, GBP
-- =====================================================
CREATE TABLE currencies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- ISO currency code
    code VARCHAR(10) NOT NULL UNIQUE,

    -- Currency name
    name VARCHAR(100) NOT NULL,

    -- Currency symbol
    symbol VARCHAR(10),

    -- Active or disabled currency
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- TABLE: countries
-- Stores supported countries
-- Each country has one default currency
-- =====================================================
CREATE TABLE countries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- ISO country code
    code VARCHAR(10) NOT NULL UNIQUE,

    -- Country name
    name VARCHAR(100) NOT NULL,

    -- Default currency of the country
    currency_id BIGINT NOT NULL,

    -- Active or disabled country
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_country_currency
        FOREIGN KEY (currency_id) REFERENCES currencies(id)
);


-- =====================================================
-- TABLE: transfer_corridors
-- Represents allowed transfer routes
-- Example: Morocco -> Senegal
-- =====================================================
CREATE TABLE transfer_corridors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Sender country
    source_country_id BIGINT NOT NULL,

    -- Receiver country
    destination_country_id BIGINT NOT NULL,

    -- Active or disabled corridor
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Optional daily transfer limit for this corridor
    daily_limit DECIMAL(15,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_corridor_source_country
        FOREIGN KEY (source_country_id) REFERENCES countries(id),

    CONSTRAINT fk_corridor_destination_country
        FOREIGN KEY (destination_country_id) REFERENCES countries(id),

    -- Avoid duplicate corridors
    CONSTRAINT uk_corridor
        UNIQUE (source_country_id, destination_country_id)
);


-- =====================================================
-- TABLE: exchange_rates
-- Stores exchange rate history
-- Used to calculate transfer net amount
-- =====================================================
CREATE TABLE exchange_rates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Source currency
    from_currency_id BIGINT NOT NULL,

    -- Destination currency
    to_currency_id BIGINT NOT NULL,

    -- Rate value
    -- Example: 1 EUR = 10.80 MAD
    rate DECIMAL(15,6) NOT NULL,

    -- MANUAL / EXTERNAL_API
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',

    -- Date/time when this rate becomes active
    effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- User who added/updated the rate
    created_by BIGINT NULL,

    CONSTRAINT fk_exchange_from_currency
        FOREIGN KEY (from_currency_id) REFERENCES currencies(id),

    CONSTRAINT fk_exchange_to_currency
        FOREIGN KEY (to_currency_id) REFERENCES currencies(id),

    CONSTRAINT fk_exchange_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
);