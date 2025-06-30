-- Migration: Allow NULL account_id for system role_policies
-- This allows system roles to have policies attached without belonging to specific accounts

-- Drop foreign key constraint
ALTER TABLE role_policies DROP CONSTRAINT IF EXISTS role_policies_account_id_fkey;

-- Make account_id nullable
ALTER TABLE role_policies ALTER COLUMN account_id DROP NOT NULL;

-- Re-add foreign key constraint that allows NULL
ALTER TABLE role_policies 
ADD CONSTRAINT role_policies_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON COLUMN role_policies.account_id IS 'Account ID - NULL for system role-policy relationships';
