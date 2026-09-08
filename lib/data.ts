// =====================================================================
// Mock data — Sistem Manajemen Outsourcing PT. Arowana Bintang Perdana
// UI/UX prototype. Semua angka contoh, tidak terhubung backend.
// =====================================================================

export type ContractType = "staff" | "security" | "cleaning" | "driver";

export interface LegalEntity {
  id: string;
  name: string;
  npwp: string;
  invoicePrefix: string;
}

export interface Client {
  id: string;
  name: string;
  entityId: string;
  contractType: ContractType;
  headcount: number;
  managementFeePct: number;
  ppnPct: number;
  pph23Pct: number;
  spkNumber: string;
  periodStart: string;
  periodEnd: string;
}

export interface Employee {
  id: string;
  nik: string; // NIK internal
  name: string;
  gender: "L" | "P";
  position: string;
  clientId: string;
  contractType: ContractType;
  branch: string;
  maritalStatus: "K" | "TK";
  dependents: number; // jumlah tanggungan
  npwp: string;
  bankName: string;
  bankAccount: string;
  joinDate: string;
  exitDate: string | null;
  basicSalary: number;
  status: "aktif" | "keluar";
}

export const legalEntities: LegalEntity[] = [
  {
    id: "abp",
    name: "PT. Arowana Bintang Perdana",
    npwp: "85.967.224.8-435.000",
    invoicePrefix: "ABP",
  },
  {
    id: "cpp",
    name: "PT. Chandra Prima Persada",
    npwp: "02.114.553.7-435.000",
    invoicePrefix: "CPP",
  },
];

export const clients: Client[] = [
  {
    id: "als",
    name: "PT. Armas Logistic Service",
    entityId: "abp",
    contractType: "staff",
    headcount: 42,
    managementFeePct: 7,
    ppnPct: 12,
    pph23Pct: 2,
    spkNumber: "SPK/ALS/2026/0142",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
  },
  {
    id: "dpm",
    name: "PT BPR DPM Kredit Mandiri",
    entityId: "cpp",
    contractType: "security",
    headcount: 18,
    managementFeePct: 8,
    ppnPct: 12,
    pph23Pct: 2,
    spkNumber: "SPK/DPM/2026/0088",
    periodStart: "2026-03-01",
    periodEnd: "2027-02-28",
  },
  {
    id: "mkw",
    name: "PT. Mega Karya Wijaya",
    entityId: "abp",
    contractType: "cleaning",
    headcount: 25,
    managementFeePct: 7,
    ppnPct: 12,
    pph23Pct: 2,
    spkNumber: "SPK/MKW/2026/0201",
    periodStart: "2026-02-01",
    periodEnd: "2027-01-31",
  },
  {
    id: "snt",
    name: "PT. Sentosa Niaga Transport",
    entityId: "abp",
    contractType: "driver",
    headcount: 14,
    managementFeePct: 7.5,
    ppnPct: 12,
    pph23Pct: 2,
    spkNumber: "SPK/SNT/2026/0173",
    periodStart: "2026-01-15",
    periodEnd: "2026-12-31",
  },
];

const positionsByType: Record<ContractType, string[]> = {
  staff: ["Office Boy", "Staff CCR", "Perawat", "Staff Wrh", "Adm MTC", "Fieldman MTC", "MKK"],
  security: ["Anggota", "Danru", "Chief Security"],
  cleaning: ["Cleaning Service", "Leader Cleaning", "Gardener"],
  driver: ["Driver Kecil", "Driver Sedang", "Driver Besar"],
};

const firstNames = ["Budi", "Ahmad", "Siti", "Rina", "Deni", "Wahyu", "Sri", "Andi", "Eko", "Yanti", "Rizki", "Dewi", "Agus", "Fitri", "Joko", "Nur", "Bagus", "Lestari", "Hendra", "Maya", "Slamet", "Indah", "Rudi", "Wati"];
const lastNames = ["Santoso", "Wijaya", "Kurniawan", "Hidayat", "Saputra", "Pratama", "Nugroho", "Halim", "Setiawan", "Firmansyah", "Ramadhan", "Utami", "Permana", "Yulianto"];
const banks = ["BCA", "Mandiri", "BRI", "BNI", "BSI"];
const branches = ["Cikarang", "Bekasi", "Jakarta Timur", "Karawang", "Bogor"];

