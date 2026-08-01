-- ============================================
-- Fix Supabase Linter Issues
-- Apply this script to resolve RLS, functions, and policy issues
-- ============================================

-- ─── 1. ENABLE ROW LEVEL SECURITY ───────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_intel_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddos_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_block_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddos_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- ─── 2. FIX FUNCTION SEARCH PATH MUTABLE ─────────────────────────
-- For public.estimate_compression_savings
CREATE OR REPLACE FUNCTION public.estimate_compression_savings(data JSONB)
RETURNS JSONB
SET search_path = ''
AS $$
DECLARE
  original_size INTEGER;
  compressed_size INTEGER;
  compressed_data BYTEA;
BEGIN
  original_size = octet_length(data::text);
  compressed_data = compress(data::text, 'gzip');
  compressed_size = octet_length(compressed_data);
  RETURN jsonb_build_object(
    'original_size', original_size,
    'estimated_compressed_size', compressed_size,
    'savings_percentage', ROUND((1 - compressed_size::decimal / original_size) * 100, 2),
    'bytes_saved', original_size - compressed_size
  );
END;
$$ LANGUAGE plpgsql;

-- For public.should_compress_data
CREATE OR REPLACE FUNCTION public.should_compress_data(data JSONB, threshold_kb INTEGER DEFAULT 1)
RETURNS BOOLEAN
SET search_path = ''
AS $$
BEGIN
  RETURN octet_length(data::text) > threshold_kb * 1024;
END;
$$ LANGUAGE plpgsql;

-- For public.increment_session_page_count
CREATE OR REPLACE FUNCTION public.increment_session_page_count(session_uuid UUID)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  UPDATE public.ai_memory 
  SET page_count = page_count + 1, updated_at = NOW()
  WHERE session_id = session_uuid;
END;
$$ LANGUAGE plpgsql;

-- For public.update_session_duration
CREATE OR REPLACE FUNCTION public.update_session_duration(session_uuid UUID, duration_seconds INTEGER)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
  UPDATE public.ai_memory
  SET session_duration = duration_seconds, updated_at = NOW()
  WHERE session_id = session_uuid;
END;
$$ LANGUAGE plpgsql;

-- ─── 3. FIX OVERLY PERMISSIVE POLICIES ─────────────────────────
DO $$
BEGIN
  -- Drop overly permissive anon and authenticated policies for login_logs, error_logs, system_audit_logs
  DROP POLICY IF EXISTS "anon_all_access" ON public.login_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON public.error_logs;
  DROP POLICY IF EXISTS "anon_all_access" ON public.system_audit_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON public.login_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON public.error_logs;
  DROP POLICY IF EXISTS "authenticated_all_access" ON public.system_audit_logs;
  
  -- Re-add secure policies for authenticated users to read their own login_logs
  CREATE POLICY "authenticated_select_own" ON public.login_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());
    
  CREATE POLICY "authenticated_select_own_errors" ON public.error_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());
    
  -- Allow anon to only insert into error_logs (e.g., from public endpoints reporting issues)
  CREATE POLICY "anon_insert_errors" ON public.error_logs
    FOR INSERT TO anon WITH CHECK (char_length(message) > 0);
    
  -- Restrict system_audit_logs to service_role only (it already has service_role_all_access)
END $$;

-- ─── 4. ADD POLICIES FOR TABLES WITH NO POLICIES ─────────────────────────
-- public.ai_memory
DO $$
BEGIN
  CREATE POLICY "ai_memory_select_own" ON public.ai_memory
    FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- public.user_interactions
DO $$
BEGIN
  CREATE POLICY "user_interactions_select_own" ON public.user_interactions
    FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

SELECT '✅ Linter issues fixed!' as status;
