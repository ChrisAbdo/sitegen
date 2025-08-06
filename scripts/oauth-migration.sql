-- Migration to ensure database supports multiple OAuth providers
-- This adds any missing indexes and ensures proper constraints

-- Add index on account provider and account_id for faster OAuth lookups
create index if not exists idx_account_provider_account_id on
   account (
      provider_id,
      account_id
   );

-- Add index on user email for linking accounts with same email
create index if not exists idx_user_email on
   "user" (
      email
   );

-- Add index on account user_id for faster user account lookups
create index if not exists idx_account_user_id on
   account (
      user_id
   );

-- Ensure provider_id values are valid (optional constraint)
-- ALTER TABLE account ADD CONSTRAINT check_provider_id
--   CHECK (provider_id IN ('github', 'google', 'facebook', 'email'));

-- You can uncomment the above constraint if you want to enforce valid provider IDs