function seeded(i: number) {
  // deterministic pseudo-random so SSR & client match
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildEmployees(): Employee[] {
  const list: Employee[] = [];
  let counter = 0;
  for (const c of clients) {
    const positions = positionsByType[c.contractType];
    const n = Math.min(c.headcount, c.contractType === "security" ? 10 : 12);
    for (let i = 0; i < n; i++) {
      const r = seeded(counter + 1);
      const r2 = seeded(counter + 100);
      const gender: "L" | "P" = r > 0.72 ? "P" : "L";
      const marital: "K" | "TK" = r2 > 0.35 ? "K" : "TK";
      const dependents = marital === "K" ? Math.floor(seeded(counter + 7) * 4) : 0;
      const exited = seeded(counter + 40) > 0.9;
      const base =
        c.contractType === "security"
          ? 4200000 + Math.floor(seeded(counter + 3) * 400000)
          : c.contractType === "driver"
          ? 4500000 + Math.floor(seeded(counter + 3) * 500000)
          : 4000000 + Math.floor(seeded(counter + 3) * 600000);
      list.push({
        id: `emp-${counter + 1}`,
        nik: `ABP${String(2018 + (counter % 6))}${String(counter + 1).padStart(4, "0")}`,
        name: `${firstNames[counter % firstNames.length]} ${lastNames[(counter * 3) % lastNames.length]}`,
        gender,
        position: positions[i % positions.length],
        clientId: c.id,
        contractType: c.contractType,
        branch: branches[counter % branches.length],
        maritalStatus: marital,
        dependents,
        npwp: r > 0.25 ? `${Math.floor(10 + seeded(counter) * 89)}.${Math.floor(100 + seeded(counter + 2) * 899)}.${Math.floor(100 + seeded(counter + 5) * 899)}.${Math.floor(1 + seeded(counter + 8) * 8)}-000.000` : "-",
        bankName: banks[counter % banks.length],
        bankAccount: `${Math.floor(1000000000 + seeded(counter + 11) * 8999999999)}`,
        joinDate: `202${Math.floor(1 + seeded(counter + 9) * 4)}-0${1 + (counter % 9)}-1${counter % 9}`,
        exitDate: exited ? "2026-07-31" : null,
        basicSalary: base,
        status: exited ? "keluar" : "aktif",
      });
      counter++;
    }
  }
  return list;
}

export const employees: Employee[] = buildEmployees();

// ---------- Payroll calculation (aturan pajak Indonesia, disederhanakan) ----------

// PTKP setahun (mengikuti aturan yang bisa diubah admin di Pengaturan)
export const ptkpTable: Record<string, number> = {
  "TK/0": 54000000,
  "TK/1": 58500000,
  "TK/2": 63000000,
  "TK/3": 67500000,
  "K/0": 58500000,
  "K/1": 63000000,
  "K/2": 67500000,
  "K/3": 72000000,
};

export const pph21Brackets = [
  { upTo: 60000000, rate: 5 },
  { upTo: 250000000, rate: 15 },
  { upTo: 500000000, rate: 25 },
  { upTo: 5000000000, rate: 30 },
  { upTo: Infinity, rate: 35 },
];

export const bpjsRates = {
  jhtEmployee: 2, // Jaminan Hari Tua (potongan karyawan)
  jpEmployee: 1, // Jaminan Pensiun (potongan karyawan)
  kesehatanEmployee: 1, // BPJS Kesehatan (potongan karyawan)
  // sisi tagihan ke klien
  jhtClient: 3.7,
  jkkClient: 0.24,
  jkmClient: 0.3,
  jpClient: 2,
  kesehatanClient: 4,
  biayaJabatanPct: 5, // pengurang PPh21, maks 500rb/bln
};

export interface PayrollLine {
  employee: Employee;
  earnings: { label: string; amount: number }[];
  gross: number;
  bpjsEmployee: number;
  biayaJabatan: number;
  ptkp: number;
  pkp: number;
  pph21: number;
  otherDeductions: { label: string; amount: number }[];
  totalDeduction: number;
  takeHome: number;
  method: "transfer" | "tunai";
}

function calcPph21(annualPkp: number): number {
  let remaining = Math.max(0, annualPkp);
  let tax = 0;
  let prev = 0;
  for (const b of pph21Brackets) {
    const slice = Math.min(remaining, b.upTo - prev);
    if (slice <= 0) break;
    tax += (slice * b.rate) / 100;
    remaining -= slice;
    prev = b.upTo;
  }
  return Math.round(tax / 12); // per bulan
}

export function calcPayroll(emp: Employee, periodSeed = 0): PayrollLine {
  const r = seeded(Number(emp.id.split("-")[1]) + periodSeed);
  const tunjKehadiran = 300000;
  const tunjJabatan = ["Danru", "Chief Security", "Leader Cleaning", "Adm MTC"].includes(emp.position) ? 500000 : 0;
  const kompensasi = r > 0.8 ? 250000 : 0;
  const rapel = r > 0.92 ? 400000 : 0;
  const earnings = [
    { label: "Gaji Pokok", amount: emp.basicSalary },
    { label: "Tunjangan Kehadiran", amount: tunjKehadiran },
    ...(tunjJabatan ? [{ label: "Tunjangan Jabatan", amount: tunjJabatan }] : []),
    ...(kompensasi ? [{ label: "Kompensasi", amount: kompensasi }] : []),
    ...(rapel ? [{ label: "Rapel Gaji", amount: rapel }] : []),
  ];
  const gross = earnings.reduce((s, e) => s + e.amount, 0);

  const jht = Math.round((gross * bpjsRates.jhtEmployee) / 100);
  const jp = Math.round((gross * bpjsRates.jpEmployee) / 100);
  const kes = Math.round((gross * bpjsRates.kesehatanEmployee) / 100);
  const bpjsEmployee = jht + jp + kes;

  const biayaJabatan = Math.min(Math.round((gross * bpjsRates.biayaJabatanPct) / 100), 500000);
  const netMonthly = gross - biayaJabatan - bpjsEmployee;
  const annualNet = netMonthly * 12;
  const ptkpKey = `${emp.maritalStatus}/${Math.min(emp.dependents, 3)}`;
  const ptkp = ptkpTable[ptkpKey] ?? ptkpTable["TK/0"];
  const pkp = Math.max(0, Math.floor((annualNet - ptkp) / 12) * 12);
  // Karyawan tanpa NPWP dikenakan tarif 20% lebih tinggi
  let pph21 = calcPph21(pkp);
  if (emp.npwp === "-") pph21 = Math.round(pph21 * 1.2);

  const koperasi = r > 0.5 ? 100000 : 0;
  const hutang = r > 0.85 ? 350000 : 0;
  const kedukaan = 15000;
  const otherDeductions = [
    { label: "Iuran Kedukaan", amount: kedukaan },
    ...(koperasi ? [{ label: "Potongan Koperasi", amount: koperasi }] : []),
    ...(hutang ? [{ label: "Potongan Hutang", amount: hutang }] : []),
  ];

  const totalDeduction = bpjsEmployee + pph21 + otherDeductions.reduce((s, d) => s + d.amount, 0);
  const takeHome = gross - totalDeduction;

  return {
    employee: emp,
    earnings,
    gross,
    bpjsEmployee,
    biayaJabatan,
    ptkp,
    pkp,
    pph21,
    otherDeductions,
    totalDeduction,
    takeHome,
    method: emp.contractType === "security" && r > 0.5 ? "tunai" : "transfer",
  };
}

// ---------- Invoice ke klien ----------
export interface ClientInvoice {
  id: string;
  number: string;
  client: Client;
  entity: LegalEntity;
  period: string;
  salarySubtotal: number;
  bpjsClient: number;
  managementFee: number;
  dpp: number;
  ppn: number;
  total: number;
  pph23: number;
  grandTotal: number;
  status: "draft" | "terkirim" | "dibayar" | "jatuh_tempo";
  dueDate: string;
}

export function buildInvoice(client: Client, seq: number, status: ClientInvoice["status"]): ClientInvoice {
  const emps = employees.filter((e) => e.clientId === client.id && e.status === "aktif");
  const salarySubtotal = emps.reduce((s, e) => s + calcPayroll(e).gross, 0) * (client.headcount / Math.max(emps.length, 1));
  const salary = Math.round(salarySubtotal);
  const bpjsClient = Math.round(
    (salary * (bpjsRates.jhtClient + bpjsRates.jkkClient + bpjsRates.jkmClient + bpjsRates.jpClient + bpjsRates.kesehatanClient)) / 100
  );
  const managementFee = Math.round(((salary + bpjsClient) * client.managementFeePct) / 100);
  const dpp = salary + bpjsClient + managementFee;
  const ppn = Math.round((dpp * client.ppnPct) / 100);
  const total = dpp + ppn;
  const pph23 = Math.round((managementFee * client.pph23Pct) / 100);
  const grandTotal = total - pph23;
  const entity = legalEntities.find((e) => e.id === client.entityId)!;
  return {
    id: `inv-${client.id}-${seq}`,
    number: `${entity.invoicePrefix}/INV/2026/${String(seq).padStart(4, "0")}`,
    client,
    entity,
    period: "Agustus 2026",
    salarySubtotal: salary,
    bpjsClient,
    managementFee,
    dpp,
    ppn,
    total,
    pph23,
    grandTotal,
    status,
    dueDate: "2026-09-25",
  };
}

const invStatuses: ClientInvoice["status"][] = ["dibayar", "terkirim", "jatuh_tempo", "draft"];
export const invoices: ClientInvoice[] = clients.map((c, i) => buildInvoice(c, 141 + i, invStatuses[i]));

// ---------- Referral / komisi pihak ketiga ----------
export const referralFees = clients.slice(0, 2).map((c, i) => {
  const inv = invoices.find((v) => v.client.id === c.id)!;
  const base = inv.managementFee - inv.pph23;
  const feePct = i === 0 ? 8 : 5;
  const total = Math.round((base * feePct) / 100);
  return {
    id: `ref-${c.id}`,
    recipient: i === 0 ? "Bpk. Adang Suryana" : "Bpk. Hermawan",
    client: c,
    period: "Agustus 2026",
    base,
    feePct,
    total,
    status: i === 0 ? ("dibayar" as const) : ("pending" as const),
  };
});

// ---------- Dashboard: perbandingan bulan ini vs bulan lalu per klien ----------
export const clientComparison = clients.map((c, i) => {
  const inv = invoices.find((v) => v.client.id === c.id)!;
  const growth = [3.2, -1.4, 5.8, 0.9][i];
  const hcDelta = [2, 0, 1, -1][i];
  return {
    client: c,
    payrollNow: inv.salarySubtotal,
    payrollPrev: Math.round(inv.salarySubtotal / (1 + growth / 100)),
    growth,
    headcountNow: c.headcount,
    headcountPrev: c.headcount - hcDelta,
    hcDelta,
    invoiceStatus: inv.status,
  };
});

// ---------- Absensi ----------
export const attendanceSummary = {
  hadir: 118,
  izin: 6,
  sakit: 4,
  alpha: 3,
  cuti: 2,
  total: employees.filter((e) => e.status === "aktif").length,
};

export const contractTypeLabel: Record<ContractType, string> = {
  staff: "Staff",
  security: "Security",
  cleaning: "Cleaning",
  driver: "Driver",
};

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}
export function employeeById(id: string) {
  return employees.find((e) => e.id === id);
}

