import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zmuipksmwmgxctlaybdw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWlwa3Ntd21neGN0bGF5YmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjQyOTMsImV4cCI6MjA5NDIwMDI5M30.7u-vNgtQVzrlakKJBMPkapyy-b4kqsQOyoEsRg2ADz8";

const isValidUrl = (url: string) => {
  try {
    const d = new URL(url);
    return d.protocol === 'http:' || d.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = () => {
  return isValidUrl(supabaseUrl) && !!supabaseKey;
};

// Lazy initialization to avoid crashes if URL is invalid
let client: any = null;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Redirecting call to dummy handler.');
      return () => ({ data: null, error: new Error('Supabase not configured') });
    }
    if (!client) {
      client = createClient(supabaseUrl, supabaseKey);
    }
    return client[prop];
  }
});
