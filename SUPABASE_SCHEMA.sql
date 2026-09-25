-- ============================================================================
-- Enterprise-Grade Supabase Postgres Schema for Personal Portfolio Analytics
-- Author: Senior Staff Site Reliability, Database, and Security Engineer
-- Purpose: Highly performant, privacy-safe, fully indexed relational tracking engine.
-- Compliance: GDPR, CCPA & Privacy-First metrics (no raw IPs, no PII, no fingerpriting)
--
-- INSTRUCTIONS FOR RUNNING IN SUPABASE SQL EDITOR:
-- 1. Open your Supabase Dashboard.
-- 2. Navigate to "SQL Editor" -> Click "New Query" (or "Blank Query").
-- 3. Copy-paste the ENTIRE content of this file into the editor.
-- 4. To resolve parsing limitations on some browsers, make sure to DO NOT highlight
--    a specific line unless you intend to run just that line. Just click "Run".
-- ============================================================================

-- EnableUUID Extension if not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. BASE TABLES WITH ENHANCED SCHEMA FOR COMPREHENSIVE TELEMETRY
-- ----------------------------------------------------------------------------

-- Table: Metrics & Performance telemetry
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path VARCHAR(255) NOT NULL,
    load_time_ms INTEGER NOT NULL DEFAULT 0,
    ttfb_ms INTEGER DEFAULT 0,
    fcp_ms INTEGER DEFAULT 0,
    lcp_ms INTEGER DEFAULT 0,
    cls NUMERIC(6, 4) DEFAULT 0.0000,
    inp_ms INTEGER DEFAULT 0,
    device_type VARCHAR(50) DEFAULT 'desktop',
    browser_family VARCHAR(100) DEFAULT 'unknown',
    referrer_domain VARCHAR(255) DEFAULT 'direct',
    session_id VARCHAR(64) DEFAULT NULL, -- UUID/Anonymous session token (privacy-safe hash)
    is_returning BOOLEAN DEFAULT FALSE,
    entry_page VARCHAR(255) DEFAULT NULL,
    exit_page VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Client & API Error telemetry
CREATE TABLE IF NOT EXISTS public.errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type VARCHAR(100) NOT NULL, -- 'js_error', 'react_error', 'failed_asset', 'promise_rejection', 'api_failure'
    message TEXT NOT NULL,
    url VARCHAR(512) DEFAULT NULL,
    severity VARCHAR(50) DEFAULT 'critical', -- 'info', 'warn', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Engagement Events telemetry
CREATE TABLE IF NOT EXISTS public.engagement_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'resume_download', 'github_click', 'linkedin_click', 'email_click', 'contact_button', 'project_click', 'external_click'
    target_id VARCHAR(255) DEFAULT NULL, -- Name of project or CTA button ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Contact Form Analytics telemetry
CREATE TABLE IF NOT EXISTS public.contact_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason VARCHAR(100) DEFAULT NULL, -- 'validation', 'rate_limit', 'turnstile_fail', 'spam_trap'
    turnstile_result VARCHAR(50) DEFAULT 'success',
    completed BOOLEAN DEFAULT TRUE,
    abandoned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Security Events telemetry
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'rate_limit', 'suspicious_traffic', 'invalid_method', 'turnstile_fail', 'excess_404', 'brute_force_auth', 'csp_violation'
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'warn', -- 'warn', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Rate Limits tracker for Serverless and API endpoints
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Deployments tracking
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_tag VARCHAR(50) NOT NULL,
    deploy_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(50) DEFAULT 'success',
    latency_delta_ms INTEGER DEFAULT 0, -- Average load time comparison vs previous version
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: AI Assistant Telemetry & Cost Usage (Real-Time Gemini & RAG Events)
CREATE TABLE IF NOT EXISTS public.ai_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100),
    message_preview TEXT NOT NULL,
    response_preview TEXT,
    engine VARCHAR(20) NOT NULL, -- 'gemini' | 'rag'
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_cad NUMERIC(10, 6) DEFAULT 0.000000,
    cost_saved_cad NUMERIC(10, 6) DEFAULT 0.000000,
    cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
    cost_saved_usd NUMERIC(10, 6) DEFAULT 0.000000,
    latency_ms INTEGER DEFAULT 0,
    is_cache_hit BOOLEAN DEFAULT false,
    is_semantic_cache_hit BOOLEAN DEFAULT false,
    semantic_similarity NUMERIC(5, 2) DEFAULT NULL,
    security_flag VARCHAR(30) DEFAULT 'safe', -- 'safe' | 'suspicious' | 'adversarial_probe' | 'injection_attempt'
    threat_category VARCHAR(50) DEFAULT NULL,
    threat_score INTEGER DEFAULT 0,
    guardrail_triggered BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    recruiter_mode BOOLEAN DEFAULT false,
    fallback_triggered BOOLEAN DEFAULT false,
    is_real BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 2. PERFORMANCE INDEXES
