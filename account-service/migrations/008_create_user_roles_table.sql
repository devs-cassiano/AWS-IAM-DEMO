-- Migration: Create user_roles table
-- This table manages the assignment of roles to users

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_by VARCHAR(255) DEFAULT 'system',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- Add comments
COMMENT ON TABLE user_roles IS 'Manages the assignment of roles to users';
COMMENT ON COLUMN user_roles.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN user_roles.role_id IS 'Foreign key to roles table';
COMMENT ON COLUMN user_roles.assigned_by IS 'Who assigned the role (system, admin, etc.)';
COMMENT ON COLUMN user_roles.assigned_at IS 'When the role was assigned';
