-- Quick Fix: Just create the email_subscriptions table
-- This will fix your "Subscription system is not properly set up" error

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    campus VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, campus)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_subscriptions TO anon;