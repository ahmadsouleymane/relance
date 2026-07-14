// Small hand-tuned icon set — kept minimal on purpose rather than pulling in
// a generic icon library, so the app doesn't default to the usual look.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconHome = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </svg>
);

export const IconContacts = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.2" />
    <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
  </svg>
);

export const IconBell = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.4 5.4 1.4 5.4H4.6S6 14.5 6 10.5Z" />
    <path d="M10 19a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const IconLink = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
    <path d="M11 7.5h2M16.5 13v-2M13 16.5h-2" />
  </svg>
);

export const IconCard = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3.5" y="6" width="17" height="12" rx="2" />
    <path d="M3.5 10.5h17" />
    <path d="M7 14.5h4" />
  </svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h11m0 0-3-3m3 3-3 3" />
  </svg>
);

export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M20 20l-5-5" />
  </svg>
);

export const IconTag = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M11 4h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9Z" />
    <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </svg>
);

export const IconArrowRight = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12h13m0 0-5-5m5 5-5 5" />
  </svg>
);

export const IconClock = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 2" />
  </svg>
);

export const IconWhatsapp = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M7 17.5 4.5 20l1-4A8 8 0 1 1 9 19l-2-1.5Z" />
    <path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.7 0 1-.8.5-1.3l-1.2-1.2c-.3-.3-.7-.3-1 0-.3.3-.7.3-1.1 0-.8-.6-1.4-1.2-1.9-2-.2-.4-.2-.7.1-1l.2-.2c.3-.3.3-.7 0-1L8.4 7.1c-.5-.5-1.3-.2-1.3.5 0 .7.1 1.3.4 1.9Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAlert = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 4 21 19H3L12 4Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconChart = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
    <path d="M3 20h18" />
  </svg>
);

export const IconBox = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 8 12 4l8 4-8 4-8-4Z" />
    <path d="M4 8v8l8 4 8-4V8" />
    <path d="M12 12v8" />
  </svg>
);

export const IconReceipt = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 3.5h12v17l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2-1.5v-17Z" />
    <path d="M9 8.5h6M9 12h6M9 15.5h4" />
  </svg>
);

export const IconX = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
