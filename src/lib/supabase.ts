import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'xqlrqwksrjkrjpdmzjof';
export const SUPABASE_URL = 'https://xqlrqwksrjkrjpdmzjof.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_olNeZampSe1m7jNBDfl3QA_rl_qCVA6';
export const SUPABASE_REST_URL = 'https://xqlrqwksrjkrjpdmzjof.supabase.co/rest/v1/';

// Browser & Node compatible Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
