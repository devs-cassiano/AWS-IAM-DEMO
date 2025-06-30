-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT DEFAULT '',
    path VARCHAR(512) DEFAULT '/',
    assume_role_policy_document JSONB NOT NULL,
    max_session_duration INTEGER DEFAULT 3600, -- 1 hour in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT roles_name_account_unique UNIQUE (name, account_id),
    CONSTRAINT roles_name_check CHECK (name ~ '^[a-zA-Z0-9+=,.@\-_]+$'),
    CONSTRAINT roles_name_length_check CHECK (LENGTH(name) BETWEEN 1 AND 128),
    CONSTRAINT roles_path_check CHECK (path ~ '^/.*'),
    CONSTRAINT roles_max_session_duration_check CHECK (max_session_duration BETWEEN 900 AND 43200) -- 15 minutes to 12 hours
);

-- Create role policies junction table (for managed policies attached to roles)
CREATE TABLE IF NOT EXISTS role_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_policies_unique UNIQUE (role_id, policy_id)
);

-- Create role inline policies table (for policies embedded directly in roles)
CREATE TABLE IF NOT EXISTS role_inline_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    policy_name VARCHAR(128) NOT NULL,
    policy_document JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_inline_policies_unique UNIQUE (role_id, policy_name),
    CONSTRAINT role_inline_policies_name_check CHECK (policy_name ~ '^[a-zA-Z0-9+=,.@\-_]+$')
);

-- Create role sessions table (for tracking assumed role sessions)
CREATE TABLE IF NOT EXISTS role_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for external principals
    session_name VARCHAR(64) NOT NULL,
    external_id VARCHAR(1224), -- For external assume role
    source_ip INET,
    user_agent TEXT,
    assumed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_token_hash VARCHAR(255) NOT NULL, -- Hash of the session token
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_sessions_name_check CHECK (session_name ~ '^[a-zA-Z0-9+=,.@\-_]+$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_account_id ON roles(account_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_role_policies_role_id ON role_policies(role_id);
CREATE INDEX IF NOT EXISTS idx_role_policies_policy_id ON role_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_role_inline_policies_role_id ON role_inline_policies(role_id);
CREATE INDEX IF NOT EXISTS idx_role_sessions_role_id ON role_sessions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_sessions_user_id ON role_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_sessions_expires_at ON role_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_role_sessions_active ON role_sessions(is_active);

-- Insert some default roles with trust policies
INSERT INTO roles (account_id, name, description, path, assume_role_policy_document, max_session_duration) 
SELECT 
    a.id as account_id,
    'AdminRole',
    'Administrator role with full access',
    '/',
    '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "sts:AssumeRole",
                "Condition": {
                    "StringEquals": {
                        "aws:RequestedRegion": "us-east-1"
                    }
                }
            }
        ]
    }'::jsonb,
    3600
FROM accounts a
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.account_id = a.id AND r.name = 'AdminRole'
);

INSERT INTO roles (account_id, name, description, path, assume_role_policy_document, max_session_duration) 
SELECT 
    a.id as account_id,
    'ReadOnlyRole',
    'Read-only role with limited access',
    '/',
    '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'::jsonb,
    7200
FROM accounts a
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.account_id = a.id AND r.name = 'ReadOnlyRole'
);

-- Attach default policies to roles
INSERT INTO role_policies (account_id, role_id, policy_id)
SELECT 
    r.account_id,
    r.id as role_id,
    p.id as policy_id
FROM roles r
CROSS JOIN policies p
WHERE r.name = 'AdminRole' 
  AND p.name = 'FullAccessPolicy'
  AND r.account_id = p.account_id
  AND NOT EXISTS (
    SELECT 1 FROM role_policies rp 
    WHERE rp.role_id = r.id AND rp.policy_id = p.id
  );

INSERT INTO role_policies (account_id, role_id, policy_id)
SELECT 
    r.account_id,
    r.id as role_id,
    p.id as policy_id
FROM roles r
CROSS JOIN policies p
WHERE r.name = 'ReadOnlyRole' 
  AND p.name = 'ReadOnlyPolicy'
  AND r.account_id = p.account_id
  AND NOT EXISTS (
    SELECT 1 FROM role_policies rp 
    WHERE rp.role_id = r.id AND rp.policy_id = p.id
  );
