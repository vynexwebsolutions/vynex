// VYNEX/backend/functions/contact-submit/index.ts
// OPTIONAL hardened endpoint (Supabase Edge Function, Deno). The website already inserts forms
// directly using Row Level Security; deploy this if you want server-side validation + rate limiting.
// Deploy:  supabase functions deploy contact-submit
// Secrets are provided automatically: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server-side only!)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map<string, number[]>(); // simple per-instance rate limit
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return json({ error: "Too many requests. Please try again later." }, 429);
  hits.set(ip, [...recent, now]);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (b.website) return json({ ok: true }); // honeypot

  const row = {
    name: clean(b.name, 120), email: clean(b.email, 160), phone: clean(b.phone, 40) || null,
    subject: clean(b.subject, 160) || null, message: clean(b.message, 3000),
  };
  if (row.name.length < 2 || !emailRe.test(row.email) || row.message.length < 10) return json({ error: "Please check your details." }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("contact_inquiries").insert(row);
  if (error) return json({ error: "Could not save your message." }, 500);
  return json({ ok: true });
});
