# Rebranding & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Relance's visual identity (palette, typography, shape language), voice, and navigation shell with the direction validated in `docs/superpowers/specs/2026-07-14-rebranding-design.md`, moving away from the current look/tone that reads as generic/AI-templated.

**Architecture:** This is a frontend-only, CSS-token-driven rebrand. Because the app already has a real design system (CSS custom properties in `tokens.css`, reusable component classes in `base.css`/`pages.css`), most pages get restyled automatically once the tokens and shared classes change — no JSX edits needed for most pages. Two pages get structural JSX changes: `AppShell.jsx` (new tab-based nav, replacing the sidebar) and `Dashboard.jsx` (new "briefing" layout, replacing the stat-grid). A final small task removes the one remaining emoji instance the spec calls out.

**Tech Stack:** React 18 + Vite, plain CSS with custom properties (no Tailwind/CSS-in-JS), Google Fonts.

## Global Constraints

- Backend is untouched — this plan is 100% inside `frontend/`.
- No test suite or lint config exists in this repo (per `CLAUDE.md`) — every task verifies via `npm run build` (catches JS/JSX syntax errors) plus a visual check in the browser. There is no `npm test` to run.
- Preserve existing route paths, component prop shapes, and API call sites — only visual/structural presentation changes, not data flow.
- French UI copy, tutoiement (`tu`) — per the spec, keep it but make it more direct: short sentences, zero emoji.
- The `--live` color must remain reserved strictly for WhatsApp connection/success status — never used decoratively (existing project convention, restated in the spec).
- Naming stays "Relance" — out of scope for this plan.

---

### Task 1: Fonts and favicon in `index.html`

**Files:**
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `Fraunces`, `IBM Plex Sans`, `IBM Plex Mono` become available as loaded web fonts for `tokens.css` (Task 2) to reference by name.

- [ ] **Step 1: Replace the Google Fonts link and related meta tags**

In `frontend/index.html`, replace the entire `<head>` block with:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#10182B" />
  <title>Relance — le carnet client de ton WhatsApp</title>
  <meta name="description" content="Relance historise tes conversations WhatsApp, garde tes contacts et te dit qui relancer avant que tu perdes la vente." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><rect width=%2224%22 height=%2224%22 rx=%226%22 fill=%22%2310182B%22/><circle cx=%2212%22 cy=%2212%22 r=%224%22 fill=%22%23C99A3B%22/></svg>" />
</head>
```

This swaps the font family list (Sora/JetBrains Mono/Manrope → Fraunces/IBM Plex Sans/IBM Plex Mono), updates `theme-color` to the new navy ink, and replaces the orange-circle-emoji favicon with a small inline SVG using the new navy/gold palette.

- [ ] **Step 2: Verify the app still builds**

Run: `cd frontend && npm run build`
Expected: build succeeds with no errors (this task only touches static HTML, so this mainly guards against a typo breaking the file).

- [ ] **Step 3: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/index.html
git commit -m "Swap fonts and favicon to new brand identity"
```

---

### Task 2: Rewrite design tokens

**Files:**
- Modify: `frontend/src/styles/tokens.css`

**Interfaces:**
- Consumes: font family names loaded in Task 1 (`Fraunces`, `IBM Plex Sans`, `IBM Plex Mono`)
- Produces: every CSS custom property consumed by `base.css` (Task 3) and `pages.css` (Task 4) — notably `--ink`, `--ink-soft`, `--paper`, `--paper-raised`, `--paper-sunken`, `--accent`, `--accent-ink`, `--accent-tint`, `--live`, `--live-ink`, `--live-tint`, `--danger`, `--danger-tint`, `--line`, `--line-soft`, `--border-w` (new token), `--font-display`, `--font-body`, `--font-mono`, `--radius-sm/md/lg/pill`, `--shadow-float` (new token, replaces `--shadow-sticker`/`--shadow-sticker-sm`/`--shadow-lift`), spacing scale `--sp-1`..`--sp-8`, `--nav-h`, `--topbar-h`, `--max-content`.

- [ ] **Step 1: Replace the full contents of `tokens.css`**

