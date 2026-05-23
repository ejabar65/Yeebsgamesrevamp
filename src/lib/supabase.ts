import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => (window as any).SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const getSupabaseKey = () => (window as any).SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    const d = new URL(url);
    return d.protocol === 'http:' || d.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = () => {
  return isValidUrl(getSupabaseUrl()) && !!getSupabaseKey();
};

// Lazy initialization and dummy chainable proxy to avoid crashes if URL is invalid
let client: any = null;

const createDummyProxy = (): any => {
  const dummy: any = () => createDummyProxy();
  dummy.select = () => createDummyProxy();
  dummy.insert = () => createDummyProxy();
  dummy.update = () => createDummyProxy();
  dummy.delete = () => createDummyProxy();
  dummy.upsert = () => createDummyProxy();
  dummy.eq = () => createDummyProxy();
  dummy.single = () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  dummy.then = (onRes: any) => onRes({ data: null, error: new Error('Supabase not configured') });
  return dummy;
};

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Accessing dummy chainable proxy.');
      return createDummyProxy()[prop] || createDummyProxy();
    }
    if (!client) {
      client = createClient(getSupabaseUrl(), getSupabaseKey());
    }
    return client[prop];
  }
});
