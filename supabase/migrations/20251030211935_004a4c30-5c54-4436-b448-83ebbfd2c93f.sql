-- Create security_audit_log table for Edge Function logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  new_values jsonb,
  old_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin'));

-- System can insert audit logs (via Edge Functions with service role)
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_security_audit_log_timestamp ON public.security_audit_log(timestamp DESC);
CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_operation ON public.security_audit_log(operation);

-- Fix admin_notifications RLS - restrict INSERT to admin users only
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.admin_notifications;

CREATE POLICY "Admin users can insert notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin'));

-- Add rate limiting helper for audit logs (optional cleanup after 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.security_audit_log
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;