```css
/*
  Design language for Relance — deep navy for structure/trust, a single
  muted amber accent for anything that needs attention, and a second
  signal color ("live") reserved strictly for WhatsApp connection/success
  state so it always reads as status, never decoration. Thin low-opacity
  borders instead of bold outlines or offset "sticker" shadows — shadows
  are reserved for genuinely floating elements (modals, QR frame).
  Fraunces for display type (a serif with real character, not another
  geometric grotesk), IBM Plex Sans for body, IBM Plex Mono for anything
  numeric.
*/

:root {
  /* --- color --- */
  --ink: #10182b;
  --ink-soft: #545b6e;
  --paper: #f8f6f1;
  --paper-raised: #ffffff;
  --paper-sunken: #efeae0;

  --accent: #c99a3b;
  --accent-ink: #6b4e17;
  --accent-tint: #f1e3c3;

  --live: #2f7a5c;
  --live-ink: #163f2e;
  --live-tint: #dceee5;

  --danger: #b4402a;
  --danger-tint: #f4ddd5;

  --line: rgba(16, 24, 43, 0.16);
  --line-soft: rgba(16, 24, 43, 0.08);
  --border-w: 1px;

  /* --- type --- */
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* --- shape --- */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-pill: 999px;

  --shadow-float: 0 8px 24px -8px rgba(16, 24, 43, 0.18);

  /* --- spacing scale --- */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 48px;
  --sp-8: 64px;

  --nav-h: 64px;
  --topbar-h: 56px;
  --max-content: 720px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ink: #f1eee6;
    --ink-soft: #b7bece;
    --paper: #10182b;
    --paper-raised: #182338;
    --paper-sunken: #0b1220;

    --accent-tint: #3a2e12;
    --live-tint: #11291f;
    --danger-tint: #3a1811;

    --line: rgba(241, 238, 230, 0.16);
    --line-soft: rgba(241, 238, 230, 0.08);

    --shadow-float: 0 8px 24px -8px rgba(0, 0, 0, 0.5);
  }
}
```

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds. The app will look visually broken/inconsistent at this point (base.css and pages.css still reference the old shadow/border patterns) — that's expected and fixed by Tasks 3–4.

- [ ] **Step 3: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/styles/tokens.css
git commit -m "Rewrite design tokens: navy/amber palette, Fraunces/Plex type, flatter shape language"
```

---

### Task 3: Restyle shared components in `base.css`

**Files:**
- Modify: `frontend/src/styles/base.css`

**Interfaces:**
- Consumes: tokens from Task 2 (`--border-w`, `--shadow-float`, `--radius-*`, all color tokens)
- Produces: `.tab-bar` / `.tab-bar__link` classes (new — unused until Task 5 wires them into `AppShell.jsx`, which is expected and harmless), plus every other class already consumed across the app (`.btn*`, `.field*`, `.card*`, `.avatar`, `.pill*`, `.stat*`, `.empty`, `.divider`, `.skeleton`, `.toast`, `.app-shell`, `.app-topbar`, `.app-main`, `.bottom-nav*`, type scale classes `.display-1/2`, `.h1/2`, `.eyebrow`, `.text-muted`, `.mono`).

- [ ] **Step 1: Replace the full contents of `base.css`**

```css
@import "./tokens.css";

*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior-y: none;
}
h1, h2, h3, h4 { font-family: var(--font-display); margin: 0; line-height: 1.15; letter-spacing: -0.01em; font-weight: 600; }
p { margin: 0; }
a { color: inherit; }
button { font-family: inherit; }
input, textarea, select { font-family: inherit; font-size: inherit; color: inherit; }
ul { margin: 0; padding: 0; list-style: none; }
img { max-width: 100%; display: block; }

::selection { background: var(--accent); color: var(--paper); }

/* ---------- type scale ---------- */
.display-1 { font-family: var(--font-display); font-weight: 600; font-size: 32px; letter-spacing: -0.01em; }
.display-2 { font-family: var(--font-display); font-weight: 600; font-size: 25px; letter-spacing: -0.01em; }
.h1 { font-family: var(--font-display); font-weight: 600; font-size: 20px; }
.h2 { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft);
}
.text-muted { color: var(--ink-soft); }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
@media (min-width: 640px) {
  .display-1 { font-size: 42px; }
  .display-2 { font-size: 29px; }
}

