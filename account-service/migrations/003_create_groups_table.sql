-- Migration: Create groups table
-- Description: Groups for organizing users and applying policies
-- Version: 003

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    path VARCHAR(255) DEFAULT '/' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT groups_name_length CHECK (length(name) >= 1 AND length(name) <= 100),
    CONSTRAINT groups_path_format CHECK (path ~ '^/.*/$' OR path = '/'),
    
    -- Unique constraint: group name must be unique within an account
    CONSTRAINT groups_name_account_unique UNIQUE (account_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_account_id ON groups(account_id);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_path ON groups(path);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- Create user_groups junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: user can only be in a group once
    CONSTRAINT user_groups_unique UNIQUE (user_id, group_id)
);

-- Create indexes for user_groups
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_created_at ON user_groups(created_at);

-- Insert default groups for each account
DO $$
DECLARE
    account_record RECORD;
BEGIN
    -- Create default Administrators group for each existing account
    FOR account_record IN SELECT id FROM accounts LOOP
        INSERT INTO groups (account_id, name, description, path)
        VALUES (
            account_record.id,
            'Administrators',
            'Full access to all resources and administrative functions',
            '/'
        )
        ON CONFLICT (account_id, name) DO NOTHING;
        
        INSERT INTO groups (account_id, name, description, path)
        VALUES (
            account_record.id,
            'Users',
            'Standard user access with limited permissions',
            '/'
        )
        ON CONFLICT (account_id, name) DO NOTHING;
    END LOOP;
END
$$;
