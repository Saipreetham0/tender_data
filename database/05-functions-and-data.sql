-- Step 5: Functions and Sample Data
-- Run this after Step 4

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

CREATE TRIGGER update_email_subscriptions_updated_at
    BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Basic', 'Basic access to tenders', 299.00, 2999.00, '["Access to basic tenders", "Email notifications", "Basic search"]'),
('Pro', 'Professional access with advanced features', 599.00, 5999.00, '["Access to all tenders", "Advanced search", "Priority support", "Download history"]'),
('Enterprise', 'Enterprise features for organizations', 1299.00, 12999.00, '["Everything in Pro", "API access", "Custom integrations", "Dedicated support"]')
ON CONFLICT DO NOTHING;