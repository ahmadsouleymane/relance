// Mark for DJASSA: a market basket bound shut by a wax-seal ribbon — the two
// things this app actually does, drawn as one object. Not a padlock, not a
// generic shield: the goods and the protection on them, in the same shape.
export default function Logomark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="var(--brand)" stroke="var(--ink)" strokeWidth="1.8" />
      <path
        d="M11.5 25 C11.5 17.5 15.2 14 20 14 C24.8 14 28.5 17.5 28.5 25 Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14.5 21.5c3.6 1 7.4 1 11 0" stroke="var(--ink)" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <rect
        x="8.5"
        y="18"
        width="23"
        height="4.6"
        rx="1.2"
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeWidth="1.3"
        transform="rotate(-28 20 20)"
      />
      <circle cx="20" cy="20" r="3.6" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.3" />
      <circle cx="20" cy="20" r="1.1" fill="var(--ink)" />
    </svg>
  );
}
