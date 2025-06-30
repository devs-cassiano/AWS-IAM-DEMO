-- Migration: Create policies table
-- Description: IAM policies for fine-grained access control
-- Version: 004

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    path VARCHAR(255) DEFAULT '/' NOT NULL,
    policy_document JSONB NOT NULL,
    policy_type VARCHAR(50) DEFAULT 'Custom' NOT NULL,
    is_attachable BOOLEAN DEFAULT true NOT NULL,
    attachment_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT policies_name_length CHECK (length(name) >= 1 AND length(name) <= 128),
    CONSTRAINT policies_path_format CHECK (path ~ '^/.*/$' OR path = '/'),
    CONSTRAINT policies_type_valid CHECK (policy_type IN ('AWS', 'Custom', 'Inline')),
    CONSTRAINT policies_attachment_count_positive CHECK (attachment_count >= 0),
    
    -- Unique constraint: policy name must be unique within an account
    CONSTRAINT policies_name_account_unique UNIQUE (account_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policies_account_id ON policies(account_id);
CREATE INDEX IF NOT EXISTS idx_policies_name ON policies(name);
CREATE INDEX IF NOT EXISTS idx_policies_path ON policies(path);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_attachable ON policies(is_attachable);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);

-- Create GIN index for JSONB policy_document for fast queries
CREATE INDEX IF NOT EXISTS idx_policies_document_gin ON policies USING GIN (policy_document);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_policies_updated_at();

-- Create policy attachments tables for users and groups
CREATE TABLE IF NOT EXISTS user_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attached_by UUID REFERENCES users(id),
    
    -- Unique constraint: policy can only be attached to user once
    CONSTRAINT user_policies_unique UNIQUE (user_id, policy_id)
);

CREATE TABLE IF NOT EXISTS group_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attached_by UUID REFERENCES users(id),
    
    -- Unique constraint: policy can only be attached to group once
    CONSTRAINT group_policies_unique UNIQUE (group_id, policy_id)
);

-- Create indexes for policy attachments
CREATE INDEX IF NOT EXISTS idx_user_policies_user_id ON user_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_policies_policy_id ON user_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_group_policies_group_id ON group_policies(group_id);
CREATE INDEX IF NOT EXISTS idx_group_policies_policy_id ON group_policies(policy_id);

-- Insert default policies for each account
DO $$
DECLARE
    account_record RECORD;
    admin_group_id UUID;
    user_group_id UUID;
    admin_policy_id UUID;
    user_policy_id UUID;
BEGIN
    -- Create default policies for each existing account
    FOR account_record IN SELECT id FROM accounts LOOP
        
        -- Create Administrator Policy
        INSERT INTO policies (account_id, name, description, path, policy_document, policy_type)
        VALUES (
            account_record.id,
            'AdministratorAccess',
            'Provides full access to all resources and administrative functions',
            '/',
            '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": "*",
                        "Resource": "*"
                    }
                ]
            }'::jsonb,
            'AWS'
        )
        ON CONFLICT (account_id, name) DO NOTHING
        RETURNING id INTO admin_policy_id;
        
        -- Create Standard User Policy
        INSERT INTO policies (account_id, name, description, path, policy_document, policy_type)
        VALUES (
            account_record.id,
            'StandardUserAccess',
            'Provides read access to most resources and write access to user-specific resources',
            '/',
            '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "accounts:GetAccount",
                            "users:GetUser",
                            "users:UpdateUser",
                            "users:ChangePassword"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Deny",
                        "Action": [
                            "accounts:DeleteAccount",
                            "users:DeleteUser",
                            "users:CreateUser",
                            "groups:*",
                            "policies:*"
                        ],
                        "Resource": "*"
                    }
                ]
            }'::jsonb,
            'AWS'
        )
        ON CONFLICT (account_id, name) DO NOTHING
        RETURNING id INTO user_policy_id;
        
        -- Get group IDs
        SELECT id INTO admin_group_id FROM groups 
        WHERE account_id = account_record.id AND name = 'Administrators';
        
        SELECT id INTO user_group_id FROM groups 
        WHERE account_id = account_record.id AND name = 'Users';
        
        -- Attach policies to groups
        IF admin_policy_id IS NOT NULL AND admin_group_id IS NOT NULL THEN
            INSERT INTO group_policies (group_id, policy_id)
            VALUES (admin_group_id, admin_policy_id)
            ON CONFLICT (group_id, policy_id) DO NOTHING;
        END IF;
        
        IF user_policy_id IS NOT NULL AND user_group_id IS NOT NULL THEN
            INSERT INTO group_policies (group_id, policy_id)
            VALUES (user_group_id, user_policy_id)
            ON CONFLICT (group_id, policy_id) DO NOTHING;
        END IF;
        
    END LOOP;
END
$$;
