-- Migration: 007_update_users_email_constraint.sql
-- Update users table to allow null email for IAM users only

-- Remove old email constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_format;

-- Allow email to be nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Drop the unique constraint on email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Add constraint: only root users can have email, IAM users must have null email
ALTER TABLE users ADD CONSTRAINT users_email_root_only 
    CHECK ((is_root = true AND email IS NOT NULL) OR (is_root = false AND email IS NULL));

-- Add constraint: email format check only when email is not null
ALTER TABLE users ADD CONSTRAINT users_email_format 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add unique constraint on email only when not null (for root users)
CREATE UNIQUE INDEX users_email_unique_idx ON users (email) WHERE email IS NOT NULL;

-- Add first_name and last_name columns if they don't exist (only for root users)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add constraint: only root users can have first_name and last_name
ALTER TABLE users ADD CONSTRAINT users_names_root_only 
    CHECK ((is_root = true) OR (is_root = false AND first_name IS NULL AND last_name IS NULL));
