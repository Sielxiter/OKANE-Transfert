CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Link to auth user
    user_id BIGINT UNIQUE NOT NULL,

    identity_type VARCHAR(50) NOT NULL,     -- CIN, PASSPORT
    identity_number VARCHAR(100) NOT NULL,

    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_customer_identity
        UNIQUE (identity_type, identity_number),

    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);