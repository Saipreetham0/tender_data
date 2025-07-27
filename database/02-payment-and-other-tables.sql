-- Step 2: Payment and Other Tables
-- Run this after Step 1

-- Payment orders
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'expired')),
    payment_method VARCHAR(50),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    event VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tenders table
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    posted_date TIMESTAMPTZ NOT NULL,
    closing_date TIMESTAMPTZ NOT NULL,
    download_links JSONB NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    organization VARCHAR(255),
    category VARCHAR(100),
    estimated_value DECIMAL(15,2),
    location VARCHAR(255),
    contact_info JSONB,
    requirements JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tender access tracking
CREATE TABLE IF NOT EXISTS user_tender_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_type VARCHAR(20) DEFAULT 'view' CHECK (access_type IN ('view', 'download')),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(user_id, tender_id, access_type)
);

-- User usage tracking
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tender_views INTEGER DEFAULT 0,
    tender_downloads INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email, date)
);