// =====================================================================
// Modul SDM tambahan — Rekrutmen, Cuti, Kinerja (mock)
// =====================================================================

// ---------- Rekrutmen & Onboarding ----------
export type JobStatus = "dibuka" | "ditutup" | "draft";
export interface JobPosting {
  id: string;
  title: string;
  clientId: string;
  type: ContractType;
  location: string;
  applicants: number;
  target: number;
  status: JobStatus;
  posted: string;
}

export const jobPostings: JobPosting[] = [
  { id: "job-1", title: "Security / Anggota", clientId: "dpm", type: "security", location: "Bekasi", applicants: 24, target: 6, status: "dibuka", posted: "2026-08-01" },
  { id: "job-2", title: "Office Boy", clientId: "als", type: "staff", location: "Cikarang", applicants: 18, target: 4, status: "dibuka", posted: "2026-08-05" },
  { id: "job-3", title: "Cleaning Service", clientId: "mkw", type: "cleaning", location: "Jakarta Timur", applicants: 31, target: 8, status: "dibuka", posted: "2026-08-08" },
  { id: "job-4", title: "Driver Sedang", clientId: "snt", type: "driver", location: "Karawang", applicants: 12, target: 3, status: "ditutup", posted: "2026-07-20" },
  { id: "job-5", title: "Staff CCR", clientId: "als", type: "staff", location: "Cikarang", applicants: 9, target: 2, status: "draft", posted: "2026-08-18" },
];