/* ---------- layout shell ---------- */
.app-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.app-topbar {
  position: sticky; top: 0; z-index: 20;
  height: var(--topbar-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--sp-4);
  background: var(--paper);
  border-bottom: var(--border-w) solid var(--line);
}
.app-main {
  flex: 1;
  min-width: 0;
  padding: var(--sp-4) var(--sp-4) calc(var(--nav-h) + var(--sp-6));
  max-width: var(--max-content);
  margin: 0 auto;
  width: 100%;
}
.tab-bar { display: none; }

.bottom-nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  height: var(--nav-h);
  display: flex;
  background: var(--paper-raised);
  border-top: var(--border-w) solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
.bottom-nav__item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 11px; font-weight: 600;
  border: none; background: none; cursor: pointer;
}
.bottom-nav__item svg { width: 22px; height: 22px; }
.bottom-nav__item.is-active { color: var(--ink); }
.bottom-nav__item.is-active .bottom-nav__dot {
  position: absolute; margin-top: -26px;
  width: 4px; height: 4px; border-radius: 999px; background: var(--accent);
}

@media (min-width: 900px) {
  .app-main { padding: var(--sp-6) var(--sp-7); max-width: 1100px; }
  .bottom-nav { display: none; }
  .tab-bar {
    display: flex;
    gap: var(--sp-1);
    padding: 0 var(--sp-7);
    border-bottom: var(--border-w) solid var(--line);
    background: var(--paper);
    position: sticky; top: var(--topbar-h); z-index: 19;
  }
  .tab-bar__link {
    display: flex; align-items: center; gap: 8px;
    padding: 14px var(--sp-3);
    text-decoration: none; color: var(--ink-soft); font-weight: 600; font-size: 13.5px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tab-bar__link svg { width: 16px; height: 16px; }
  .tab-bar__link.is-active { color: var(--ink); border-bottom-color: var(--accent); }
}

/* ---------- buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2);
  height: 44px; padding: 0 var(--sp-5);
  border-radius: var(--radius-md);
  border: var(--border-w) solid var(--line);
  font-weight: 600; font-size: 14px;
  cursor: pointer;
  background: var(--paper-raised);
  color: var(--ink);
  transition: opacity 0.1s ease, border-color 0.1s ease;
  white-space: nowrap;
}
.btn:active { opacity: 0.8; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent-ink); }
.btn--live { background: var(--live); color: var(--live-tint); border-color: var(--live-ink); }
.btn--ghost { background: transparent; border-color: var(--line-soft); }
.btn--danger { background: var(--danger-tint); border-color: var(--danger); }
.btn--sm { height: 36px; padding: 0 var(--sp-4); font-size: 13px; }
.btn--block { width: 100%; }
.btn--icon { width: 44px; padding: 0; }

/* ---------- form fields ---------- */
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-4); }
.field label { font-size: 12px; font-weight: 600; color: var(--ink-soft); }
.field input, .field textarea, .field select {
  height: 44px; padding: 0 var(--sp-4);
  border-radius: var(--radius-sm);
  border: var(--border-w) solid var(--line-soft);
  background: var(--paper-raised);
  outline: none;
}
.field textarea { height: auto; padding: var(--sp-3) var(--sp-4); min-height: 90px; resize: vertical; }
.field input:focus, .field textarea:focus, .field select:focus { border-color: var(--ink); }
.field-error { font-size: 12px; color: var(--danger); font-weight: 600; }

/* ---------- cards ---------- */
.card {
  background: var(--paper-raised);
  border: var(--border-w) solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--sp-5);
}
.card--tight { padding: var(--sp-4); }
.stack { display: flex; flex-direction: column; gap: var(--sp-4); }
.stack--sm { gap: var(--sp-2); }
.row { display: flex; align-items: center; gap: var(--sp-3); }
.row--between { justify-content: space-between; }

/* ---------- avatar ---------- */
.avatar {
  width: 42px; height: 42px; border-radius: var(--radius-pill);
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-tint); color: var(--accent-ink);
  font-family: var(--font-display); font-weight: 600; font-size: 15px;
  flex-shrink: 0; border: var(--border-w) solid var(--line);
}

