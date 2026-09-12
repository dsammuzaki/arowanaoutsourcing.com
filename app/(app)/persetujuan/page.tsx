import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { PersetujuanList, type ChangeRow } from "@/components/persetujuan-ui";

export const dynamic = "force-dynamic";

const REVIEW_ROLES = ["super_admin", "operation", "director"];

async function getData() {
  let rows: ChangeRow[] = [];
  let canReview = false;
  let dbReady = true;
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) {
        const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
        canReview = REVIEW_ROLES.includes(p?.role ?? "");
      }
      const { data, error } = await sb
        .from("change_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error && /schema cache|does not exist|PGRST205/i.test(error.message)) dbReady = false;
      if (data) rows = data as ChangeRow[];
    } catch {
      /* ignore */
    }
  }
  return { rows, canReview, dbReady };
}

export default async function PersetujuanPage() {
  const { rows, canReview, dbReady } = await getData();
  const pending = rows.filter((r) => r.status === "pending");
  const sorted = [...pending, ...rows.filter((r) => r.status !== "pending")];

  return (
    <>
      <PageHeader
        title="Persetujuan Perubahan"
        subtitle="Tinjau permintaan edit dari HR/PIC & Customer sebelum diterapkan"
      />

      {!dbReady ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Tabel persetujuan belum dibuat. Jalankan <span className="font-semibold text-foreground">supabase/schema-4.sql</span> di Supabase.
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {pending.length} menunggu
            </span>
            <span>· {rows.length} total permintaan</span>
          </div>
          <PersetujuanList rows={sorted} canReview={canReview} />
        </>
      )}
    </>
  );
}