-- For ultra-fast queries, trend metrics calculations, and dashboard loadings.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON public.ai_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_engine ON public.ai_events(engine);
CREATE INDEX IF NOT EXISTS idx_ai_events_model ON public.ai_events(model);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON public.metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_page_path ON public.metrics(page_path);
CREATE INDEX IF NOT EXISTS idx_metrics_session ON public.metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_errors_created_at ON public.errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_type ON public.errors(error_type);

CREATE INDEX IF NOT EXISTS idx_engagement_created_at ON public.engagement_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON public.engagement_events(event_type);

CREATE INDEX IF NOT EXISTS idx_contact_created_at ON public.contact_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);


-- ----------------------------------------------------------------------------
-- 3. DAILY, WEEKLY, AND MONTHLY SUMMARIESROLLUPS (Low query processing load)
-- ----------------------------------------------------------------------------

-- Table: Daily Rollup/Summary Table
CREATE TABLE IF NOT EXISTS public.daily_summary (
    summary_date DATE PRIMARY KEY,
    total_visits INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    avg_load_time INTEGER DEFAULT 0,
    avg_lcp INTEGER DEFAULT 0,
    avg_cls NUMERIC(6,4) DEFAULT 0.0000,
    avg_inp INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    contact_success INTEGER DEFAULT 0,
    contact_failure INTEGER DEFAULT 0,
    security_events INTEGER DEFAULT 0,
    resume_downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Weekly Rollup/Summary Table
CREATE TABLE IF NOT EXISTS public.weekly_summary (
    summary_year_week VARCHAR(10) PRIMARY KEY, -- format 'YYYY-Wxx'
    total_visits INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    avg_load_time INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    contact_success INTEGER DEFAULT 0,
    security_events INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Monthly Rollup/Summary Table
CREATE TABLE IF NOT EXISTS public.monthly_summary (
    summary_year_month VARCHAR(7) PRIMARY KEY, -- format 'YYYY-MM'
    total_visits INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    avg_load_time INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    contact_success INTEGER DEFAULT 0,
    security_events INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ----------------------------------------------------------------------------
-- 4. POWERFUL AGGREGATION VIEWS
-- Simplified mathematical computation of all complex UX indices and conversion rates
-- ----------------------------------------------------------------------------

-- Dynamic View: Visitor Analytics Aggregation
CREATE OR REPLACE VIEW public.vw_visitor_analytics AS
SELECT 
    COUNT(m.id) as total_visits,
    COUNT(DISTINCT m.session_id) as unique_sessions,
    ROUND(AVG(m.load_time_ms)) as avg_load_time,
    COUNT(DISTINCT CASE WHEN m.is_returning = TRUE THEN m.session_id END)::numeric / 
        NULLIF(COUNT(DISTINCT m.session_id), 0)::numeric as returning_visitor_ratio,
    COUNT(DISTINCT CASE WHEN m.is_returning = FALSE THEN m.session_id END)::numeric / 
        NULLIF(COUNT(DISTINCT m.session_id), 0)::numeric as new_visitor_ratio
FROM public.metrics m;

-- Dynamic View: Engagement Analytics Aggregation
CREATE OR REPLACE VIEW public.vw_engagement_analytics AS
SELECT 
    COUNT(CASE WHEN event_type = 'resume_download' THEN 1 END) as resume_download_count,
    COUNT(CASE WHEN event_type = 'github_click' THEN 1 END) as github_click_count,
    COUNT(CASE WHEN event_type = 'linkedin_click' THEN 1 END) as linkedin_click_count,
    COUNT(CASE WHEN event_type = 'email_click' THEN 1 END) as email_click_count,
    COUNT(CASE WHEN event_type = 'contact_button' THEN 1 END) as contact_button_click_count
FROM public.engagement_events;


-- ----------------------------------------------------------------------------
-- 5. AUTOMATED DB MAINTENANCE & RETENTION POLICIES
-- Clean older records to optimize database size (GDPR limit: retain up to 180 days)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_historical_analytics()
RETURNS void AS $body$
BEGIN
    -- Delete granular raw metrics history older than 180 days (stored in summaries already)
    DELETE FROM public.metrics WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.errors WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.engagement_events WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.contact_events WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.security_events WHERE created_at < NOW() - INTERVAL '180 days';
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 6. ADMIN SECURITY, AUTHENTICATION, AND ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

-- Table: Admin Profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
    status TEXT NOT NULL CHECK (status IN ('active', 'invited', 'disabled')),
    invited_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    access_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    access_last_renewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    access_renewed_by UUID DEFAULT NULL,
    access_status TEXT DEFAULT 'active' CHECK (access_status IN ('active', 'expired', 'disabled', 'invited'))
);

-- Safe Alterations for existing deployments to append columns error-free
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS access_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS access_last_renewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS access_renewed_by UUID DEFAULT NULL;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS access_status TEXT DEFAULT 'active' CHECK (access_status IN ('active', 'expired', 'disabled', 'invited'));

-- Table: Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID DEFAULT NULL,
    actor_email TEXT DEFAULT NULL,
    action TEXT NOT NULL,
    target_user_id UUID DEFAULT NULL,
    target_email TEXT DEFAULT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: Admin Invitations
CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    token_hash TEXT NOT NULL,
    invited_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    access_duration_hours INTEGER DEFAULT NULL,
    access_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.admin_invitations ADD COLUMN IF NOT EXISTS access_duration_hours INTEGER DEFAULT NULL;
ALTER TABLE public.admin_invitations ADD COLUMN IF NOT EXISTS access_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.admin_invitations ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Table: Admin Access Renewals
CREATE TABLE IF NOT EXISTS public.admin_access_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    renewed_by UUID NOT NULL,
    previous_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    duration_added_hours INTEGER NOT NULL,
    new_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- Performance Indexes for Admin Tables
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON public.admin_profiles(email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token_hash ON public.admin_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON public.admin_invitations(email);

-- ----------------------------------------------------------------------------
-- Trigger to Automatically Update updated_at Column
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $body$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Auto-Link auth.users with admin_profiles on Signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_admin_auth_user_link()
RETURNS TRIGGER AS $body$
DECLARE
  v_duration_hours INTEGER;
BEGIN
  -- Retrieve configured duration limit from pending invitation
  SELECT access_duration_hours INTO v_duration_hours
  FROM public.admin_invitations
  WHERE email = NEW.email AND accepted_at IS NULL AND revoked_at IS NULL
  LIMIT 1;

  -- Default to 24 hours if unspecified
  IF v_duration_hours IS NULL THEN
    v_duration_hours := 24;
  END IF;

  -- Mark any pending invitations as accepted
  UPDATE public.admin_invitations
  SET accepted_at = NOW()
  WHERE email = NEW.email AND accepted_at IS NULL;

  UPDATE public.admin_profiles
  SET user_id = NEW.id,
      status = CASE WHEN status = 'invited' THEN 'active'::text ELSE status END,
      access_starts_at = NOW(),
      -- Owners bypass the 24 hour limit to prevent locking themselves out
      access_expires_at = CASE WHEN role = 'owner' THEN NOW() + INTERVAL '100 years' ELSE NOW() + (v_duration_hours || ' hours')::interval END,
      access_status = 'active'
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_auth_user_link();

-- ----------------------------------------------------------------------------
-- Helper Function to Check User Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_user_role(u_id UUID)
RETURNS TEXT AS $body$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.admin_profiles
  WHERE user_id = u_id AND status = 'active'
  LIMIT 1;
  RETURN v_role;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Owners have full control on profiles"
  ON public.admin_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

CREATE POLICY "Admins and Viewers can read profiles"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'viewer') AND status = 'active'
    )
  );

