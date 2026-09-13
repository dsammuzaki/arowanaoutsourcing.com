import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { ChatClient, type Member } from "@/components/chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  let members: Member[] = [];
  let me = { id: "", name: "Saya" };
  let dbReady = true;

  if (isSupabaseConfigured()) {
    const sb = createClient(await cookies());
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const { data: profs } = await sb.from("profiles").select("id, full_name, role").order("full_name");
      members = (profs ?? [])
        .filter((p) => p.id !== user.id)
        .map((p) => ({ id: p.id as string, name: (p.full_name as string) || "(tanpa nama)", role: (p.role as string) ?? "" }));
      const mine = (profs ?? []).find((p) => p.id === user.id);
      me = { id: user.id, name: (mine?.full_name as string) || user.email || "Saya" };
      // cek tabel messages
      const { error } = await sb.from("messages").select("id", { head: true, count: "exact" }).limit(1);
      if (error && /schema cache|does not exist|PGRST205/i.test(error.message)) dbReady = false;
    }
  }

  return (
    <>
      <PageHeader title="Chat Tim" subtitle="Pesan realtime ke sesama anggota — notifikasi juga dikirim ke email" />
      {!dbReady ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Fitur chat belum aktif. Jalankan <span className="font-semibold text-foreground">supabase/schema-7.sql</span> di Supabase.
        </Card>
      ) : (
        <ChatClient me={me} members={members} />
      )}
    </>
  );
}
