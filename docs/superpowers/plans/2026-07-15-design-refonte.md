# Refonte du design (chantier 1/6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer entièrement le système de design (couleurs, composants, navigation) et la page d'accueil de Relance, sans conserver un seul bouton/écran à l'identique visuellement, tout en gardant l'app fonctionnelle à chaque étape.

**Architecture:** Nouveau système de tokens CSS ("Corail & Encre" : encre bleu-nuit + corail/terracotta, thème clair par défaut) + fusion de `base.css`/`pages.css` en un seul `components.css`. Navigation simplifiée de 8 à 4 sections (Aperçu, Conversations, Vendre, Réglages) via un renommage complet des routes React Router (le produit n'étant pas public, aucune redirection de compatibilité n'est nécessaire). Les pages fusionnées (Aperçu = Dashboard+Analytics, Conversations = Contacts+Relances) remplacent deux anciens fichiers chacune ; les pages simplement regroupées (Vendre, Réglages) gardent leurs formulaires existants sous un point d'entrée commun.

**Tech Stack:** React 18 + Vite + react-router-dom (existant, inchangé). CSS custom properties (pas de framework CSS). Aucune nouvelle dépendance.

## Global Constraints

- Toutes les chaînes visibles à l'utilisateur restent en français, cohérentes avec le ton actuel (ex: "Se déconnecter", "Voir les plans").
- Cibles tactiles ≥ 48px, testé visuellement à 360px et 375px de large avant desktop (≥900px) — ce sont les tailles d'écran les plus courantes visées par le produit (vendeurs ivoiriens, Android d'entrée de gamme).
- Aucune grille à largeur de carte fixe (`width: 220px` en dur) — toujours `grid-template-columns: repeat(auto-fill, minmax(...))`.
- Le produit n'est pas encore public : les routes sont renommées franchement, sans redirection `/ancienne-route → /nouvelle-route`.
- Aucune modification de logique backend ou de `AuthContext.jsx`/`api/client.js` dans ce chantier — uniquement CSS, structure de pages et routage frontend.
- Pas de suite de tests frontend automatisée dans ce repo (confirmé, non introduite par ce chantier) — chaque tâche se termine par une vérification manuelle au navigateur avec le compte de test déjà seedé (`test@relance.ci` / `password123`, plan Business actif) via `cd backend && npm run dev:memory:seeded` (port 4040) et `cd frontend && npm run dev` (port 5173, proxy vers 4040).
- Référence : `docs/superpowers/specs/2026-07-15-design-refonte-design.md` (spec approuvé).

---

## Task 1: Système de design — tokens et composants CSS

**Files:**
- Modify: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/components.css`
- Delete: `frontend/src/styles/base.css`
- Delete: `frontend/src/styles/pages.css`
- Modify: `frontend/src/main.jsx:6-7`
- Modify: `frontend/src/pages/Billing.jsx:92` (renommage de classe uniquement)

**Interfaces:**
- Produces: tous les noms de classes CSS existants sont conservés à l'identique (`.btn`, `.card`, `.field`, `.pill`, `.tag-chip`, `.contact-row`, `.bubble`, `.suggestion-card`, `.plan-card`, `.stat-strip`, `.bar-row`, `.qr-frame`, `.status-banner`, `.auth-screen`, `.landing-*`, etc.) — aucune page ne nécessite de changement de `className` dans ce chantier, sauf `Billing.jsx` (`.plan-toggle` → `.segmented`, généralisé pour être réutilisé par la page Conversations au Task 4). Nouvelle classe produite : `.product-grid` (grille responsive, consommée au Task 5).
- Consumes: rien (fondation du chantier).

- [ ] **Step 1: Remplacer `frontend/src/styles/tokens.css`**

```css
/*
  Design language for Relance — encre bleu-nuit pour la structure, corail
  brûlé comme unique accent de marque/action (CTA, urgence de relance,
  élément actif), jade réservé strictement aux signaux de statut positif
  (connecté, payé, client actif) — jamais utilisé comme couleur de marque
  générale, pour ne jamais retomber sur l'association "vert = WhatsApp".
  Thème clair par défaut : lisibilité en plein soleil, usage mobile dominant
  en Côte d'Ivoire. Fraunces pour le display, IBM Plex Sans pour le corps,
  IBM Plex Mono pour le numérique — inchangés depuis la version précédente,
  seule la palette et l'échelle de coins ont changé.
*/

