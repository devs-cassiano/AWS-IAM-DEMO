-- Migration: 002_create_users_table.sql
-- Create users table with foreign key to accounts

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_root BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_format CHECK (username ~* '^[A-Za-z0-9._-]+$'),
    CONSTRAINT users_username_length CHECK (LENGTH(username) >= 2 AND LENGTH(username) <= 100),
    CONSTRAINT users_status_valid CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT users_password_hash_length CHECK (LENGTH(password_hash) >= 10),
    
    -- Unique constraint for username within account
    CONSTRAINT users_username_account_unique UNIQUE (account_id, username)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_root ON users(is_root);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_id, status);
CREATE INDEX IF NOT EXISTS idx_users_account_root ON users(account_id, is_root);

-- Trigger to automatically update updated_at on users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
