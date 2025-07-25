-- database/schema.sql - Production-ready database schema with RLS and indexes

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    organization VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
    subscription_plan VARCHAR(50),
    subscription_expires_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTION MANAGEMENT TABLES
-- =============================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('monthly', 'yearly')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENT MANAGEMENT TABLES
-- =============================================

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

-- Payment history for audit trail
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

-- =============================================
-- TENDER MANAGEMENT TABLES
-- =============================================

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

-- =============================================
-- USAGE TRACKING TABLES
-- =============================================

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

-- =============================================
-- LOGGING AND MONITORING TABLES
-- =============================================

-- Application logs
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    context JSONB,
    error JSONB,
    request_id VARCHAR(100),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    service VARCHAR(100),
    environment VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    tags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron job logs
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    duration_ms INTEGER,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECURITY TABLES
-- =============================================

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    context JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Subscription plans indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_email ON user_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ends_at ON user_subscriptions(ends_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email_status ON user_subscriptions(user_email, status);

-- Payment orders indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_email ON payment_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_expires_at ON payment_orders(expires_at);

-- Payment history indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_email ON payment_history(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_event ON payment_history(event);
CREATE INDEX IF NOT EXISTS idx_payment_history_timestamp ON payment_history(timestamp);

-- Tenders indexes
CREATE INDEX IF NOT EXISTS idx_tenders_name ON tenders USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tenders_source ON tenders(source);
CREATE INDEX IF NOT EXISTS idx_tenders_posted_date ON tenders(posted_date);
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_tenders_organization ON tenders(organization);
CREATE INDEX IF NOT EXISTS idx_tenders_category ON tenders(category);
CREATE INDEX IF NOT EXISTS idx_tenders_location ON tenders(location);
CREATE INDEX IF NOT EXISTS idx_tenders_is_active ON tenders(is_active);
CREATE INDEX IF NOT EXISTS idx_tenders_created_at ON tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_tenders_source_created ON tenders(source, created_at);
CREATE INDEX IF NOT EXISTS idx_tenders_tags ON tenders USING gin(tags);

-- User tender access indexes
CREATE INDEX IF NOT EXISTS idx_user_tender_access_user_id ON user_tender_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tender_access_tender_id ON user_tender_access(tender_id);
CREATE INDEX IF NOT EXISTS idx_user_tender_access_accessed_at ON user_tender_access(accessed_at);

-- User usage indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_email ON user_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);
CREATE INDEX IF NOT EXISTS idx_user_usage_email_date ON user_usage(user_email, date);

-- Application logs indexes
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_service ON application_logs(service);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_request_id ON application_logs(request_id);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING gin(tags);

-- Cron logs indexes
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp ON cron_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_cron_logs_level ON cron_logs(level);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all user-related tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tender_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY user_profiles_own_data ON user_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY user_profiles_admin_access ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User sessions policies
CREATE POLICY user_sessions_own_data ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- User subscriptions policies
CREATE POLICY user_subscriptions_own_data ON user_subscriptions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_subscriptions_admin_access ON user_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment orders policies
CREATE POLICY payment_orders_own_data ON payment_orders
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY payment_orders_admin_access ON payment_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment history policies
CREATE POLICY payment_history_own_data ON payment_history
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY payment_history_admin_access ON payment_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User tender access policies
CREATE POLICY user_tender_access_own_data ON user_tender_access
    FOR ALL USING (user_id = auth.uid());

-- User usage policies
CREATE POLICY user_usage_own_data ON user_usage
    FOR ALL USING (user_id = auth.uid());

-- Application logs policies (admin only)
CREATE POLICY application_logs_admin_access ON application_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Security events policies (admin only)
CREATE POLICY security_events_admin_access ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tenders table is publicly readable (no RLS needed)
-- Other tables like subscription_plans, metrics, cron_logs are managed by service role

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
    BEFORE UPDATE ON tenders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CLEANUP FUNCTIONS
-- =============================================

-- Function to cleanup old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
    -- Delete logs older than 90 days
    DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '90 days';
    DELETE FROM cron_logs WHERE timestamp < NOW() - INTERVAL '90 days';
    DELETE FROM metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '180 days' AND resolved = true;
    DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 day';
    DELETE FROM user_sessions WHERE expires_at < NOW();
    DELETE FROM payment_orders WHERE expires_at < NOW() AND status = 'created';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription statuses
CREATE OR REPLACE FUNCTION update_subscription_statuses() RETURNS void AS $$
BEGIN
    -- Update expired subscriptions
    UPDATE user_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND ends_at < NOW();
    
    -- Update user profiles subscription status
    UPDATE user_profiles 
    SET subscription_status = 'expired', updated_at = NOW()
    WHERE subscription_status = 'active' 
    AND subscription_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA (Optional - for development)
-- =============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Basic', 'Basic access to tenders', 299.00, 2999.00, '["Access to basic tenders", "Email notifications", "Basic search"]'),
('Pro', 'Professional access with advanced features', 599.00, 5999.00, '["Access to all tenders", "Advanced search", "Priority support", "Download history"]'),
('Enterprise', 'Enterprise features for organizations', 1299.00, 12999.00, '["Everything in Pro", "API access", "Custom integrations", "Dedicated support"]')
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE user_profiles IS 'User account information and preferences';
COMMENT ON TABLE user_sessions IS 'Active user sessions for JWT token management';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE user_subscriptions IS 'User subscription records and status';
COMMENT ON TABLE payment_orders IS 'Payment order tracking with Razorpay integration';
COMMENT ON TABLE payment_history IS 'Audit trail for all payment events';
COMMENT ON TABLE tenders IS 'Tender notices and related information';
COMMENT ON TABLE user_tender_access IS 'Tracking of user access to tenders';
COMMENT ON TABLE user_usage IS 'Daily usage statistics per user';
COMMENT ON TABLE application_logs IS 'Application-wide logging for debugging and monitoring';
COMMENT ON TABLE metrics IS 'System and business metrics for monitoring';
COMMENT ON TABLE cron_logs IS 'Cron job execution logs';
COMMENT ON TABLE security_events IS 'Security-related events and incidents';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking per user/endpoint';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
-- Note: Adjust these based on your specific needs and security requirements

-- Public read access to subscription plans
GRANT SELECT ON subscription_plans TO authenticated;

-- Public read access to active tenders
GRANT SELECT ON tenders TO authenticated;

-- Users can read/write their own data (enforced by RLS)
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_orders TO authenticated;
GRANT SELECT ON payment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_tender_access TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;

-- Service role has full access (bypasses RLS)
-- This is handled automatically by Supabase for the service role