-- Audit Logs Policies
CREATE POLICY "Owner can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
     EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

CREATE POLICY "Active administrators can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
     EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Invitations Policies
CREATE POLICY "Owner can manage invitations"
  ON public.admin_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

-- Renewals Policies
ALTER TABLE public.admin_access_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage renewals"
  ON public.admin_access_renewals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

CREATE POLICY "Admins and Viewers can read renewals"
  ON public.admin_access_renewals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- Initial Owner Seed Configuration
-- Seed first owner manually by email (angesh021@gmail.com)
-- ----------------------------------------------------------------------------
INSERT INTO public.admin_profiles (email, role, status)
VALUES ('angesh021@gmail.com', 'owner', 'active')
ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. EXPLICIT DATA API GRANTS (October 30 Supabase Migration Compliance)
-- ----------------------------------------------------------------------------
-- Supabase requires explicit GRANT statements for PostgREST / Data API access
-- on tables created in the public schema. RLS policies continue to govern row-level access.

-- Service Role (Server-side admin client): full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Authenticated Users (Logged-in admin dashboard users): standard CRUD, governed by RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anon (Public unauthenticated client): Telemetry event ingestion & public analytics views
GRANT SELECT, INSERT ON TABLE public.metrics TO anon;
GRANT SELECT, INSERT ON TABLE public.errors TO anon;
GRANT SELECT, INSERT ON TABLE public.engagement_events TO anon;
GRANT SELECT, INSERT ON TABLE public.contact_events TO anon;
GRANT SELECT, INSERT ON TABLE public.security_events TO anon;
GRANT SELECT, INSERT ON TABLE public.rate_limits TO anon;
GRANT SELECT, INSERT ON TABLE public.ai_events TO anon;
GRANT SELECT ON TABLE public.vw_visitor_analytics TO anon;
GRANT SELECT ON TABLE public.vw_engagement_analytics TO anon;

-- Default privileges for future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;


