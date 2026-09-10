import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "ABP Outsourcing — Sistem Manajemen",
  description:
    "Sistem Manajemen Outsourcing PT. Arowana Bintang Perdana — payroll, invoice klien, absensi, dan pencairan gaji dalam satu platform.",
  icons: {
    icon: [
      { url: "/abp-logo.png", type: "image/png" },
      { url: "/abp-logo-t.png", type: "image/png" },
    ],
    shortcut: "/abp-logo.png",
    apple: "/abp-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
