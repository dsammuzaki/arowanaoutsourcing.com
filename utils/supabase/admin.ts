import { createClient } from "@supabase/supabase-js";

// Klien SERVER-ONLY dengan secret key (bypass RLS). Jangan diimpor di komponen client.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

export const hasAdmin = () => Boolean(url && secret && !secret.startsWith("["));

export const createAdminClient = () =>
  createClient(url!, secret!, { auth: { autoRefreshToken: false, persistSession: false } });
