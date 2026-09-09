import { cookies } from "next/headers";
import { PageHeader, Card, Badge, StatusPill, Avatar } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import { KaryawanToolbar, type ExportRow } from "@/components/karyawan-toolbar";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { employees as mockEmployees, clients as mockClients, contractTypeLabel } from "@/lib/data";
import { tanggal } from "@/lib/format";

interface Row {
  id: string;
  name: string;
  nik: string;
  position: string | null;
  contract_type: string | null;
  client_id: string | null;
  client_name: string;
  branch: string | null;
  marital_status: string | null;
  dependents: number | null;
  npwp: string | null;
  bank_name: string | null;
  bank_account: string | null;
  join_date: string | null;
  status: string;
  photo_url: string | null;
}

async function getData(): Promise<{ rows: Row[]; clients: { id: string; name: string }[]; source: "db" | "mock" }> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: emps }, { data: cls }] = await Promise.all([
        sb.from("employees").select("*").order("name"),
        sb.from("clients").select("id,name"),
      ]);
      if (emps) {
        const cmap = Object.fromEntries((cls ?? []).map((c) => [c.id, c.name]));
        const rows: Row[] = emps.map((e) => ({ ...(e as Row), client_name: cmap[e.client_id as string] ?? "-" }));
        return { rows, clients: cls ?? [], source: "db" };
      }
    } catch {
      /* fallback */
    }
  }
  const rows: Row[] = mockEmployees.map((e) => ({
    id: e.id,
    name: e.name,
    nik: e.nik,
    position: e.position,
    contract_type: e.contractType,
    client_id: e.clientId,
    client_name: mockClients.find((c) => c.id === e.clientId)?.name ?? "-",
    branch: e.branch,
    marital_status: e.maritalStatus,
    dependents: e.dependents,
    npwp: e.npwp,
    bank_name: e.bankName,
    bank_account: e.bankAccount,
    join_date: e.joinDate,
    status: e.status,
    photo_url: null,
  }));
  return { rows, clients: mockClients.map((c) => ({ id: c.id, name: c.name })), source: "mock" };
}

export default async function KaryawanPage() {
  const { rows, clients, source } = await getData();
  const aktif = rows.filter((e) => e.status === "aktif").length;
  const summary = [
    { label: "Total Karyawan", value: rows.length },
    { label: "Aktif", value: aktif },
    { label: "Keluar", value: rows.length - aktif },
    { label: "Klien", value: clients.length },
  ];
  const exportRows: ExportRow[] = rows.map((r) => ({
    name: r.name,
    nik: r.nik,
    position: r.position ?? "",
    clientName: r.client_name,
    branch: r.branch ?? "",
    npwp: r.npwp ?? "",
    bank_name: r.bank_name ?? "",
    bank_account: r.bank_account ?? "",
    join_date: r.join_date ?? "",
    status: r.status,
  }));

  return (
    <>
      <PageHeader
        title="Data Induk Karyawan"
        subtitle={
          source === "db"
            ? "Tersimpan di database Supabase — NIK, NPWP, status pajak, rekening"
            : "Mode demo (data contoh) — aktifkan Supabase untuk simpan permanen"
        }
        actions={<KaryawanToolbar clients={clients} exportRows={exportRows} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input pl-9" placeholder="Cari nama, NIK, atau jabatan…" />
          </div>
          <select className="input w-full sm:w-48">
            <option>Semua Klien</option>
            {clients.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <select className="input w-full sm:w-40">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Keluar</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="th">Karyawan</th>
                <th className="th">Jabatan</th>
                <th className="th">Penempatan</th>
                <th className="th">Status Pajak</th>
                <th className="th">NPWP</th>
                <th className="th">Rekening</th>
                <th className="th">Bergabung</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-muted">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {e.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.photo_url} alt={e.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <Avatar name={e.name} />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.nik}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <p>{e.position}</p>
                    {e.contract_type && (
                      <Badge tone="teal">
                        {contractTypeLabel[e.contract_type as keyof typeof contractTypeLabel] ?? e.contract_type}
                      </Badge>
                    )}
                  </td>
                  <td className="td">
                    <p className="text-muted-foreground">{e.client_name}</p>
                    <p className="text-xs text-muted-foreground">{e.branch}</p>
                  </td>
                  <td className="td">
                    <span className="font-semibold">
                      {e.marital_status}/{e.dependents ?? 0}
                    </span>
                  </td>
                  <td className="td">
                    {!e.npwp || e.npwp === "-" ? (
                      <Badge tone="amber">Belum ada</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{e.npwp}</span>
                    )}
                  </td>
                  <td className="td">
                    <p className="text-muted-foreground">{e.bank_name}</p>
                    <p className="text-xs text-muted-foreground">{e.bank_account}</p>
                  </td>
                  <td className="td text-muted-foreground">{e.join_date ? tanggal(e.join_date) : "-"}</td>
                  <td className="td">
                    <StatusPill status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          Menampilkan {rows.length} karyawan
        </div>
      </Card>
    </>
  );
}
