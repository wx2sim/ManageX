import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a browser-side Supabase client.
 * Safe to use inside client-side components ('use client').
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
