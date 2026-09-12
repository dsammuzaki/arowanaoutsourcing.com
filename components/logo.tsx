/* eslint-disable @next/next/no-img-element */

// Real BSU logo (processed to transparent, trimmed PNG — 928x624).
// `size` sets the rendered height; width scales to keep aspect ratio.
export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/abp-logo-t.png"
      alt="PT. Barata Sakti Utama"
      className={`object-contain ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}
