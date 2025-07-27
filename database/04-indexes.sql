-- Step 4: Create Indexes (Safe Version)
-- Run this after Step 3

-- User profiles indexes (only if table and columns exist)
DO $$
BEGIN
    -- Check if user_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Email index (should always exist)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
        END IF;
        
        -- Role index (only if column exists)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
            CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
        END IF;
        
        -- Subscription status index (only if column exists)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_status') THEN
            CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
        END IF;
    END IF;
END
$$;

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
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ends_at ON user_subscriptions(ends_at);

-- Email subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_campus ON email_subscriptions(campus);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_active ON email_subscriptions(active);

-- Payment orders indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_email ON payment_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Tenders indexes
CREATE INDEX IF NOT EXISTS idx_tenders_source ON tenders(source);
CREATE INDEX IF NOT EXISTS idx_tenders_posted_date ON tenders(posted_date);
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date);
CREATE INDEX IF NOT EXISTS idx_tenders_is_active ON tenders(is_active);

-- User tender access indexes
CREATE INDEX IF NOT EXISTS idx_user_tender_access_user_id ON user_tender_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tender_access_tender_id ON user_tender_access(tender_id);

-- User usage indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_email ON user_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);