export type CandidateStage = "Pelamar" | "Skrining" | "Interview" | "Penawaran" | "Diterima";
export const candidateStages: CandidateStage[] = ["Pelamar", "Skrining", "Interview", "Penawaran", "Diterima"];

export interface Candidate {
  id: string;
  name: string;
  position: string;
  clientId: string;
  stage: CandidateStage;
  source: string;
  appliedAt: string;
  score: number;
}

const candNames = ["Fajar Nugraha", "Sinta Dewi", "Bayu Aji", "Ratna Sari", "Doni Saputra", "Mega Lestari", "Irfan Maulana", "Putri Anggraini", "Yoga Prasetyo", "Nadia Rahma", "Reza Fahlevi", "Ayu Wulandari", "Galih Pratama", "Citra Kirana"];
const candSources = ["Referral", "Job Portal", "Walk-in", "Sosial Media", "Agen"];

export const candidates: Candidate[] = candNames.map((name, i) => {
  const job = jobPostings[i % jobPostings.length];
  return {
    id: `cand-${i + 1}`,
    name,
    position: job.title,
    clientId: job.clientId,
    stage: candidateStages[i % candidateStages.length],
    source: candSources[i % candSources.length],
    appliedAt: `2026-08-${String((i % 27) + 1).padStart(2, "0")}`,
    score: 60 + ((i * 7) % 40),
  };
});