/* ---------- pills / badges ---------- */
.pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: var(--radius-pill);
  font-size: 11px; font-weight: 600;
  border: var(--border-w) solid var(--line);
  background: var(--paper-raised);
}
.pill--live { background: var(--live-tint); color: var(--live-ink); border-color: var(--live-ink); }
.pill--accent { background: var(--accent-tint); color: var(--accent-ink); border-color: var(--accent-ink); }
.pill--danger { background: var(--danger-tint); color: var(--danger); border-color: var(--danger); }
.pill--dot::before { content: ""; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }

/* ---------- stat tile ---------- */
.stat {
  border: var(--border-w) solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--sp-4);
  background: var(--paper-raised);
}
.stat__value { font-family: var(--font-mono); font-weight: 600; font-size: 26px; }
.stat__label { font-size: 12px; color: var(--ink-soft); font-weight: 600; margin-top: 2px; }

/* ---------- empty state ---------- */
.empty {
  text-align: center;
  padding: var(--sp-7) var(--sp-4);
  color: var(--ink-soft);
}
.empty .h2 { color: var(--ink); margin-bottom: var(--sp-2); }

/* ---------- misc ---------- */
.divider { height: var(--border-w); background: var(--line-soft); border: none; margin: var(--sp-4) 0; }
.skeleton {
  background: linear-gradient(90deg, var(--paper-sunken) 25%, var(--line-soft) 37%, var(--paper-sunken) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

.toast {
  position: fixed; left: var(--sp-4); right: var(--sp-4); bottom: calc(var(--nav-h) + var(--sp-3));
  z-index: 50;
  background: var(--ink); color: var(--paper);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radius-sm);
  font-weight: 600; font-size: 13px;
  box-shadow: var(--shadow-float);
}
@media (min-width: 900px) {
  .toast { left: auto; right: var(--sp-6); bottom: var(--sp-6); width: 320px; }
}
```

Note: this removes the old `.app-sidebar` / `.sidebar-link` / `.app-body` rules entirely (replaced conceptually by `.tab-bar` / `.tab-bar__link`, and `.app-body` is no longer needed once `AppShell.jsx` is restructured in Task 5). Until Task 5 lands, `AppShell.jsx` still references `.app-sidebar`/`.app-body`/`.sidebar-link`, which will simply have no matching CSS rule — the sidebar will collapse to unstyled/invisible on desktop between Task 3 and Task 5. This is a temporary, expected intermediate state.

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/styles/base.css
git commit -m "Restyle shared components: flatter shape language, thin borders, tab-bar CSS"
```

---

### Task 4: Restyle page-specific components in `pages.css`

**Files:**
- Modify: `frontend/src/styles/pages.css`

**Interfaces:**
- Consumes: tokens from Task 2, `.card`/`.btn` conventions from Task 3
- Produces: `.briefing-alert`, `.stat-strip`, `.stat-strip__item`, `.stat-strip__value`, `.stat-strip__label` classes (new — unused until Task 6 wires them into `Dashboard.jsx`), plus every other page-level class already consumed (`.auth-screen`, `.auth-brand`, `.auth-card`, `.contact-row*`, `.search-bar`, `.thread`, `.bubble*`, `.thread-day`, `.qr-frame`, `.status-banner`, `.status-dot*`, `.step*`, `.suggestion-card*`, `.plan-toggle`, `.plan-grid`, `.plan-card*`, `.tag-chip`, `.tag-swatch`, `.bar-row*`).

- [ ] **Step 1: Replace the full contents of `pages.css`**

```css
/* ============ auth ============ */
.auth-screen {
  min-height: 100%;
  display: flex; flex-direction: column; justify-content: center;
  padding: var(--sp-6) var(--sp-4);
  gap: var(--sp-6);
  background: var(--paper);
}
.auth-brand { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.auth-card {
  width: 100%; max-width: 400px; margin: 0 auto;
}

/* ============ dashboard ============ */
.briefing-alert {
  display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
  border: var(--border-w) solid var(--accent-ink);
  background: var(--accent-tint);
  border-radius: var(--radius-lg);
  padding: var(--sp-4);
  text-decoration: none; color: var(--ink);
}
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--sp-3);
}
.stat-strip {
  display: flex;
  border: var(--border-w) solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.stat-strip__item {
  flex: 1;
  padding: var(--sp-3) var(--sp-4);
  border-right: var(--border-w) solid var(--line);
}
.stat-strip__item:last-child { border-right: none; }
.stat-strip__value { font-family: var(--font-mono); font-weight: 600; font-size: 20px; }
.stat-strip__label { font-size: 11px; color: var(--ink-soft); font-weight: 600; margin-top: 2px; }

/* ============ contact list ============ */
.contact-row {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-2);
  border-bottom: var(--border-w) solid var(--line-soft);
  text-decoration: none; color: inherit;
}
.contact-row:last-child { border-bottom: none; }
.contact-row__body { flex: 1; min-width: 0; }
.contact-row__top { display: flex; justify-content: space-between; gap: var(--sp-2); }
.contact-row__name { font-weight: 700; font-size: 14.5px; }
.contact-row__preview {
  color: var(--ink-soft); font-size: 13px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 100%;
}
.contact-row__time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-soft); flex-shrink: 0; }
.contact-row__tags { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }

.search-bar {
  display: flex; align-items: center; gap: var(--sp-2);
  border: var(--border-w) solid var(--line); border-radius: var(--radius-md);
  padding: 0 var(--sp-3); height: 44px;
  background: var(--paper-raised);
  margin-bottom: var(--sp-4);
}
.search-bar input { flex: 1; border: none; background: none; outline: none; height: 100%; font-size: 14px; }
.search-bar svg { color: var(--ink-soft); flex-shrink: 0; }

/* ============ contact detail / thread ============ */
.thread {
  display: flex; flex-direction: column; gap: var(--sp-2);
  padding: var(--sp-2) 0;
}
.bubble {
  max-width: 82%;
  padding: 9px 13px;
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.4;
  border: var(--border-w) solid var(--line);
}
.bubble--in { align-self: flex-start; background: var(--paper-raised); border-bottom-left-radius: 2px; }
.bubble--out {
  align-self: flex-end; background: var(--live-tint); border-color: var(--live-ink);
  border-bottom-right-radius: 2px;
}
.bubble__time { display: block; font-family: var(--font-mono); font-size: 10px; color: var(--ink-soft); margin-top: 4px; text-align: right; }
.thread-day {
  align-self: center;
  font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--ink-soft);
  background: var(--paper-sunken); padding: 3px 10px; border-radius: var(--radius-pill);
  margin: var(--sp-3) 0;
}

/* ============ connect / QR ============ */
.qr-frame {
  width: 220px; height: 220px; margin: 0 auto;
  border: var(--border-w) solid var(--line); border-radius: var(--radius-lg);
  padding: var(--sp-3);
  background: #fff;
  box-shadow: var(--shadow-float);
  display: flex; align-items: center; justify-content: center;
}
.qr-frame img { width: 100%; height: 100%; }
.status-banner {
  display: flex; align-items: center; gap: var(--sp-3);
  border: var(--border-w) solid var(--line); border-radius: var(--radius-lg);
  padding: var(--sp-4);
}
.status-dot { width: 12px; height: 12px; border-radius: 999px; flex-shrink: 0; }
.status-dot--connected { background: var(--live); box-shadow: 0 0 0 4px var(--live-tint); }
.status-dot--connecting { background: var(--accent); box-shadow: 0 0 0 4px var(--accent-tint); animation: pulse 1.4s ease infinite; }
.status-dot--disconnected { background: var(--danger); box-shadow: 0 0 0 4px var(--danger-tint); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.step-list { display: flex; flex-direction: column; gap: var(--sp-3); }
.step {
  display: flex; gap: var(--sp-3); align-items: flex-start;
}
.step__num {
  width: 26px; height: 26px; border-radius: 999px; border: var(--border-w) solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 12px; font-weight: 700; flex-shrink: 0;
  background: var(--paper-raised);
}

/* ============ suggestions / relances ============ */
.suggestion-card {
  border: var(--border-w) solid var(--line); border-radius: var(--radius-lg);
  padding: var(--sp-4);
  display: flex; flex-direction: column; gap: var(--sp-3);
}
.suggestion-card--critique { border-color: var(--danger); background: var(--danger-tint); }
.suggestion-card--attention { border-color: var(--accent-ink); background: var(--accent-tint); }
.suggestion-card--info { background: var(--paper-raised); }

/* ============ billing / pricing ============ */
.plan-toggle {
  display: inline-flex; border: var(--border-w) solid var(--line); border-radius: var(--radius-pill);
  padding: 3px; gap: 3px; margin-bottom: var(--sp-5);
}
.plan-toggle button {
  border: none; background: none; padding: 8px 16px; border-radius: var(--radius-pill);
  font-weight: 700; font-size: 12.5px; cursor: pointer; color: var(--ink-soft);
}
.plan-toggle button.is-active { background: var(--ink); color: var(--paper); }

.plan-grid { display: flex; flex-direction: column; gap: var(--sp-4); }
.plan-card {
  border: var(--border-w) solid var(--line); border-radius: var(--radius-lg);
  padding: var(--sp-5);
  position: relative;
}
.plan-card--featured {
  border: 2px solid var(--accent-ink); background: var(--paper-raised);
}
.plan-card__badge {
  position: absolute; top: -12px; right: 20px;
  background: var(--accent); color: var(--accent-ink); font-size: 11px; font-weight: 800;
  padding: 4px 10px; border-radius: var(--radius-pill); border: var(--border-w) solid var(--accent-ink);
}
.plan-card__price { font-family: var(--font-mono); font-weight: 700; font-size: 30px; margin: var(--sp-2) 0; }
.plan-card__price span { font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.plan-card ul { display: flex; flex-direction: column; gap: 8px; margin: var(--sp-4) 0; }
.plan-card li { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; }
.plan-card li svg { color: var(--live-ink); flex-shrink: 0; margin-top: 2px; }

@media (min-width: 720px) {
  .plan-grid { flex-direction: row; align-items: stretch; }
  .plan-card { flex: 1; }
}

/* ============ tags manager ============ */
.tag-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: var(--radius-pill);
  border: var(--border-w) solid var(--line); font-size: 12.5px; font-weight: 700;
  background: var(--paper-raised);
}
.tag-chip button { border: none; background: none; cursor: pointer; display: flex; color: inherit; opacity: 0.6; }
.tag-swatch { width: 10px; height: 10px; border-radius: 999px; }

/* ============ analytics bar-lists ============ */
.bar-row {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: 6px 0;
}
.bar-row__label {
  flex: 0 0 130px; font-size: 12.5px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.bar-row__track {
  flex: 1; height: 10px; border-radius: var(--radius-pill);
  background: var(--paper-sunken); border: var(--border-w) solid var(--line-soft);
  overflow: hidden;
}
.bar-row__fill { height: 100%; border-radius: var(--radius-pill); background: var(--accent); }
.bar-row__count {
  flex: 0 0 auto; min-width: 24px; text-align: right;
  font-family: var(--font-mono); font-size: 12px; color: var(--ink-soft);
}
```

Note: this removes `.stat-grid` and `.hero-banner` (the old dashboard classes, replaced by `.briefing-alert`/`.stat-strip`) — `Dashboard.jsx` still references the old classes until Task 6, so the dashboard will render unstyled stat cards in the gap between Task 4 and Task 6. This is a temporary, expected intermediate state, same pattern as Task 3's `.tab-bar` gap.

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/styles/pages.css
git commit -m "Restyle page components: remove decorative gradient/blob, flatten shape language"
```

---

### Task 5: Replace the sidebar with a responsive tab-based navigation shell

**Files:**
- Modify: `frontend/src/components/AppShell.jsx`

**Interfaces:**
- Consumes: `.tab-bar` / `.tab-bar__link` classes from Task 3, `NAV_ITEMS` shape (unchanged: `{ to, label, icon, end? }`)
- Produces: `AppShell` component with the same default export and same children (`<Outlet />`) contract — no consumer of `AppShell` (i.e. `App.jsx`) needs to change.

- [ ] **Step 1: Replace the full contents of `AppShell.jsx`**

```jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconHome, IconContacts, IconBell, IconLink, IconCard, IconLogout, IconChart, IconBox, IconReceipt } from "./icons.jsx";
import Logomark from "./Logomark.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: IconHome, end: true },
  { to: "/contacts", label: "Contacts", icon: IconContacts },
  { to: "/relances", label: "Relances", icon: IconBell },
  { to: "/catalogue", label: "Catalogue", icon: IconBox },
  { to: "/factures", label: "Factures", icon: IconReceipt },
  { to: "/analytiques", label: "Analytique", icon: IconChart },
  { to: "/connexion-whatsapp", label: "WhatsApp", icon: IconLink },
  { to: "/abonnement", label: "Abonnement", icon: IconCard },
];

