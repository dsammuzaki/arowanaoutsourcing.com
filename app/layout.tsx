import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "BSU Outsourcing — Sistem Manajemen",
  description:
    "Sistem Manajemen Outsourcing PT. Barata Sakti Utama — payroll, invoice klien, absensi, dan pencairan gaji dalam satu platform.",
  applicationName: "BSU Outsourcing",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BSU Outsourcing",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/bsu-logo.png", type: "image/png" }],
    shortcut: "/bsu-logo.png",
    apple: "/bsu-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
