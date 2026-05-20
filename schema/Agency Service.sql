-- 1. Agencies
CREATE TABLE agencies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,

    phone VARCHAR(30),
    email VARCHAR(150),

    daily_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User agency assignment
-- Links managers and agents to an agency
CREATE TABLE agency_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    agency_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_agency_users_agency
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agency_users_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_agency_user UNIQUE (agency_id, user_id)
);