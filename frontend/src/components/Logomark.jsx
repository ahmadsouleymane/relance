// Original mark for Relance: a line that reaches out, loses momentum, and
// curls back on itself before it fully closes — the shape of a conversation
// you almost let drop, caught in time. Not a chat bubble, not an arrow icon.
export default function Logomark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.8" />
      <path
        d="M12 15.5c0-3 3-5 6.5-5 4.5 0 8 3 8 7.3 0 4.8-4 7.7-8.8 8.7"
        stroke="var(--ink)"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M20.3 30.3 16 27.2l5-1.4" stroke="var(--ink)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="15.5" r="1.9" fill="var(--ink)" />
    </svg>
  );
}
