export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="15" fill="#151515" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#f5d90a" strokeWidth="3.5" />
      <path d="M13 32h38M32 13c-7 6-7 32 0 38M32 13c7 6 7 32 0 38" stroke="#f5d90a" strokeWidth="2" fill="none" opacity="0.55" />
      <path d="M32 22v10l7 5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