function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={26} />
          <span className="h1">Relance</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {initialsOf(user?.businessName)}
          </div>
          <button className="btn btn--ghost btn--icon" onClick={handleLogout} aria-label="Se déconnecter">
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </header>

      <nav className="tab-bar">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab-bar__link${isActive ? " is-active" : ""}`}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            style={{ position: "relative" }}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="bottom-nav__dot" />}
                <Icon />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
```

This removes the `<div className="app-body">` wrapper and the `<nav className="app-sidebar">` block entirely, replacing them with a `<nav className="tab-bar">` placed between the topbar and the main content — on mobile it's hidden (`display: none` from Task 3) and the existing `.bottom-nav` takes over; on desktop (900px+) it becomes the horizontal tab row and `.bottom-nav` hides itself.

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Visual check**

Run: `cd frontend && npm run dev` (and `cd backend && npm run dev:memory` in another terminal if not already running), then open the app in a browser at both a mobile width (~390px) and a desktop width (~1280px) after logging in.
Expected: mobile shows bottom tab bar as before; desktop shows a horizontal tab row under the topbar instead of a left sidebar, with the active tab underlined in amber.

- [ ] **Step 4: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/components/AppShell.jsx
git commit -m "Replace sidebar with responsive tab-based navigation"
```

---

### Task 6: Restructure the Dashboard into a "briefing" layout

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `.briefing-alert`, `.stat-strip`, `.stat-strip__item` classes from Task 4; existing API endpoints `GET /stats/dashboard`, `GET /whatsapp/status`, `GET /digest/weekly` (all already implemented, unchanged)
- Produces: `Dashboard` default export with the same route usage (`<Route path="/" element={<Dashboard />} />` in `App.jsx`, unchanged)

- [ ] **Step 1: Replace the full contents of `Dashboard.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowRight, IconBell, IconLink, IconChart } from "../components/icons.jsx";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [digest, setDigest] = useState(null);

  useEffect(() => {
    api.get("/stats/dashboard").then(setStats).catch(() => {});
    api.get("/whatsapp/status").then(setWaStatus).catch(() => {});
    api.get("/digest/weekly").then(setDigest).catch(() => {});
  }, []);

  return (
    <div className="stack">
      <div>
        <span className="eyebrow">{user?.businessName}</span>
        <h1 className="display-2">Aujourd'hui</h1>
      </div>

      {waStatus && waStatus.status !== "connected" && (
        <Link to="/connexion-whatsapp" className="briefing-alert">
          <div>
            <div className="h2">WhatsApp déconnecté</div>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Scanne le QR pour démarrer.</p>
          </div>
          <IconArrowRight width={20} height={20} style={{ flexShrink: 0 }} />
        </Link>
      )}

      {digest && (
        <div className="card">
          <span className="eyebrow">Cette semaine</span>
          <div className="stack--sm" style={{ marginTop: 10 }}>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Leads chauds</span>
              <span className="mono" style={{ fontWeight: 600 }}>{digest.hotLeads.length}</span>
            </div>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Factures payées</span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {digest.paidInvoicesCount} · {formatFcfa(digest.paidInvoicesTotal)}
              </span>
            </div>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Messages en attente</span>
              <span className="mono" style={{ fontWeight: 600 }}>{digest.pendingFollowUpsCount}</span>
            </div>
          </div>
        </div>
      )}

      {stats?.pendingFollowUps != null && (
        <Link to="/relances" className="suggestion-card suggestion-card--attention" style={{ textDecoration: "none" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10 }}>
              <IconBell width={20} height={20} />
              <span style={{ fontWeight: 600 }}>
                {stats.pendingFollowUps} client{stats.pendingFollowUps > 1 ? "s" : ""} à relancer
              </span>
            </div>
            <IconArrowRight width={18} height={18} />
          </div>
        </Link>
      )}

      {stats?.pendingFollowUps == null && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconLink width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les suggestions de relance font partie du plan Pro.
            </span>
          </div>
          <Link to="/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      {stats?.analyticsEnabled && (
        <Link to="/analytiques" className="suggestion-card suggestion-card--info" style={{ textDecoration: "none" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10 }}>
              <IconChart width={20} height={20} />
              <span style={{ fontWeight: 600 }}>Voir mes statistiques</span>
            </div>
            <IconArrowRight width={18} height={18} />
          </div>
        </Link>
      )}

      {stats && !stats.analyticsEnabled && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconChart width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les statistiques font partie du plan Business.
            </span>
          </div>
          <Link to="/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      <div className="stat-strip">
        <StatStripItem label="Contacts" value={stats?.totalContacts} />
        <StatStripItem label="Messages / 7j" value={stats?.messagesLast7d} />
        <StatStripItem label="Reçus / 7j" value={stats?.inboundLast7d} />
        <StatStripItem label="Envoyés / 7j" value={stats?.outboundLast7d} />
      </div>
    </div>
  );
}

