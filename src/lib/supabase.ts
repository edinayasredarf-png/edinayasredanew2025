import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient | undefined {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase config:', { 
    url: url ? 'SET' : 'NOT SET', 
    key: key ? 'SET' : 'NOT SET' 
  });
  
  if (!url || !key) {
    console.error('Supabase environment variables not set');
    return undefined;
  }
  
  client = createClient(url, key, { 
    auth: { 
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    } 
  });
  
  console.log('Supabase client created successfully');
  return client;
}