export const interviews = candidates
  .filter((c) => c.stage === "Interview" || c.stage === "Penawaran")
  .slice(0, 5)
  .map((c, i) => ({
    id: `int-${i + 1}`,
    candidate: c.name,
    position: c.position,
    date: `2026-09-${String(9 + i).padStart(2, "0")}`,
    time: ["09:00", "10:30", "13:00", "14:30", "15:30"][i],
    type: i % 2 === 0 ? "Tatap Muka" : "Online",
    interviewer: ["Mariyanti", "Tri Antoro", "Deo Galuh"][i % 3],
  }));

export const onboardingChecklist = [
  { item: "Tanda tangan kontrak kerja", done: true },
  { item: "Kelengkapan dokumen (KTP, NPWP, ijazah)", done: true },
  { item: "Pendaftaran BPJS TK & Kesehatan", done: true },
  { item: "Pembuatan rekening payroll", done: false },
  { item: "Serah terima seragam & perlengkapan", done: false },
  { item: "Briefing SOP & orientasi penempatan", done: false },
];

export const recruitmentStats = {
  lowonganAktif: jobPostings.filter((j) => j.status === "dibuka").length,
  totalPelamar: candidates.length,
  interviewTerjadwal: interviews.length,
  diterima: candidates.filter((c) => c.stage === "Diterima").length,
};

// ---------- Manajemen Cuti ----------
export type LeaveType = "Tahunan" | "Sakit" | "Melahirkan" | "Izin" | "Penting";
export type LeaveStatus = "pending" | "disetujui" | "ditolak";
export interface LeaveApplication {
  id: string;
  employeeId: string;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  status: LeaveStatus;
  reason: string;
}

const leaveTypes: LeaveType[] = ["Tahunan", "Sakit", "Izin", "Penting", "Melahirkan"];
const leaveReasons = ["Keperluan keluarga", "Sakit demam", "Acara pernikahan", "Urusan pribadi", "Kontrol kesehatan", "Melahirkan"];

