/* eslint-disable @next/next/no-img-element */

// Real ABP logo (processed to transparent, trimmed PNG — 928x624).
// `size` sets the rendered height; width scales to keep aspect ratio.
export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/abp-logo-t.png"
      alt="PT. Arowana Bintang Perdana"
      className={`object-contain ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}
