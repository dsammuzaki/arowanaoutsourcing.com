"use server";

import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { sendEmail, emailHtml, getUserEmail } from "@/lib/email";

export async function sendMessage(input: {
  toId: string;
  toName: string;
  body: string;
}): Promise<{ ok: boolean; id?: string; createdAt?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum aktif." };
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };
  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Pesan kosong." };
  if (!input.toId) return { ok: false, error: "Penerima tidak dikenal." };

  const { data: me } = await sb.from("profiles").select("full_name").eq("id", user.id).single();
  const fromName = me?.full_name || user.email || "Tim";

  const { data, error } = await sb
    .from("messages")
    .insert({ from_id: user.id, from_name: fromName, to_id: input.toId, to_name: input.toName, body })
    .select("id, created_at")
    .single();
  if (error) {
    if (/schema cache|does not exist|PGRST205/i.test(error.message))
      return { ok: false, error: "Tabel chat belum dibuat. Jalankan schema-7.sql." };
    return { ok: false, error: error.message };
  }

  // Notifikasi email ke penerima (best-effort)
  const email = await getUserEmail(input.toId);
  if (email)
    await sendEmail(
      email,
      `Pesan baru dari ${fromName}`,
      emailHtml({
        title: "Pesan baru",
        intro: `${fromName} mengirim pesan kepada Anda:`,
        lines: [`"${body.slice(0, 240)}"`],
        ctaPath: "/chat",
        ctaLabel: "Balas di Chat",
      })
    );

  return { ok: true, id: data?.id as string, createdAt: data?.created_at as string };
}

export async function markRead(peerId: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) return { ok: false };
  const sb = createClient(await cookies());
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false };
  await sb.from("messages").update({ read: true }).eq("to_id", user.id).eq("from_id", peerId).eq("read", false);
  return { ok: true };
}
