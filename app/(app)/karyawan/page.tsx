import Link from "next/link";
import { PageHeader, Card, Badge, StatusPill, Avatar } from "@/components/ui";
import { IconSearch, IconPlus, IconDownload } from "@/components/icons";
import { employees, clients, contractTypeLabel } from "@/lib/data";
import { tanggal } from "@/lib/format";

export default function KaryawanPage() {
  const aktif = employees.filter((e) => e.status === "aktif").length;
  const summary = [
    { label: "Total Karyawan", value: employees.length },
    { label: "Aktif", value: aktif },
    { label: "Keluar", value: employees.length - aktif },
    { label: "Klien", value: clients.length },
  ];

  return (
    <>
      <PageHeader
        title="Data Induk Karyawan"
        subtitle="Profil lengkap tenaga kerja — NIK, NPWP, status pajak, dan rekening"
        actions={
          <>
            <button className="btn-outline">
              <IconDownload width={16} height={16} /> Ekspor
            </button>
            <button className="btn-primary">
              <IconPlus width={16} height={16} /> Tambah Karyawan
            </button>
          </>
        }
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
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch
              width={18}
              height={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
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
              {employees.map((e) => {
                const client = clients.find((c) => c.id === e.clientId);
                return (
                  <tr key={e.id} className="hover:bg-muted">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} />
                        <div>
                          <p className="font-semibold text-foreground">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.nik}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <p>{e.position}</p>
                      <Badge tone="teal">{contractTypeLabel[e.contractType]}</Badge>
                    </td>
                    <td className="td">
                      <p className="text-muted-foreground">{client?.name}</p>
                      <p className="text-xs text-muted-foreground">{e.branch}</p>
                    </td>
                    <td className="td">
                      <span className="font-semibold">
                        {e.maritalStatus}/{e.dependents}
                      </span>
                    </td>
                    <td className="td">
                      {e.npwp === "-" ? (
                        <Badge tone="amber">Belum ada</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{e.npwp}</span>
                      )}
                    </td>
                    <td className="td">
                      <p className="text-muted-foreground">{e.bankName}</p>
                      <p className="text-xs text-muted-foreground">{e.bankAccount}</p>
                    </td>
                    <td className="td text-muted-foreground">{tanggal(e.joinDate)}</td>
                    <td className="td">
                      <StatusPill status={e.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>Menampilkan {employees.length} karyawan</span>
          <div className="flex gap-1">
            <button className="btn-ghost px-3 py-1.5">Sebelumnya</button>
            <button className="btn-outline px-3 py-1.5">1</button>
            <button className="btn-ghost px-3 py-1.5">Berikutnya</button>
          </div>
        </div>
      </Card>
    </>
  );
}
