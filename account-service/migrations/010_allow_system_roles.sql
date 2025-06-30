-- Migration: Allow NULL account_id for system roles
-- This allows the creation of system-wide roles that don't belong to specific accounts

-- First, drop the foreign key constraint
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_account_id_fkey;

-- Make account_id nullable
ALTER TABLE roles ALTER COLUMN account_id DROP NOT NULL;

-- Update the unique constraint to handle NULL account_id
-- Drop the old constraint
DROP INDEX IF EXISTS roles_name_account_unique;

-- Create new unique constraint that allows multiple NULL account_id values
-- but ensures uniqueness for non-NULL account_id
CREATE UNIQUE INDEX roles_name_account_unique 
ON roles (account_id, name) 
WHERE account_id IS NOT NULL;

-- For system roles (account_id IS NULL), ensure name uniqueness
CREATE UNIQUE INDEX roles_system_name_unique 
ON roles (name) 
WHERE account_id IS NULL;

-- Re-add foreign key constraint that allows NULL
ALTER TABLE roles 
ADD CONSTRAINT roles_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON COLUMN roles.account_id IS 'Account ID - NULL for system-wide roles';
COMMENT ON INDEX roles_system_name_unique IS 'Ensures unique names for system roles';
COMMENT ON INDEX roles_name_account_unique IS 'Ensures unique names per account for non-system roles';
