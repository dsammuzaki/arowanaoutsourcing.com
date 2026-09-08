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
