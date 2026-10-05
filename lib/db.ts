import { createClient } from "@supabase/supabase-js";
export function getDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
}
export const hoyUY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
