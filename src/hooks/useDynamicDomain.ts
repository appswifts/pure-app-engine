import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicDomain = () => {
  const [domain, setDomain] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock domain until system_settings table is created
    const mockDomain = window.location.origin;
    setDomain(mockDomain);
    setLoading(false);
  }, []);

  return { domain, loading };
};