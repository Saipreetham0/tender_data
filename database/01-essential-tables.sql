-- Step 1 Alternative: Essential Tables Only
-- Use this if the original Step 1 had issues

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email subscriptions table (essential for fixing your error)
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    campus VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, campus)
);

-- Basic user profiles table (simplified)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    subscription_status VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert basic subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly) VALUES
('Basic', 'Basic access to tenders', 299.00, 2999.00),
('Pro', 'Professional access', 599.00, 5999.00)
ON CONFLICT DO NOTHING;