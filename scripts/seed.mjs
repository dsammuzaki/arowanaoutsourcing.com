// =====================================================================
// Seed Supabase — buat akun login + isi seluruh karyawan.
// Jalankan: node scripts/seed.mjs
// Butuh SUPABASE_SECRET_KEY di .env.local (bypass RLS + admin auth).
// =====================================================================
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local ---
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!secret || secret.startsWith("[")) {
  console.error("❌ SUPABASE_SECRET_KEY belum diisi di .env.local. Isi dulu lalu jalankan lagi.");
  process.exit(1);
}
const sb = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

// --- akun login ---
const accounts = [
  { email: "superadmin@arowanabintang.co.id", password: "Super@ABP2026", full_name: "Super Admin", role: "super_admin" },
  { email: "operation@arowanabintang.co.id", password: "Operation@ABP2026", full_name: "Operation ABP", role: "operation" },
  { email: "director@arowanabintang.co.id", password: "Director@ABP2026", full_name: "Tri Antoro", role: "director" },
  { email: "finance@arowanabintang.co.id", password: "Finance@ABP2026", full_name: "Deo Galuh", role: "finance" },
];

async function findUserId(email) {
  const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users?.find((u) => u.email === email)?.id;
}

async function seedAccounts() {
  console.log("\n== Membuat akun login ==");
  for (const a of accounts) {
    const { data, error } = await sb.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: { full_name: a.full_name, role: a.role },
    });
    let userId = data?.user?.id;
    if (error) {
      if (/already/i.test(error.message)) {
        userId = await findUserId(a.email);
        // update password agar konsisten
        if (userId) await sb.auth.admin.updateUserById(userId, { password: a.password });
      } else {
        console.log(`  ! ${a.email}: ${error.message}`);
        continue;
      }
    }
    if (userId) {
      const { error: pErr } = await sb
        .from("profiles")
        .upsert({ id: userId, full_name: a.full_name, role: a.role }, { onConflict: "id" });
      if (pErr) console.log(`  ! profil ${a.email}: ${pErr.message}`);
      else console.log(`  ✓ ${a.role.padEnd(12)} ${a.email}  (pass: ${a.password})`);
    }
  }
}

// --- generator karyawan (sama dgn lib/data.ts) ---
const clients = [
  { id: "als", contractType: "staff", headcount: 42 },
  { id: "dpm", contractType: "security", headcount: 18 },
  { id: "mkw", contractType: "cleaning", headcount: 25 },
  { id: "snt", contractType: "driver", headcount: 14 },
];
const positionsByType = {
  staff: ["Office Boy", "Staff CCR", "Perawat", "Staff Wrh", "Adm MTC", "Fieldman MTC", "MKK"],
  security: ["Anggota", "Danru", "Chief Security"],
  cleaning: ["Cleaning Service", "Leader Cleaning", "Gardener"],
  driver: ["Driver Kecil", "Driver Sedang", "Driver Besar"],
};
const firstNames = ["Budi","Ahmad","Siti","Rina","Deni","Wahyu","Sri","Andi","Eko","Yanti","Rizki","Dewi","Agus","Fitri","Joko","Nur","Bagus","Lestari","Hendra","Maya","Slamet","Indah","Rudi","Wati"];
const lastNames = ["Santoso","Wijaya","Kurniawan","Hidayat","Saputra","Pratama","Nugroho","Halim","Setiawan","Firmansyah","Ramadhan","Utami","Permana","Yulianto"];
const banks = ["BCA","Mandiri","BRI","BNI","BSI"];
const branches = ["Cikarang","Bekasi","Jakarta Timur","Karawang","Bogor"];
const seeded = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

function buildEmployees() {
  const list = [];
  let counter = 0;
  for (const c of clients) {
    const positions = positionsByType[c.contractType];
    const n = Math.min(c.headcount, c.contractType === "security" ? 10 : 12);
    for (let i = 0; i < n; i++) {
      const r = seeded(counter + 1);
      const r2 = seeded(counter + 100);
      const marital = r2 > 0.35 ? "K" : "TK";
      const dependents = marital === "K" ? Math.floor(seeded(counter + 7) * 4) : 0;
      const exited = seeded(counter + 40) > 0.9;
      const base = c.contractType === "security" ? 4200000 + Math.floor(seeded(counter + 3) * 400000)
        : c.contractType === "driver" ? 4500000 + Math.floor(seeded(counter + 3) * 500000)
        : 4000000 + Math.floor(seeded(counter + 3) * 600000);
      list.push({
        id: `emp-${counter + 1}`,
        nik: `ABP${String(2018 + (counter % 6))}${String(counter + 1).padStart(4, "0")}`,
        name: `${firstNames[counter % firstNames.length]} ${lastNames[(counter * 3) % lastNames.length]}`,
        gender: r > 0.72 ? "P" : "L",
        position: positions[i % positions.length],
        client_id: c.id,
        contract_type: c.contractType,
        branch: branches[counter % branches.length],
        marital_status: marital,
        dependents,
        npwp: r > 0.25 ? `${Math.floor(10 + seeded(counter) * 89)}.${Math.floor(100 + seeded(counter + 2) * 899)}.${Math.floor(100 + seeded(counter + 5) * 899)}.${Math.floor(1 + seeded(counter + 8) * 8)}-000.000` : "-",
        bank_name: banks[counter % banks.length],
        bank_account: `${Math.floor(1000000000 + seeded(counter + 11) * 8999999999)}`,
        join_date: `202${Math.floor(1 + seeded(counter + 9) * 4)}-0${1 + (counter % 9)}-1${counter % 9}`,
        exit_date: exited ? "2026-07-31" : null,
        basic_salary: base,
        status: exited ? "keluar" : "aktif",
      });
      counter++;
    }
  }
  return list;
}

async function seedEmployees() {
  console.log("\n== Mengisi karyawan ==");
  const emps = buildEmployees();
  const { error } = await sb.from("employees").upsert(emps, { onConflict: "id" });
  if (error) console.log("  ! employees:", error.message);
  else console.log(`  ✓ ${emps.length} karyawan tersimpan`);
}

(async () => {
  await seedAccounts();
  await seedEmployees();
  console.log("\n✅ Selesai. Simpan kredensial di atas.\n");
})();