:root {
  /* --- color --- */
  --ink: #16181d;
  --ink-soft: #5b6068;
  --paper: #faf8f4;
  --paper-raised: #ffffff;
  --paper-sunken: #f0eee8;

  --accent: #c2452b;
  --accent-ink: #7a2c1b;
  --accent-tint: #ffe4d6;

  --live: #0b6e4f;
  --live-ink: #0b6e4f;
  --live-tint: #e4f2ec;

  --danger: #b4402a;
  --danger-tint: #f4ddd5;

  --line: rgba(22, 24, 29, 0.16);
  --line-soft: rgba(22, 24, 29, 0.08);
  --border-w: 1px;

  /* --- type --- */
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* --- shape --- */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  --shadow-float: 0 8px 24px -8px rgba(22, 24, 29, 0.18);

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
    --paper: #16181d;
    --paper-raised: #202329;
    --paper-sunken: #101216;

    --accent-tint: #3a1e14;
    --live-tint: #0e241c;
    --danger-tint: #3a1811;

    --line: rgba(241, 238, 230, 0.16);
    --line-soft: rgba(241, 238, 230, 0.08);

    --shadow-float: 0 8px 24px -8px rgba(0, 0, 0, 0.5);
  }
}
```

Les noms de tokens `--accent*`/`--live*` sont volontairement conservés (seules leurs valeurs hexadécimales changent) : aucun fichier JSX ne référence de couleur en dur, ils utilisent tous `var(--accent...)`/`var(--live...)` — ce remplacement de valeurs suffit à appliquer la nouvelle palette partout sans toucher un seul composant React.

- [ ] **Step 2: Créer `frontend/src/styles/components.css`**

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
  height: 48px; padding: 0 var(--sp-5);
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
.btn--sm { height: 40px; padding: 0 var(--sp-4); font-size: 13px; }
.btn--block { width: 100%; }
.btn--icon { width: 48px; padding: 0; }

/* ---------- form fields ---------- */
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-4); }
.field label { font-size: 12px; font-weight: 600; color: var(--ink-soft); }
.field input, .field textarea, .field select {
  height: 48px; padding: 0 var(--sp-4);
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

/* ---------- segmented control (filtres Conversations, cycles Abonnement) ---------- */
.segmented {
  display: inline-flex; border: var(--border-w) solid var(--line); border-radius: var(--radius-pill);
  padding: 3px; gap: 3px;
}
.segmented > * {
  border: none; background: none; padding: 8px 16px; border-radius: var(--radius-pill);
  font-weight: 700; font-size: 12.5px; cursor: pointer; color: var(--ink-soft);
  text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
}
.segmented > .is-active { background: var(--ink); color: var(--paper); }

/* ---------- responsive product/photo grid (Vendre, Storefront) ---------- */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--sp-3);
}

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

/* ============ landing ============ */
.landing {
  min-height: 100%;
  background: var(--paper);
}
.landing-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--sp-4) var(--sp-4);
  max-width: 1100px; margin: 0 auto;
}
.landing-hero {
  text-align: center;
  max-width: 720px; margin: 0 auto;
  padding: var(--sp-7) var(--sp-4) var(--sp-6);
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-4);
}
.landing-hero-mockup {
  width: 100%; max-width: 300px; margin: var(--sp-4) auto 0;
  background: var(--paper-raised);
  border: var(--border-w) solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-float);
  text-align: left;
}
.landing-features {
  display: grid; grid-template-columns: 1fr; gap: var(--sp-3);
  max-width: 1100px; margin: 0 auto;
  padding: 0 var(--sp-4) var(--sp-6);
}
.landing-feature svg { color: var(--accent-ink); }
.landing-pricing {
  padding: var(--sp-6) var(--sp-4);
  max-width: 1100px; margin: 0 auto;
}
.landing-footer {
  text-align: center;
  padding: var(--sp-6) var(--sp-4);
  border-top: var(--border-w) solid var(--line-soft);
}
@media (min-width: 640px) {
  .landing-features { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 900px) {
  .landing-features { grid-template-columns: repeat(3, 1fr); }
}

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

/* ============ dashboard / aperçu ============ */
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

/* ============ contact list (Conversations) ============ */
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
  padding: 0 var(--sp-3); height: 48px;
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

/* ============ connect / QR (Réglages) ============ */
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

/* ============ suggestions / relance (Conversations) ============ */
.suggestion-card {
  border: var(--border-w) solid var(--line); border-radius: var(--radius-lg);
  padding: var(--sp-4);
  display: flex; flex-direction: column; gap: var(--sp-3);
}
.suggestion-card--critique { border-color: var(--danger); background: var(--danger-tint); }
.suggestion-card--attention { border-color: var(--accent-ink); background: var(--accent-tint); }
.suggestion-card--info { background: var(--paper-raised); }

/* ============ billing / pricing (Réglages) ============ */
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

/* ============ tags manager (Conversations) ============ */
.tag-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: var(--radius-pill);
  border: var(--border-w) solid var(--line); font-size: 12.5px; font-weight: 700;
  background: var(--paper-raised);
}
.tag-chip button { border: none; background: none; cursor: pointer; display: flex; color: inherit; opacity: 0.6; }
.tag-swatch { width: 10px; height: 10px; border-radius: 999px; }

/* ============ bar-lists (Aperçu) ============ */
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

- [ ] **Step 3: Supprimer les deux anciens fichiers CSS**

```bash
git rm frontend/src/styles/base.css frontend/src/styles/pages.css
```

- [ ] **Step 4: Mettre à jour `frontend/src/main.jsx` (lignes 6-7)**

Remplacer :
```js
import "./styles/base.css";
import "./styles/pages.css";
```
par :
```js
import "./styles/components.css";
```

- [ ] **Step 5: Renommer la classe dans `frontend/src/pages/Billing.jsx:92`**

Remplacer :
```jsx
      <div className="plan-toggle">
```
par :
```jsx
      <div className="segmented">
```

(Le CSS `.plan-toggle button`/`.plan-toggle button.is-active` de l'ancien `pages.css` a été généralisé en `.segmented > *`/`.segmented > .is-active` à l'étape 2 — fonctionne à l'identique pour des `<button>`, et sera réutilisé par des `NavLink` au Task 2 et au Task 4.)

- [ ] **Step 6: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur.

```bash
cd backend && npm run dev:memory:seeded
```
(dans un autre terminal, en parallèle)
```bash
cd frontend && npm run dev
```

Dans le navigateur, connecté avec `test@relance.ci` / `password123` :
- Vérifier à 360px, 375px puis desktop (redimensionner la fenêtre ou DevTools responsive) que le Tableau de bord, Contacts, un détail de contact, Relances, Catalogue, Factures, Analytique, WhatsApp et Abonnement s'affichent tous avec la nouvelle palette (encre/corail, plus d'amber) et sans régression de mise en page.
- Vérifier que le bouton "Mensuel/Trimestriel/Annuel" sur `/abonnement` fonctionne toujours (juste renommé en `.segmented`).
- Vérifier `/`, `/connexion`, `/inscription` (thème clair, pas de contenu cassé).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/src/styles/components.css frontend/src/main.jsx frontend/src/pages/Billing.jsx
git commit -m "feat: replace design tokens and merge CSS into components.css (Corail & Encre)"
```

---

## Task 2: Navigation et routage — 4 sections

**Files:**
- Modify: `frontend/src/components/AppShell.jsx`
- Modify: `frontend/src/components/icons.jsx` (ajout d'une icône)
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/pages/Vendre.jsx`
- Create: `frontend/src/pages/Reglages.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx` (liens uniquement, lignes 31, 84, 89, 108)
- Modify: `frontend/src/pages/ContactDetail.jsx` (liens uniquement, lignes 95, 175)
- Modify: `frontend/src/pages/Contacts.jsx` (lien uniquement, ligne 96)
- Modify: `frontend/src/pages/Tags.jsx` (lien uniquement, ligne 40)
- Modify: `frontend/src/pages/Analytics.jsx` (lien uniquement, ligne 64)
- Modify: `frontend/src/pages/Relances.jsx` (liens uniquement, lignes 42, 91)

**Interfaces:**
- Consumes: `.segmented` (Task 1), `.contact-row`/`.contact-row__body` (Task 1, réutilisés par `Reglages.jsx`).
- Produces: routes finales `/apercu`, `/conversations`, `/conversations/:id`, `/conversations/tags`, `/vendre` (+ `/vendre/catalogue`, `/vendre/factures`), `/reglages` (+ `/reglages/whatsapp`, `/reglages/abonnement`). Composants `Vendre` (default export, sub-nav + `<Outlet/>`) et `Reglages` (default export, menu + `<Outlet/>` conditionnel).
- **Scaffolding temporaire assumé** : `/relances` (→ `Relances.jsx` inchangé) et `/analytiques` (→ `Analytics.jsx` inchangé) restent montés dans `App.jsx` à l'issue de ce Task, en dehors de la nav principale à 4 items — ils ne sont accessibles que via les liens internes de `Dashboard.jsx`. Ce sont des routes de transition volontaires : le Task 3 les supprime en même temps qu'il fusionne leur contenu dans `Apercu.jsx`. Ne pas les supprimer par anticipation dans ce Task.

- [ ] **Step 1: Ajouter une icône réglages dans `frontend/src/components/icons.jsx`**

Ajouter à la fin du fichier (après `IconX`) :

```jsx
export const IconSettings = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.6M12 17.9v2.6M20.5 12h-2.6M6.1 12H3.5M17.7 6.3l-1.8 1.8M8.1 15.9l-1.8 1.8M17.7 17.7l-1.8-1.8M8.1 8.1 6.3 6.3" />
  </svg>
);
```

- [ ] **Step 2: Réécrire `frontend/src/components/AppShell.jsx`**

```jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconHome, IconContacts, IconBox, IconSettings, IconLogout } from "./icons.jsx";
import Logomark from "./Logomark.jsx";

