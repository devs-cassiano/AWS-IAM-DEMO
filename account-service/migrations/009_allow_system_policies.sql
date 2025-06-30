-- Migration: Allow NULL account_id for system policies
-- This allows the creation of system-wide policies that don't belong to specific accounts

-- First, drop the foreign key constraint
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_account_id_fkey;

-- Make account_id nullable
ALTER TABLE policies ALTER COLUMN account_id DROP NOT NULL;

-- Update the unique constraint to handle NULL account_id
-- Drop the old constraint
DROP INDEX IF EXISTS policies_name_account_unique;

-- Create new unique constraint that allows multiple NULL account_id values
-- but ensures uniqueness for non-NULL account_id
CREATE UNIQUE INDEX policies_name_account_unique 
ON policies (account_id, name) 
WHERE account_id IS NOT NULL;

-- For system policies (account_id IS NULL), ensure name uniqueness
CREATE UNIQUE INDEX policies_system_name_unique 
ON policies (name) 
WHERE account_id IS NULL;

-- Re-add foreign key constraint that allows NULL
ALTER TABLE policies 
ADD CONSTRAINT policies_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add check constraint for system policies
ALTER TABLE policies 
ADD CONSTRAINT policies_system_type_check 
CHECK (
  (account_id IS NULL AND policy_type = 'System') OR 
  (account_id IS NOT NULL AND policy_type IN ('AWS', 'Custom', 'Inline'))
);

-- Update policy_type valid values to include 'System'
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_type_valid;
ALTER TABLE policies 
ADD CONSTRAINT policies_type_valid 
CHECK (policy_type IN ('AWS', 'Custom', 'Inline', 'System'));

-- Add comments
COMMENT ON COLUMN policies.account_id IS 'Account ID - NULL for system-wide policies';
COMMENT ON CONSTRAINT policies_system_type_check ON policies IS 'System policies must have NULL account_id';
COMMENT ON INDEX policies_system_name_unique IS 'Ensures unique names for system policies';
COMMENT ON INDEX policies_name_account_unique IS 'Ensures unique names per account for non-system policies';
