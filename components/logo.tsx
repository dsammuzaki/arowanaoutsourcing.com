export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#0c1320" />
      {/* stylised arowana + star mark */}
      <path
        d="M10 24c4-7 12-11 20-10-3 2-5 4-6 7 4-1 8 0 12 3-4 1-7 3-9 6-1-3-3-5-6-6-4-1-8 0-11 4 1-4 3-7 6-9-6 0-11 2-16 5 3-4 6-7 10-9-2 1-4 3-4 3Z"
        fill="#1d9ca3"
      />
      <path
        d="m33 15 1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4L33 15Z"
        fill="#da1315"
      />
    </svg>
  );
}
