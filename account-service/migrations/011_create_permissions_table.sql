-- Create permissions table
-- Permissions are granular actions that can be grouped into policies
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NULL,  -- NULL for system permissions
    service VARCHAR(50) NOT NULL,  -- AWS service (s3, ec2, iam, lambda, etc.)
    action VARCHAR(100) NOT NULL,  -- Specific action (s3:GetObject, ec2:DescribeInstances, etc.)
    resource_pattern VARCHAR(500) DEFAULT '*',  -- Resource pattern or ARN
    effect VARCHAR(10) NOT NULL DEFAULT 'Allow' CHECK (effect IN ('Allow', 'Deny')),
    conditions JSONB DEFAULT '{}',  -- Additional conditions for the permission
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,  -- System permissions cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT permissions_service_action_unique UNIQUE (account_id, service, action, resource_pattern, effect),
    CONSTRAINT fk_permissions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create policy_permissions junction table
-- Links policies to their permissions
CREATE TABLE IF NOT EXISTS policy_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    
    -- Constraints
    CONSTRAINT policy_permissions_unique UNIQUE (policy_id, permission_id),
    CONSTRAINT fk_policy_permissions_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
    CONSTRAINT fk_policy_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_account_service ON permissions(account_id, service);
CREATE INDEX IF NOT EXISTS idx_permissions_service_action ON permissions(service, action);
CREATE INDEX IF NOT EXISTS idx_permissions_system ON permissions(is_system);
CREATE INDEX IF NOT EXISTS idx_policy_permissions_policy ON policy_permissions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_permissions_permission ON policy_permissions(permission_id);

-- Insert some common system permissions
INSERT INTO permissions (account_id, service, action, resource_pattern, effect, description, is_system) VALUES
-- IAM permissions
(NULL, 'iam', 'iam:ListUsers', '*', 'Allow', 'List all users in account', TRUE),
(NULL, 'iam', 'iam:CreateUser', '*', 'Allow', 'Create new users', TRUE),
(NULL, 'iam', 'iam:DeleteUser', '*', 'Allow', 'Delete users', TRUE),
(NULL, 'iam', 'iam:UpdateUser', '*', 'Allow', 'Update user information', TRUE),
(NULL, 'iam', 'iam:GetUser', '*', 'Allow', 'Get user details', TRUE),
(NULL, 'iam', 'iam:ListRoles', '*', 'Allow', 'List all roles', TRUE),
(NULL, 'iam', 'iam:CreateRole', '*', 'Allow', 'Create new roles', TRUE),
(NULL, 'iam', 'iam:DeleteRole', '*', 'Allow', 'Delete roles', TRUE),
(NULL, 'iam', 'iam:AttachRolePolicy', '*', 'Allow', 'Attach policies to roles', TRUE),
(NULL, 'iam', 'iam:DetachRolePolicy', '*', 'Allow', 'Detach policies from roles', TRUE),
(NULL, 'iam', 'iam:ListPolicies', '*', 'Allow', 'List all policies', TRUE),
(NULL, 'iam', 'iam:CreatePolicy', '*', 'Allow', 'Create new policies', TRUE),
(NULL, 'iam', 'iam:DeletePolicy', '*', 'Allow', 'Delete policies', TRUE),

-- S3 permissions
(NULL, 's3', 's3:ListBucket', '*', 'Allow', 'List objects in bucket', TRUE),
(NULL, 's3', 's3:GetObject', '*', 'Allow', 'Read objects from bucket', TRUE),
(NULL, 's3', 's3:PutObject', '*', 'Allow', 'Write objects to bucket', TRUE),
(NULL, 's3', 's3:DeleteObject', '*', 'Allow', 'Delete objects from bucket', TRUE),
(NULL, 's3', 's3:CreateBucket', '*', 'Allow', 'Create new buckets', TRUE),
(NULL, 's3', 's3:DeleteBucket', '*', 'Allow', 'Delete buckets', TRUE),

-- EC2 permissions
(NULL, 'ec2', 'ec2:DescribeInstances', '*', 'Allow', 'List EC2 instances', TRUE),
(NULL, 'ec2', 'ec2:RunInstances', '*', 'Allow', 'Launch EC2 instances', TRUE),
(NULL, 'ec2', 'ec2:TerminateInstances', '*', 'Allow', 'Terminate EC2 instances', TRUE),
(NULL, 'ec2', 'ec2:StopInstances', '*', 'Allow', 'Stop EC2 instances', TRUE),
(NULL, 'ec2', 'ec2:StartInstances', '*', 'Allow', 'Start EC2 instances', TRUE),

-- Lambda permissions
(NULL, 'lambda', 'lambda:ListFunctions', '*', 'Allow', 'List Lambda functions', TRUE),
(NULL, 'lambda', 'lambda:CreateFunction', '*', 'Allow', 'Create Lambda functions', TRUE),
(NULL, 'lambda', 'lambda:DeleteFunction', '*', 'Allow', 'Delete Lambda functions', TRUE),
(NULL, 'lambda', 'lambda:InvokeFunction', '*', 'Allow', 'Invoke Lambda functions', TRUE);

-- Update trigger for permissions table
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permissions_updated_at_trigger
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();
