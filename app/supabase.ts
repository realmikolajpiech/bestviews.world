import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient | null = null;

function requireConfig() {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase is not configured');
  return { supabaseUrl, supabaseKey };
}

export function createSupabaseServerClient() {
  const config = requireConfig();
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const config = requireConfig();
    browserClient = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

export function publicPhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const config = requireConfig();
  return `${config.supabaseUrl}/storage/v1/object/public/viewpoint-photos/${path}`;
}