export const leaveApplications: LeaveApplication[] = employees.slice(0, 10).map((e, i) => {
  const days = (i % 3) + 1;
  const startDay = 3 + i * 2;
  return {
    id: `leave-${i + 1}`,
    employeeId: e.id,
    type: leaveTypes[i % leaveTypes.length],
    start: `2026-09-${String(startDay).padStart(2, "0")}`,
    end: `2026-09-${String(startDay + days - 1).padStart(2, "0")}`,
    days,
    status: (["pending", "disetujui", "ditolak", "disetujui"] as LeaveStatus[])[i % 4],
    reason: leaveReasons[i % leaveReasons.length],
  };
});

export const leaveBalances = employees.slice(0, 8).map((e, i) => {
  const used = i % 8;
  return { employee: e, quota: 12, used, remaining: 12 - used };
});

export const leaveStats = {
  pending: leaveApplications.filter((l) => l.status === "pending").length,
  disetujui: leaveApplications.filter((l) => l.status === "disetujui").length,
  ditolak: leaveApplications.filter((l) => l.status === "ditolak").length,
  totalHari: leaveApplications.reduce((s, l) => s + l.days, 0),
};

// ---------- Kinerja & KPI ----------
export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  progress: number;
  due: string;
}

export const goals: Goal[] = employees.slice(0, 6).map((e, i) => ({
  id: `goal-${i + 1}`,
  employeeId: e.id,
  title: [
    "Tingkatkan kehadiran tim ke 98%",
    "Nihil komplain klien selama Q3",
    "Selesaikan sertifikasi K3",
    "Efisiensi rute pengiriman 10%",
    "Zero accident di lokasi kerja",
    "Peningkatan skor kepuasan klien",
  ][i],
  progress: [85, 92, 60, 45, 100, 73][i],
  due: `2026-${String(9 + (i % 3)).padStart(2, "0")}-30`,
}));

export const reviewCycles = [
  { name: "Evaluasi Q3 2026", period: "Jul–Sep 2026", status: "berjalan", progress: 62 },
  { name: "Evaluasi Q2 2026", period: "Apr–Jun 2026", status: "selesai", progress: 100 },
  { name: "Review Tahunan 2026", period: "Jan–Des 2026", status: "berjalan", progress: 40 },
];

export const kpiIndicators = [
  { name: "Kehadiran & Disiplin", category: "Operasional", weight: 25, score: 88 },
  { name: "Kualitas Kerja", category: "Operasional", weight: 25, score: 82 },
  { name: "Kepuasan Klien", category: "Layanan", weight: 20, score: 90 },
  { name: "Kepatuhan SOP & K3", category: "Kepatuhan", weight: 20, score: 78 },
  { name: "Inisiatif & Sikap", category: "Perilaku", weight: 10, score: 85 },
];

export const awards = employees.slice(0, 4).map((e, i) => ({
  employee: e,
  award: ["Karyawan Terbaik", "Kehadiran Sempurna", "Pelayanan Prima", "Zero Accident"][i],
  month: "Agustus 2026",
}));

export const kinerjaStats = {
  skorRata: Math.round(kpiIndicators.reduce((s, k) => s + (k.score * k.weight) / 100, 0)),
  goalAktif: goals.filter((g) => g.progress < 100).length,
  goalSelesai: goals.filter((g) => g.progress === 100).length,
  reviewBerjalan: reviewCycles.filter((r) => r.status === "berjalan").length,
};

// =====================================================================
// Dashboard widgets (mock) — layout kaya ala HRM
// =====================================================================
export const presentToday = 78;

export const dashboardBirthdays = employees.slice(0, 6).map((e) => ({
  name: e.name,
  role: e.position,
}));

export const dashboardOnLeave = leaveApplications
  .filter((l) => l.status === "disetujui")
  .slice(0, 6)
  .map((l) => {
    const e = employeeById(l.employeeId)!;
    return { name: e.name, role: e.position, type: l.type };
  });

