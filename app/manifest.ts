import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ABP Outsourcing — Sistem Manajemen",
    short_name: "ABP",
    description:
      "Sistem Manajemen Outsourcing PT. Arowana Bintang Perdana — payroll, invoice, absensi, dan pencairan gaji.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1f2e",
    theme_color: "#0b1f2e",
    icons: [
      { src: "/abp-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/abp-logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/abp-logo-t.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
