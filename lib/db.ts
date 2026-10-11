import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente creado recién al usarlo: así el build no falla si faltan variables de entorno.
let cliente: SupabaseClient | null = null;
export const db = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    cliente ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const v = (cliente as any)[prop];
    return typeof v === "function" ? v.bind(cliente) : v;
  },
});
export const hoyUY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
