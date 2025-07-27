-- Step 3: Logging and Monitoring Tables
-- Run this after Step 2

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