function StatStripItem({ label, value }) {
  return (
    <div className="stat-strip__item">
      <div className="stat-strip__value">{value ?? "—"}</div>
      <div className="stat-strip__label">{label}</div>
    </div>
  );
}
```

Changes from the previous version: no "Bonjour {name} 👋" greeting (replaced by business name as a small eyebrow + "Aujourd'hui" as the actual heading), the WhatsApp-disconnected prompt is now a compact `.briefing-alert` instead of a large decorative `.hero-banner` with a gradient blob, the weekly digest card moved above the pending-follow-ups/analytics cards (promoted to primary content per the spec), and the four raw counters moved from a 2×2 grid of `.stat` cards into a single compact `.stat-strip` at the bottom.

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Visual check**

With both dev servers running (see Task 5 Step 3), log in and view the dashboard.
Expected: eyebrow with business name, "Aujourd'hui" heading, no emoji, weekly digest card near the top, compact 4-column stat strip at the bottom instead of big stat cards.

- [ ] **Step 4: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/pages/Dashboard.jsx
git commit -m "Restructure dashboard into a briefing layout, promote weekly digest over raw counters"
```

---

### Task 7: Remove the remaining emoji from copy

**Files:**
- Modify: `frontend/src/pages/Relances.jsx`

**Interfaces:**
- Consumes: nothing new
- Produces: nothing consumed elsewhere — purely a copy edit

