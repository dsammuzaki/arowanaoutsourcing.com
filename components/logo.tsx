/* eslint-disable @next/next/no-img-element */

// Logo resmi PT. Barata Sakti Utama (PNG latar putih).
// `size` = tinggi render; lebar menyesuaikan rasio.
// `chip` = bungkus dengan kotak putih membulat agar terlihat di atas latar gelap.
export function Logo({
  size = 36,
  className = "",
  chip = false,
}: {
  size?: number;
  className?: string;
  chip?: boolean;
}) {
  const img = (
    <img
      src="/bsu-logo.png"
      alt="PT. Barata Sakti Utama"
      className="object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
  if (!chip) return <span className={className}>{img}</span>;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ${className}`}
    >
      {img}
    </span>
  );
}
