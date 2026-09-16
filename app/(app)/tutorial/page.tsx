import { PageHeader } from "@/components/ui";
import { TutorialClient } from "@/components/tutorial-client";

export const metadata = { title: "Panduan" };

export default function TutorialPage() {
  return (
    <>
      <PageHeader
        title="Panduan Praktik"
        subtitle="Tutorial langkah demi langkah — lakukan transaksinya langsung dari nol sampai pembayaran"
      />
      <TutorialClient />
    </>
  );
}