- [ ] **Step 1: Remove the emoji from the empty state**

In `frontend/src/pages/Relances.jsx`, find:

```jsx
          <div className="h2">Tout est à jour 🎉</div>
```

Replace with:

```jsx
          <div className="h2">Tout est à jour</div>
```

- [ ] **Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/macbookair/Desktop/relance
git add frontend/src/pages/Relances.jsx
git commit -m "Remove emoji from Relances empty state"
```

---

## Self-Review Notes

- **Spec coverage:** palette (Task 2) ✓, typography (Task 1 + 2) ✓, shape/shadow language (Task 2–4) ✓, voice/tone — zero-emoji + direct phrasing (Task 6 dashboard copy + Task 7; the rest of the app's copy was audited via `grep` for emoji and found already short/direct, so no further edits were needed there) ✓, navigation shell restructure (Task 3 CSS + Task 5 JSX) ✓, dashboard "briefing" restructure (Task 4 CSS + Task 6 JSX) ✓, logo re-executed with new palette — no code change needed since `Logomark.jsx` already reads colors from CSS custom properties (`var(--accent)`, `var(--ink)`), confirmed by reading the file; verify visually in Task 5/6's browser checks.
- **Out of scope, confirmed not silently dropped:** true master-detail split view for Contacts (list + detail side-by-side) is not implemented — Task 3 widens the desktop content area (1100px vs previous 880px) so multi-column grids (Catalogue) benefit automatically, but `ContactDetail.jsx` remains a full-page navigation. This matches the spec's emphasis on the navigation shell and dashboard as the two structural changes; a true split-view is a larger follow-up not covered here.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, copy-pasteable code.
- **Type/name consistency:** `.tab-bar`/`.tab-bar__link` (Task 3 → Task 5), `.briefing-alert`/`.stat-strip`/`.stat-strip__item` (Task 4 → Task 6), `--border-w`/`--shadow-float` (Task 2 → Tasks 3–4) — all names match exactly across producing and consuming tasks.
