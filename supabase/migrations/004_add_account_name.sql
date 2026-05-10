-- Phase 9: Add account metadata tracking
-- Store account name and track when tokens are updated

ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS account_name VARCHAR;

ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