const NAV_ITEMS = [
  { to: "/apercu", label: "Aperçu", icon: IconHome },
  { to: "/conversations", label: "Conversations", icon: IconContacts },
  { to: "/vendre", label: "Vendre", icon: IconBox },
  { to: "/reglages", label: "Réglages", icon: IconSettings },
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
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tab-bar__link${isActive ? " is-active" : ""}`}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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

- [ ] **Step 3: Créer `frontend/src/pages/Vendre.jsx`**

```jsx
import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "catalogue", label: "Catalogue" },
  { to: "factures", label: "Factures" },
];

export default function Vendre() {
  return (
    <div className="stack">
      <h1 className="display-2">Vendre</h1>
      <div className="segmented">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? "is-active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 4: Créer `frontend/src/pages/Reglages.jsx`**

```jsx
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLink, IconCard, IconBox, IconLogout, IconCheck, IconArrowRight } from "../components/icons.jsx";

const MENU = [
  { to: "whatsapp", label: "Connexion WhatsApp", icon: IconLink },
  { to: "abonnement", label: "Abonnement", icon: IconCard },
];

export default function Reglages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const atIndex = location.pathname === "/reglages";

  const copyStoreLink = () => {
    const url = `${window.location.origin}/v/${user?.storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  if (!atIndex) {
    return (
      <div className="stack">
        <Link to="/reglages" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          ← Réglages
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="display-2">Réglages</h1>

      <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
        {MENU.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="contact-row">
              <Icon width={20} height={20} />
              <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
              <IconArrowRight width={16} height={16} />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={copyStoreLink}
            className="contact-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
          >
            <IconBox width={20} height={20} />
            <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>
              {copied ? "Lien copié !" : "Lien de ma vitrine"}
            </span>
            {copied ? <IconCheck width={16} height={16} /> : <IconArrowRight width={16} height={16} />}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="contact-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", color: "var(--danger)" }}
          >
            <IconLogout width={20} height={20} />
            <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>Déconnexion</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Réécrire `frontend/src/App.jsx`**

```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Contacts from "./pages/Contacts.jsx";
import ContactDetail from "./pages/ContactDetail.jsx";
import Tags from "./pages/Tags.jsx";
import Connect from "./pages/Connect.jsx";
import Relances from "./pages/Relances.jsx";
import Analytics from "./pages/Analytics.jsx";
import Billing from "./pages/Billing.jsx";
import Catalog from "./pages/Catalog.jsx";
import Storefront from "./pages/Storefront.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoicePublic from "./pages/InvoicePublic.jsx";
import Landing from "./pages/Landing.jsx";
import Vendre from "./pages/Vendre.jsx";
import Reglages from "./pages/Reglages.jsx";

function PrivateArea() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  return <AppShell />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/apercu" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/apercu" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/inscription" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/v/:storeSlug" element={<Storefront />} />
      <Route path="/f/:publicToken" element={<InvoicePublic />} />

      <Route element={<PrivateArea />}>
        <Route path="/apercu" element={<Dashboard />} />
        <Route path="/relances" element={<Relances />} />
        <Route path="/analytiques" element={<Analytics />} />

        <Route path="/conversations" element={<Contacts />} />
        <Route path="/conversations/tags" element={<Tags />} />
        <Route path="/conversations/:id" element={<ContactDetail />} />

        <Route path="/vendre" element={<Vendre />}>
          <Route index element={<Navigate to="catalogue" replace />} />
          <Route path="catalogue" element={<Catalog />} />
          <Route path="factures" element={<Invoices />} />
        </Route>

        <Route path="/reglages" element={<Reglages />}>
          <Route path="whatsapp" element={<Connect />} />
          <Route path="abonnement" element={<Billing />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

`/relances` et `/analytiques` restent montés (scaffolding temporaire décrit ci-dessus, hors nav principale) — supprimés au Task 3.

- [ ] **Step 6: Corriger les liens internes cassés par le renommage**

`frontend/src/pages/Dashboard.jsx:31` — remplacer :
```jsx
        <Link to="/connexion-whatsapp" className="briefing-alert">
```
par :
```jsx
        <Link to="/reglages/whatsapp" className="briefing-alert">
```

`frontend/src/pages/Dashboard.jsx:84` et `:108` (les deux occurrences identiques `<Link to="/abonnement" className="btn btn--sm">Voir les plans</Link>`) — remplacer chacune par :
```jsx
          <Link to="/reglages/abonnement" className="btn btn--sm">Voir les plans</Link>
```

(Ligne 63, `to="/relances"`, et ligne 89, `to="/analytiques"` : **ne pas modifier** — ces routes restent volontairement actives jusqu'au Task 3.)

`frontend/src/pages/ContactDetail.jsx:95` — remplacer :
```jsx
      <Link to="/contacts" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
```
par :
```jsx
      <Link to="/conversations" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
```

`frontend/src/pages/ContactDetail.jsx:175` — remplacer :
```jsx
              <Link to="/contacts/tags" className="text-muted" style={{ fontSize: 12.5 }}>Créer un tag →</Link>
```
par :
```jsx
              <Link to="/conversations/tags" className="text-muted" style={{ fontSize: 12.5 }}>Créer un tag →</Link>
```

`frontend/src/pages/Contacts.jsx:96` — remplacer :
```jsx
              <Link to={`/contacts/${c._id}`} className="contact-row">
```
par :
```jsx
              <Link to={`/conversations/${c._id}`} className="contact-row">
```

`frontend/src/pages/Tags.jsx:40` — remplacer :
```jsx
      <Link to="/contacts" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
```
par :
```jsx
      <Link to="/conversations" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
```

`frontend/src/pages/Analytics.jsx:64` — remplacer :
```jsx
          <Link to="/abonnement" className="btn btn--primary">Voir les plans</Link>
```
par :
```jsx
          <Link to="/reglages/abonnement" className="btn btn--primary">Voir les plans</Link>
```

`frontend/src/pages/Relances.jsx:42` — remplacer :
```jsx
          <Link to="/abonnement" className="btn btn--primary">Voir les plans</Link>
```
par :
```jsx
          <Link to="/reglages/abonnement" className="btn btn--primary">Voir les plans</Link>
```

`frontend/src/pages/Relances.jsx:91` — remplacer :
```jsx
                <Link to={`/contacts/${contact._id}`} className="btn btn--sm btn--ghost" style={{ flex: 1 }}>
```
par :
```jsx
                <Link to={`/conversations/${contact._id}`} className="btn btn--sm btn--ghost" style={{ flex: 1 }}>
```

- [ ] **Step 7: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur (tous les fichiers importés dans `App.jsx` existent).

Avec les deux serveurs de dev lancés (voir Task 1 Step 6) et connecté avec le compte de test :
- Vérifier que la nav basse (mobile, 360px/375px) affiche 4 icônes : Aperçu, Conversations, Vendre, Réglages, et que la tab-bar desktop affiche les 4 mêmes.
- Cliquer chaque onglet : `/apercu` (Dashboard inchangé), `/conversations` (Contacts inchangé, mais cliquer un contact doit ouvrir `/conversations/:id` sans 404), `/vendre` doit rediriger vers `/vendre/catalogue` et afficher les sous-onglets Catalogue/Factures fonctionnels, `/reglages` doit afficher le menu (Connexion WhatsApp, Abonnement, Lien de ma vitrine, Déconnexion) et chaque lien doit ouvrir le bon écran sans 404.
- Depuis `/conversations/:id`, vérifier que "Gérer" les tags puis "Créer un tag →" ouvre bien `/conversations/tags` sans 404, et que "← Contacts"/"← Réglages" ramènent au bon endroit.
- Sur `/apercu`, vérifier que la bannière WhatsApp déconnecté pointe vers `/reglages/whatsapp` et que les liens "Voir les plans" pointent vers `/reglages/abonnement`, sans 404.
- Vérifier que `/relances` et `/analytiques` restent accessibles depuis les cartes du Dashboard (scaffolding temporaire) même si absents de la nav principale.
- Tester "Lien de ma vitrine" dans Réglages : le presse-papier doit contenir une URL `/v/<storeSlug>` valide, "Lien copié !" doit s'afficher puis revenir après 1.5s.
- Tester "Déconnexion" depuis Réglages : doit rediriger vers `/connexion`.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/AppShell.jsx frontend/src/components/icons.jsx frontend/src/App.jsx \
  frontend/src/pages/Vendre.jsx frontend/src/pages/Reglages.jsx \
  frontend/src/pages/Dashboard.jsx frontend/src/pages/ContactDetail.jsx frontend/src/pages/Contacts.jsx \
  frontend/src/pages/Tags.jsx frontend/src/pages/Analytics.jsx frontend/src/pages/Relances.jsx
git commit -m "feat: restructure navigation into 4 sections (Aperçu, Conversations, Vendre, Réglages)"
```

---

## Task 3: Page Aperçu (fusion Dashboard + Analytics)

**Files:**
- Create: `frontend/src/pages/Apercu.jsx`
- Delete: `frontend/src/pages/Dashboard.jsx`
- Delete: `frontend/src/pages/Analytics.jsx`
- Modify: `frontend/src/App.jsx` (route `/apercu`, suppression de `/relances`... non — voir note ; suppression de `/analytiques` uniquement dans ce Task)
- Modify: `frontend/src/pages/Relances.jsx` (lien uniquement, ligne 63 équivalent une fois déplacé — voir Step 3)

**Interfaces:**
- Consumes: `GET /stats/dashboard`, `GET /whatsapp/status`, `GET /digest/weekly`, `GET /analytics/summary`, `GET /analytics/contacts.csv` (téléchargement) — endpoints existants, inchangés. `.briefing-alert`, `.stat-strip`, `.suggestion-card`, `.card`, `.bar-row` (Task 1).
- Produces: `Apercu` (default export de `frontend/src/pages/Apercu.jsx`), monté sur `/apercu`.

Ce Task fusionne le contenu de `Dashboard.jsx` (lu en amont) et `Analytics.jsx` (lu en amont) en une seule page qui empile : bannière WhatsApp déconnecté → digest hebdomadaire → alerte relances en attente → stat-strip (contacts/messages) → section pipeline/analytics condensée (funnel, temps de réponse, tags, top clients, heures/jours d'affluence) avec le même comportement de verrouillage par plan (`analyticsEnabled`) qu'avant.

- [ ] **Step 1: Créer `frontend/src/pages/Apercu.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowRight, IconBell, IconLink, IconChart } from "../components/icons.jsx";

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

function BarList({ items, emptyLabel = "Pas encore de données." }) {
  if (items.length === 0) return <p className="text-muted" style={{ fontSize: 13 }}>{emptyLabel}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      {items.map((item) => (
        <div key={item.key} className="bar-row">
          <span className="bar-row__label">{item.label}</span>
          <span className="bar-row__track">
            <span className="bar-row__fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </span>
          <span className="bar-row__count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function Apercu() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [digest, setDigest] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    api.get("/stats/dashboard").then(setStats).catch(() => {});
    api.get("/whatsapp/status").then(setWaStatus).catch(() => {});
    api.get("/digest/weekly").then(setDigest).catch(() => {});
    api
      .get("/analytics/summary")
      .then(setAnalytics)
      .catch((err) => {
        if (err.message.includes("réservée")) setAnalyticsLocked(true);
      });
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    setExportError("");
    try {
      await api.download("/analytics/contacts.csv", "contacts.csv");
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const topHours = analytics
    ? [...analytics.activity.byHour].sort((a, b) => b.count - a.count).slice(0, 6).map((h) => ({ key: h.hour, label: `${h.hour}h`, count: h.count }))
    : [];
  const byDay = analytics ? analytics.activity.byDay.map((d) => ({ key: d.day, label: d.day, count: d.count })) : [];
  const topTags = analytics ? analytics.topTags.map((t) => ({ key: t.label, label: t.label, count: t.count })) : [];
  const topContacts = analytics ? analytics.topContacts.map((c) => ({ key: c._id, label: c.displayName, count: c.messageCount })) : [];

  return (
    <div className="stack">
      <div>
        <span className="eyebrow">{user?.businessName}</span>
        <h1 className="display-2">Aujourd'hui</h1>
      </div>

      {waStatus && waStatus.status !== "connected" && (
        <Link to="/reglages/whatsapp" className="briefing-alert">
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
        <Link to="/conversations?filtre=a-relancer" className="suggestion-card suggestion-card--attention" style={{ textDecoration: "none" }}>
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
          <Link to="/reglages/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      <div className="stat-strip">
        <StatStripItem label="Contacts" value={stats?.totalContacts} />
        <StatStripItem label="Messages / 7j" value={stats?.messagesLast7d} />
        <StatStripItem label="Reçus / 7j" value={stats?.inboundLast7d} />
        <StatStripItem label="Envoyés / 7j" value={stats?.outboundLast7d} />
      </div>

      <div className="row row--between" style={{ marginTop: 8 }}>
        <div className="eyebrow">Statistiques</div>
        {analytics && (
          <button className="btn btn--sm" onClick={exportCsv} disabled={exporting}>
            {exporting ? "Export…" : "Exporter en CSV"}
          </button>
        )}
      </div>
      {exportError && <p className="field-error">{exportError}</p>}

      {analyticsLocked && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconChart width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les statistiques avancées font partie du plan Business.
            </span>
          </div>
          <Link to="/reglages/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      {analytics && (
        <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Pipeline</div>
            <div className="stat-strip">
              {analytics.funnel.map((f) => (
                <div key={f.status} className="stat-strip__item">
                  <div className="stat-strip__value">{f.count}</div>
                  <div className="stat-strip__label">{STATUS_LABEL[f.status] || f.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Temps de réponse moyen</span>
            {analytics.avgResponseTime.sampleSize > 0 ? (
              <>
                <div className="stat__value" style={{ marginTop: 8 }}>{analytics.avgResponseTime.avgMinutes} min</div>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Basé sur {analytics.avgResponseTime.sampleSize} réponse{analytics.avgResponseTime.sampleSize > 1 ? "s" : ""} (90 derniers jours)
                </p>
              </>
            ) : (
              <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>—</p>
            )}
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Tags les plus utilisés</span>
            <div style={{ marginTop: 10 }}>
              <BarList items={topTags} emptyLabel="Aucun tag utilisé pour l'instant." />
            </div>
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Clients les plus actifs</span>
            <div style={{ marginTop: 10 }}>
              <BarList items={topContacts} emptyLabel="Pas encore de conversations." />
            </div>
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Heures d'affluence</span>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 10 }}>
              Quand tes clients t'écrivent le plus.
            </p>
            <BarList items={topHours} />
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Jours d'affluence</span>
            <div style={{ marginTop: 10 }}>
              <BarList items={byDay} />
            </div>
          </div>
        </>
      )}
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

Note : le lien "à relancer" pointe vers `/conversations?filtre=a-relancer` — ce query param n'est pas encore lu par `Contacts.jsx` (ce sera fait au Task 4 quand la page devient `Conversations.jsx` avec le filtre segmenté). D'ici le Task 4, le clic amène simplement sur `/conversations` sans présélectionner le filtre — dégradation mineure et temporaire, pas un lien cassé.

- [ ] **Step 2: Supprimer les deux anciens fichiers et corriger `App.jsx`**

```bash
git rm frontend/src/pages/Dashboard.jsx frontend/src/pages/Analytics.jsx
```

Dans `frontend/src/App.jsx`, remplacer l'import :
```jsx
import Dashboard from "./pages/Dashboard.jsx";
```
```jsx
import Analytics from "./pages/Analytics.jsx";
```
par un seul import :
```jsx
import Apercu from "./pages/Apercu.jsx";
```

Remplacer les routes :
```jsx
        <Route path="/apercu" element={<Dashboard />} />
        <Route path="/relances" element={<Relances />} />
        <Route path="/analytiques" element={<Analytics />} />
```
par :
```jsx
        <Route path="/apercu" element={<Apercu />} />
        <Route path="/relances" element={<Relances />} />
```

(`/relances` reste — supprimé au Task 4 en même temps que `Relances.jsx`. `/analytiques` disparaît ici puisque son contenu est maintenant dans `Apercu`.)

- [ ] **Step 3: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur.

Avec les serveurs de dev lancés et connecté avec le compte de test (qui a `plan.id: "business"`, donc `analyticsEnabled` vrai) :
- Visiter `/apercu` : vérifier que toutes les sections apparaissent dans l'ordre (bannière WhatsApp si déconnecté, digest hebdo, alerte relances, stat-strip, pipeline, temps de réponse, tags, top clients, heures/jours d'affluence).
- Cliquer "Exporter en CSV" : le téléchargement doit se déclencher sans erreur.
- Vérifier que `/analytiques` renvoie maintenant vers `/` (route `*` catch-all) puisqu'elle n'existe plus.
- Re-tester à 360px/375px/desktop qu'aucune section ne déborde.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Apercu.jsx frontend/src/App.jsx
git commit -m "feat: merge Dashboard and Analytics into a single Apercu page"
```

---

## Task 4: Page Conversations (fusion Contacts + Relances)

**Files:**
- Create: `frontend/src/pages/Conversations.jsx`
- Delete: `frontend/src/pages/Contacts.jsx`
- Delete: `frontend/src/pages/Relances.jsx`
- Modify: `frontend/src/App.jsx` (route `/conversations`, suppression de `/relances`)
- Modify: `frontend/src/pages/Apercu.jsx:78` (lien, une fois le filtre disponible)

**Interfaces:**
- Consumes: `GET /contacts?q=&status=` (existant, inchangé), `GET /suggestions` (existant, inchangé — utilisé pour peupler le filtre "À relancer" avec les mêmes contacts qu'avant, dans le même ordre d'urgence), `.segmented` (Task 1), `.search-bar`/`.pill`/`.contact-row` (Task 1).
- Produces: `Conversations` (default export), monté sur `/conversations`. Query param `?filtre=tous|a-relancer|clients|perdus` lu au montage pour présélectionner l'onglet.

Ce Task fusionne `Contacts.jsx` (liste + recherche + filtre par statut existant) et `Relances.jsx` (liste triée par urgence de `/suggestions`) en une seule page avec un `.segmented` en tête : `Tous` / `À relancer · N` / `Clients` / `Perdus`. Le filtre `Tous` et les filtres de statut reprennent exactement la logique de recherche/filtre de `Contacts.jsx` (`GET /contacts?q=&status=`). Le filtre `À relancer` reprend exactement `Relances.jsx` : il appelle `GET /suggestions` et affiche la même carte d'urgence (`suggestion-card--critique/attention/info`) avec le bouton "Relancé" qui appelle `POST /contacts/:id/follow-up/dismiss` — aucun changement de logique, seulement d'emplacement.

Conformément au spec (section "Ce qui reste hors périmètre"), la carte de suggestion reçoit aussi un bouton **"Relancer"** désactivé, stylé en `btn--primary` — coquille visuelle pour le chantier 3 (lien `wa.me` pré-rempli), non fonctionnelle ici par design, pas un oubli.

- [ ] **Step 1: Créer `frontend/src/pages/Conversations.jsx`**

```jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { IconSearch, IconCheck, IconAlert, IconClock } from "../components/icons.jsx";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours <= 0) return "à l'instant";
    return `${hours}h`;
  }
  if (days === 1) return "hier";
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

// "froid" gets no badge — only worth calling out when a lead is worth acting on.
const LEAD_SCORE_LABEL = { chaud: "Chaud", tiede: "Tiède" };

const URGENCY_ICON = { critique: IconAlert, attention: IconClock, info: IconClock };
const URGENCY_TEXT = { critique: "Risque de perte", attention: "À relancer", info: "À relancer bientôt" };

const TABS = [
  { key: "tous", label: "Tous" },
  { key: "a-relancer", label: "À relancer" },
  { key: "client", label: "Clients" },
  { key: "perdu", label: "Perdus" },
];

export default function Conversations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtre = searchParams.get("filtre") || "tous";

  const [contacts, setContacts] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLocked, setSuggestionsLocked] = useState(false);

  const setFiltre = (key) => setSearchParams(key === "tous" ? {} : { filtre: key });

  useEffect(() => {
    if (filtre === "a-relancer") return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filtre === "client" || filtre === "perdu") params.set("status", filtre);
      const qs = params.toString() ? `?${params.toString()}` : "";
      api.get(`/contacts${qs}`).then((d) => setContacts(d.contacts)).catch(() => setContacts([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, filtre]);

  const loadSuggestions = () =>
    api
      .get("/suggestions")
      .then((d) => setSuggestions(d.suggestions))
      .catch((err) => {
        if (err.message.includes("réservée")) setSuggestionsLocked(true);
        setSuggestions([]);
      });

  useEffect(() => {
    if (filtre === "a-relancer") loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre]);

  const dismiss = async (contactId) => {
    await api.post(`/contacts/${contactId}/follow-up/dismiss`, {});
    loadSuggestions();
  };

  const isEmpty = contacts && contacts.length === 0 && !query && filtre === "tous";

  return (
    <div className="stack">
      <h1 className="display-2">Conversations</h1>

      <div className="segmented" style={{ flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={filtre === t.key ? "is-active" : ""} onClick={() => setFiltre(t.key)}>
            {t.label}
            {t.key === "a-relancer" && suggestions?.length > 0 ? ` · ${suggestions.length}` : ""}
          </button>
        ))}
      </div>

      {filtre !== "a-relancer" && (
        <>
          <div className="search-bar">
            <IconSearch width={18} height={18} />
            <input placeholder="Chercher un nom, un numéro…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {!contacts && <ListSkeleton />}

          {isEmpty && (
            <div className="empty">
              <div className="h2">Pas encore de contact</div>
              <p>Connecte ton WhatsApp pour commencer à voir tes conversations ici.</p>
            </div>
          )}

          {contacts && contacts.length === 0 && (query || filtre !== "tous") && (
            <div className="empty">
              <div className="h2">Aucun résultat</div>
              <p>Essaie un autre nom, numéro ou filtre.</p>
            </div>
          )}

          {contacts && contacts.length > 0 && (
            <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
              {contacts.map((c) => (
                <li key={c._id}>
                  <Link to={`/conversations/${c._id}`} className="contact-row">
                    <div className="avatar">{initialsOf(c.displayName)}</div>
                    <div className="contact-row__body">
                      <div className="contact-row__top">
                        <span className="contact-row__name">{c.displayName}</span>
                        <span className="contact-row__time">{relativeTime(c.lastMessageAt)}</span>
                      </div>
                      <div className="contact-row__preview">
                        {c.lastMessageDirection === "outbound" ? "Toi : " : ""}
                        {c.lastMessagePreview || "—"}
                      </div>
                      {(c.tags?.length > 0 || c.status || LEAD_SCORE_LABEL[c.leadLabel]) && (
                        <div className="contact-row__tags">
                          {LEAD_SCORE_LABEL[c.leadLabel] && (
                            <span className={`pill${c.leadLabel === "chaud" ? " pill--accent" : ""}`} style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              {LEAD_SCORE_LABEL[c.leadLabel]}
                            </span>
                          )}
                          {c.status && c.status !== "nouveau" && (
                            <span className="pill" style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              {STATUS_LABEL[c.status] || c.status}
                            </span>
                          )}
                          {c.tags?.map((t) => (
                            <span key={t._id} className="tag-chip" style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              <span className="tag-swatch" style={{ background: t.color }} />
                              {t.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {filtre === "a-relancer" && suggestionsLocked && (
        <div className="empty">
          <div className="h2">Fonctionnalité Pro</div>
          <p style={{ marginBottom: 20 }}>Passe au plan Pro pour voir quels clients attendent une réponse.</p>
          <Link to="/reglages/abonnement" className="btn btn--primary">Voir les plans</Link>
        </div>
      )}

      {filtre === "a-relancer" && !suggestionsLocked && (
        <>
          {suggestions == null && <p className="text-muted" style={{ fontSize: 13 }}>Chargement…</p>}

          {suggestions?.length === 0 && (
            <div className="empty">
              <div className="h2">Tout est à jour</div>
              <p>Aucun client en attente de réponse pour l'instant.</p>
            </div>
          )}

          <div className="stack">
            {suggestions?.map(({ contact, daysSince, urgency, preview }) => {
              const Icon = URGENCY_ICON[urgency];
              return (
                <div key={contact._id} className={`suggestion-card suggestion-card--${urgency}`}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initialsOf(contact.displayName)}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{contact.displayName}</div>
                        <div className="row" style={{ gap: 4 }}>
                          <Icon width={13} height={13} />
                          <span style={{ fontSize: 11.5, fontWeight: 700 }}>
                            {URGENCY_TEXT[urgency]} · {daysSince} j
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {preview && (
                    <p style={{ fontSize: 13, background: "var(--paper-raised)", border: "1.5px solid var(--line-soft)", borderRadius: 10, padding: 10 }}>
                      « {preview} »
                    </p>
                  )}
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <Link to={`/conversations/${contact._id}`} className="btn btn--sm btn--ghost" style={{ flex: 1 }}>
                      Voir la conversation
                    </Link>
                    <button
                      className="btn btn--sm btn--primary"
                      type="button"
                      disabled
                      title="Message de relance pré-rempli — bientôt disponible"
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                    >
                      Relancer
                    </button>
                    <button className="btn btn--sm" onClick={() => dismiss(contact._id)}>
                      <IconCheck width={14} height={14} /> Relancé
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ListSkeleton() {
  const rows = useMemo(() => Array.from({ length: 6 }), []);
  return (
    <div className="stack--sm">
      {rows.map((_, i) => (
        <div key={i} className="row" style={{ padding: "10px 4px" }}>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 999 }} />
          <div className="stack--sm" style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "50%", height: 12 }} />
            <div className="skeleton" style={{ width: "80%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

Note sur le mapping filtre → statut : `client` et `perdu` passent directement `status` à `GET /contacts` (identique à l'ancien comportement de `Contacts.jsx`) ; `nouveau`/`en_negociation` ne sont pas des onglets dédiés dans la nouvelle maquette (seulement `Tous`/`À relancer`/`Clients`/`Perdus`, conforme au mockup validé en brainstorming) — ils restent consultables via `Tous` + la recherche, aucune régression fonctionnelle puisque `GET /contacts` sans `status` renvoie déjà tout.

- [ ] **Step 2: Supprimer les deux anciens fichiers et corriger `App.jsx`**

```bash
git rm frontend/src/pages/Contacts.jsx frontend/src/pages/Relances.jsx
```

Dans `frontend/src/App.jsx`, remplacer les imports :
```jsx
import Contacts from "./pages/Contacts.jsx";
```
```jsx
import Relances from "./pages/Relances.jsx";
```
par un seul import :
```jsx
import Conversations from "./pages/Conversations.jsx";
```

Remplacer les routes :
```jsx
        <Route path="/relances" element={<Relances />} />

        <Route path="/conversations" element={<Contacts />} />
```
par :
```jsx
        <Route path="/conversations" element={<Conversations />} />
```

- [ ] **Step 3: Mettre à jour le lien depuis Aperçu**

`frontend/src/pages/Apercu.jsx` — remplacer :
```jsx
        <Link to="/conversations?filtre=a-relancer" className="suggestion-card suggestion-card--attention" style={{ textDecoration: "none" }}>
```
Cette ligne était déjà écrite ainsi au Task 3 en anticipation — aucun changement de code nécessaire ici, seulement une vérification que le filtre est maintenant effectivement lu par `Conversations.jsx` (c'est le cas, via `useSearchParams`).

- [ ] **Step 4: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur.

Avec les serveurs de dev lancés et connecté avec le compte de test :
- Visiter `/conversations` : onglet `Tous` actif par défaut, liste des 15 contacts seedés visible, recherche fonctionnelle.
- Cliquer `À relancer` : doit afficher exactement les 7 suggestions déjà vérifiées en API (`daysSince`/`urgency` cohérents), cliquer "Relancé" doit faire disparaître la carte et décrémenter le compteur dans l'onglet. Vérifier que le bouton "Relancer" est bien visible mais désactivé (curseur "not-allowed", opacité réduite).
- Cliquer `Clients` : doit filtrer sur `status=client`. Cliquer `Perdus` : `status=perdu`.
- Depuis `/apercu`, cliquer la carte "X clients à relancer" : doit arriver sur `/conversations?filtre=a-relancer` avec l'onglet `À relancer` déjà actif.
- Cliquer un contact depuis n'importe quel onglet : doit ouvrir `/conversations/:id` sans 404.
- Re-tester à 360px/375px que le `.segmented` des 4 onglets ne déborde pas horizontalement (doit passer à la ligne grâce à `flexWrap: "wrap"` si nécessaire).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Conversations.jsx frontend/src/App.jsx frontend/src/pages/Apercu.jsx
git commit -m "feat: merge Contacts and Relances into a single Conversations page with segmented filters"
```

---

## Task 5: Grilles responsives — Catalogue et Vitrine publique

**Files:**
- Modify: `frontend/src/pages/Catalog.jsx` (deux grilles : formulaire photos, liste produits)
- Modify: `frontend/src/pages/Storefront.jsx` (grille produits)

**Interfaces:**
- Consumes: `.product-grid` (Task 1).
- Produces: aucune nouvelle interface — correctif purement visuel, aucun changement de comportement/API.

Ce Task corrige le problème identifié dans le spec : les grilles de cartes à `width: 220px` fixe débordent horizontalement sur les écrans de 360-390px. Remplacement par `.product-grid` (`grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))`).

- [ ] **Step 1: Corriger la grille de produits dans `frontend/src/pages/Catalog.jsx`**

Remplacer (ligne ~176) :
```jsx
      {products?.length > 0 && (
        <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
          {products.map((p) => (
            <div key={p._id} className="card card--tight" style={{ width: 220 }}>
```
par :
```jsx
      {products?.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p._id} className="card card--tight">
```

Et fermer la balise correspondante (ligne ~211, inchangée : `</div>` puis `)}`) — seule la balise ouvrante et la classe de la carte changent, la structure interne de chaque carte produit ne change pas.

- [ ] **Step 2: Corriger la grille de photos dans le formulaire, `frontend/src/pages/Catalog.jsx`**

Le bloc photos (ligne ~126) utilise déjà `flexWrap` sur des vignettes de taille fixe 64×64px — cette taille est correcte pour des miniatures (pas un problème de débordement, contrairement aux cartes produit de 220px). **Ne pas modifier ce bloc.**

- [ ] **Step 3: Corriger la grille de produits dans `frontend/src/pages/Storefront.jsx`**

Remplacer (ligne ~50) :
```jsx
        {store.products.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
            {store.products.map((p) => (
              <div key={p._id} className="card card--tight" style={{ width: 220 }}>
```
par :
```jsx
        {store.products.length > 0 && (
          <div className="product-grid">
            {store.products.map((p) => (
              <div key={p._id} className="card card--tight">
```

- [ ] **Step 4: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur.

Avec les serveurs de dev lancés :
- `/vendre/catalogue` (connecté avec le compte de test, qui a 8 produits seedés) à 360px de large : vérifier qu'aucune carte ne déborde horizontalement, qu'il n'y a pas de barre de défilement horizontale, et que les cartes s'organisent en 2 colonnes environ à cette largeur.
- Même vérification à 375px et desktop (doit afficher davantage de colonnes en largeur).
- `/v/boutique-demo-test` (page publique, sans connexion) : même vérification à 360px/375px/desktop.
- Vérifier que le formulaire d'ajout de produit (upload photo) fonctionne toujours à l'identique (aucune régression, ce bloc n'a pas été touché).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Catalog.jsx frontend/src/pages/Storefront.jsx
git commit -m "fix: replace fixed-width product card grids with responsive auto-fill grid"
```

---

## Task 6: Page d'accueil (Landing) — nouveau discours

**Files:**
- Modify: `frontend/src/pages/Landing.jsx` (réécriture complète du contenu)

**Interfaces:**
- Consumes: `GET /billing/plans` (existant, inchangé), `.landing-hero-mockup` (Task 1).
- Produces: aucune nouvelle interface — page terminale, rien n'en dépend.

Nouveau discours en 3 piliers équilibrés (zéro-effort / relance intelligente / vitrine et ventes), remplaçant les 4 features actuelles sans hiérarchie. Ajout d'un mockup visuel dans le hero (au lieu de texte seul).

- [ ] **Step 1: Réécrire `frontend/src/pages/Landing.jsx`**

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconContacts, IconBell, IconBox, IconCheck } from "../components/icons.jsx";
import Logomark from "../components/Logomark.jsx";

const PILLARS = [
  {
    icon: IconContacts,
    title: "Zéro effort",
    body: "Chaque conversation WhatsApp devient une fiche contact toute seule, sans rien remplir. Ton historique client existe déjà — Relance le récupère à la connexion.",
  },
  {
    icon: IconBell,
    title: "Relance intelligente",
    body: "Relance repère les clients qui attendent une réponse, les classe par urgence, et te dit qui recontacter en premier.",
  },
  {
    icon: IconBox,
    title: "Vitrine et ventes",
    body: "Partage ton catalogue en ligne et encaisse tes ventes avec un simple lien à coller dans la conversation — inclus dans ton abonnement.",
  },
];

const FEATURE_LABEL = {
  logging: "Historique des conversations",
  contacts: "Carnet de contacts",
  tags: "Tags manuels",
  suggestions: "Suggestions de relance",
  reminders: "Rappels",
  analytics: "Statistiques produits",
  multi_account: "Comptes WhatsApp multiples",
};

function formatFcfa(n) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

export default function Landing() {
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    api.get("/billing/plans").then((d) => setPlans(d.plans)).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={28} />
          <span className="h1">Relance</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/connexion" className="btn btn--ghost btn--sm">Se connecter</Link>
          <Link to="/inscription" className="btn btn--primary btn--sm">Créer un compte</Link>
        </div>
      </header>

      <section className="landing-hero">
        <span className="eyebrow">CRM WhatsApp pour commerçants</span>
        <h1 className="display-1">Ne perds plus un client dans tes conversations WhatsApp.</h1>
        <p className="text-muted" style={{ fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
          Ton historique se construit tout seul, Relance te dit qui recontacter, et ta vitrine vend pour toi —
          sans jamais envoyer un message à ta place.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 8 }}>
          <Link to="/inscription" className="btn btn--primary">7 jours d'essai gratuit</Link>
          <Link to="/connexion" className="btn btn--ghost">Se connecter</Link>
        </div>

        <div className="landing-hero-mockup">
          <div style={{ background: "var(--ink)", color: "var(--paper)", padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>
            Aujourd'hui
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--accent-tint)", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "var(--accent-ink)" }}>
              7 clients attendent une réponse →
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>128 400 F</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Ventes ce mois</div>
              </div>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>15</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Contacts actifs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card card--tight landing-feature">
            <Icon width={22} height={22} />
            <div className="h2" style={{ marginTop: 10 }}>{title}</div>
            <p className="text-muted" style={{ fontSize: 13.5, marginTop: 6 }}>{body}</p>
          </div>
        ))}
      </section>

      {plans && (
        <section className="landing-pricing">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span className="eyebrow">Tarifs</span>
            <h2 className="display-2" style={{ marginTop: 6 }}>Un plan pour chaque étape</h2>
          </div>
          <div className="plan-grid">
            {Object.values(plans).map((plan) => (
              <div key={plan.id} className={`plan-card${plan.id === "pro" ? " plan-card--featured" : ""}`}>
                {plan.id === "pro" && <span className="plan-card__badge">Le plus choisi</span>}
                <div className="h1">{plan.label}</div>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{plan.description}</p>
                <div className="plan-card__price">
                  {formatFcfa(plan.monthlyPrice)}<span> / mois</span>
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}><IconCheck width={15} height={15} /> {FEATURE_LABEL[f] || f}</li>
                  ))}
                </ul>
                <Link to="/inscription" className={`btn btn--block ${plan.id === "pro" ? "btn--primary" : ""}`}>
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <span className="text-muted" style={{ fontSize: 12 }}>Relance — fait pour les vendeurs WhatsApp de Côte d'Ivoire.</span>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Build et vérification manuelle**

```bash
cd frontend && npm run build
```
Attendu : build réussi, 0 erreur.

Sans être connecté (déconnecter le compte de test ou navigation privée) :
- Visiter `/` : vérifier le hero avec le mockup stylisé, les 3 piliers (Zéro effort / Relance intelligente / Vitrine et ventes), la grille tarifaire (3 plans).
- À 360px/375px : vérifier que le mockup du hero ne déborde pas (`max-width: 300px` combiné à `width: 100%` doit le contraindre), que les 3 cartes piliers s'empilent en 1 colonne, que la grille tarifaire s'empile en 1 colonne.
- Vérifier que les boutons "7 jours d'essai gratuit" / "Créer un compte" / "Se connecter" mènent bien à `/inscription`/`/connexion`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Landing.jsx
git commit -m "feat: rewrite landing page copy around three balanced pillars"
```

---

## Vérification finale (après le Task 6)

- [ ] Lancer `cd frontend && npm run build` une dernière fois sur l'état final du dépôt — 0 erreur.
- [ ] Parcourir l'intégralité du parcours connecté (Aperçu, Conversations avec ses 4 filtres, Vendre avec ses 2 sous-onglets, Réglages avec ses 2 sous-pages) à 360px, 375px et desktop, avec le compte de test.
- [ ] Parcourir l'intégralité du parcours public (`/`, `/connexion`, `/inscription`, `/v/boutique-demo-test`, une facture publique via `/f/:token`) aux mêmes trois largeurs.
- [ ] Confirmer qu'aucun fichier ne référence plus `/tableau-de-bord`, `/contacts`, `/catalogue` (à la racine), `/factures` (à la racine), `/analytiques`, `/connexion-whatsapp`, `/abonnement` (à la racine) — `grep -rn "tableau-de-bord\|to=\"/contacts\|to=\"/catalogue\"\|to=\"/factures\"\|to=\"/analytiques\|connexion-whatsapp\|to=\"/abonnement\"" frontend/src/` ne doit rien retourner.
- [ ] Confirmer que `frontend/src/styles/base.css` et `frontend/src/styles/pages.css` n'existent plus (`git status` propre, pas de fichier orphelin).