export const weeklyAttendance = [
  { day: "Sen", present: 74, leave: 3, absent: 2 },
  { day: "Sel", present: 76, leave: 2, absent: 1 },
  { day: "Rab", present: 71, leave: 4, absent: 3 },
  { day: "Kam", present: 78, leave: 1, absent: 2 },
  { day: "Jum", present: 75, leave: 3, absent: 1 },
  { day: "Sab", present: 68, leave: 5, absent: 4 },
  { day: "Min", present: 40, leave: 2, absent: 1 },
];

export const leaveOverviewData = [
  { label: "Disetujui", value: leaveStats.disetujui + 6, color: "#1a7d9c" },
  { label: "Pending", value: leaveStats.pending + 3, color: "#c69a34" },
  { label: "Ditolak", value: leaveStats.ditolak + 1, color: "#c0392b" },
];

export const hiringTrend = [
  { m: "Jan", hires: 6 },
  { m: "Feb", hires: 9 },
  { m: "Mar", hires: 12 },
  { m: "Apr", hires: 7 },
  { m: "Mei", hires: 14 },
  { m: "Jun", hires: 10 },
  { m: "Jul", hires: 16 },
  { m: "Agu", hires: 13 },
  { m: "Sep", hires: 8 },
  { m: "Okt", hires: 11 },
  { m: "Nov", hires: 15 },
  { m: "Des", hires: 9 },
];

// net pay per bulan (dalam juta Rupiah)
export const payrollTrendMonthly = [
  { m: "Jan", net: 452 },
  { m: "Feb", net: 461 },
  { m: "Mar", net: 468 },
  { m: "Apr", net: 471 },
  { m: "Mei", net: 476 },
  { m: "Jun", net: 480 },
  { m: "Jul", net: 476 },
  { m: "Agu", net: 492 },
  { m: "Sep", net: 498 },
  { m: "Okt", net: 505 },
  { m: "Nov", net: 512 },
  { m: "Des", net: 520 },
];

export const assetStatusData = [
  { label: "Tersedia", value: 16, color: "#1a7d9c" },
  { label: "Dipinjam", value: 32, color: "#c69a34" },
  { label: "Maintenance", value: 5, color: "#e6c46e" },
  { label: "Rusak", value: 3, color: "#c0392b" },
];

export const candidatePipelineData = candidateStages.map((stage, i) => ({
  label: stage,
  value: candidates.filter((c) => c.stage === stage).length,
  color: ["#94a3b8", "#c69a34", "#1a7d9c", "#e6c46e", "#2e9e6b"][i],
}));

export const dashboardAnnouncements = [
  { title: "Penyesuaian tarif BPJS Ketenagakerjaan 2026", category: "Kebijakan", date: "2026-08-28", urgent: true },
  { title: "Jadwal payroll & pencairan Agustus 2026", category: "Keuangan", date: "2026-08-25", urgent: true },
  { title: "SOP baru penempatan Security klien DPM", category: "Operasional", date: "2026-08-20", urgent: false },
  { title: "Program pelatihan K3 tenaga kerja baru", category: "SDM", date: "2026-08-15", urgent: false },
  { title: "Libur nasional & cuti bersama kuartal IV", category: "Umum", date: "2026-08-10", urgent: false },
];

export const dashboardMeetings = [
  { title: "Review kontrak PT Armas Logistic", date: "2026-09-09", time: "09:00 – 10:00", status: "berjalan" as const },
  { title: "Evaluasi Security klien DPM", date: "2026-09-10", time: "13:00 – 14:00", status: "berjalan" as const },
  { title: "Rapat payroll bulanan", date: "2026-09-11", time: "10:00 – 11:30", status: "selesai" as const },
  { title: "Interview kandidat Cleaning MKW", date: "2026-09-12", time: "14:30 – 15:30", status: "berjalan" as const },
];

export const dashboardKpis = {
  totalPayrollThisMonth: clientComparison.reduce((s, c) => s + c.payrollNow, 0),
  payrollRuns: 3,
  totalEmployees: employees.filter((e) => e.status === "aktif").length,
  newThisMonth: 8,
  totalClients: clients.length,
  attendanceRate: 94.2,
  pendingLeaves: leaveStats.pending,
  onLeaveToday: dashboardOnLeave.length,
  activeJobs: jobPostings.filter((j) => j.status === "dibuka").length,
  jobsThisMonth: 5,
};
