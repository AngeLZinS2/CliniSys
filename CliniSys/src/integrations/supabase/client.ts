// Supabase client wrapper. Uses the anon/publishable key from Vite env.
// Safe to import as either a named export or the default export:
// import { supabase } from '@/integrations/supabase/client';
// import supabase from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Prefer the ANON key name but fall back to the older PUBLISHABLE_KEY name if present.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export default supabase;