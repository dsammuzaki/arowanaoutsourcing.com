import nodemailer from "nodemailer";
import { createAdminClient, hasAdmin } from "@/utils/supabase/admin";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arowanaoutsourcing-com.vercel.app";

/**
 * Kirim email transaksional.
 * Prioritas: SMTP (mis. Gmail) bila SMTP_HOST/SMTP_USER/SMTP_PASS diset,
 * lalu Resend bila RESEND_API_KEY diset. Aman (no-op) bila keduanya kosong.
 */
export async function sendEmail(to: string | string[], subject: string, html: string) {
  const list = Array.from(new Set((Array.isArray(to) ? to : [to]).filter(Boolean)));
  if (list.length === 0) return;
  const from =
    process.env.MAIL_FROM || process.env.SMTP_USER || "Barata Sakti Utama <onboarding@resend.dev>";

  // 1) SMTP (Gmail dll.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({ from, to: list.join(","), subject, html });
      return;
    } catch {
      /* fallback ke Resend bila ada */
    }
  }

  // 2) Resend
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: list, subject, html }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    /* jangan pernah gagalkan aksi utama karena email */
  }
}

export function emailHtml(opts: {
  title: string;
  intro: string;
  lines?: string[];
  ctaLabel?: string;
  ctaPath?: string;
}) {
  const lines = (opts.lines ?? [])
    .map((l) => `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px">${l}</p>`)
    .join("");
  const cta = opts.ctaPath
    ? `<a href="${SITE}${opts.ctaPath}" style="display:inline-block;background:#1a7d9c;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;margin-top:8px">${
        opts.ctaLabel ?? "Buka Aplikasi"
      }</a>`
    : "";
  return `<div style="margin:0;padding:24px;background:#eef2f4;font-family:Segoe UI,Arial,sans-serif"><div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(10,32,41,.08)"><div style="background:#0a2029;padding:22px 28px;text-align:center"><img src="${SITE}/bsu-logo.png" width="46" alt="BSU"/><p style="color:#fff;font-size:15px;margin:8px 0 0;font-weight:bold">Barata Sakti Utama</p></div><div style="padding:28px"><h2 style="color:#0a2029;font-size:18px;margin:0 0 8px">${opts.title}</h2><p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px">${opts.intro}</p>${lines}${cta}</div><div style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:11px;margin:0">Notifikasi otomatis · Sistem Manajemen Outsourcing BSU</p></div></div></div>`;
}

export async function getUserEmail(id?: string | null): Promise<string | null> {
  if (!id || !hasAdmin()) return null;
  try {
    const { data } = await createAdminClient().auth.admin.getUserById(id);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function getEmailsByRoles(roles: string[]): Promise<string[]> {
  if (!hasAdmin()) return [];
  try {
    const admin = createAdminClient();
    const { data: profs } = await admin.from("profiles").select("id").in("role", roles);
    const ids = new Set((profs ?? []).map((p) => p.id as string));
    if (!ids.size) return [];
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    return (data?.users ?? [])
      .filter((u) => ids.has(u.id) && u.email)
      .map((u) => u.email as string);
  } catch {
    return [];
  }
}
