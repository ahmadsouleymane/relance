# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Relance" — a WhatsApp CRM for vendors in Côte d'Ivoire. It connects to a vendor's own WhatsApp account (via Baileys, unofficial multi-device protocol), passively logs their conversations, and surfaces contacts/follow-up suggestions in a dashboard. Billing is handled through GeniusPay (Ivorian payment gateway: Wave, Orange Money, MTN MoMo, etc).

Monorepo with two independent Node projects, no shared root package.json:
- `backend/` — Express + Mongoose API (ESM, `"type": "module"`)
- `frontend/` — React 18 + Vite + react-router-dom

## Commands

Run these from within `backend/` or `frontend/` respectively — there is no root-level script runner.

**Backend**
- `npm run dev` — start API with `node --watch` (requires a real MongoDB at `MONGODB_URI`)
- `npm run dev:memory` — start API against an ephemeral in-memory MongoDB (`mongodb-memory-server`), no real DB needed. Data is wiped on exit; local UI preview only, never for anything you need to persist.
- `npm start` — production start
- `node scripts/registerWebhook.js` — one-off: registers this API's `/api/billing/webhook/geniuspay` URL with GeniusPay. Run once per environment (sandbox vs live use different API keys).
- No test suite or lint config currently exists in this repo.

**Frontend**
- `npm run dev` — Vite dev server on port 5173, proxies `/api/*` to `http://localhost:4000` (override via `VITE_API_PROXY`)
- `npm run build` / `npm run preview`

**Env config**: copy `backend/.env.example` to `backend/.env`. Key vars: `MONGODB_URI`, `JWT_SECRET`, `GENIUSPAY_*`, `APP_BASE_URL`/`FRONTEND_BASE_URL` (used to build GeniusPay webhook/redirect URLs).

## Architecture

### WhatsApp integration is read-only by design

`backend/src/whatsapp/manager.js` (`WhatsAppManager`, exported as singleton `whatsAppManager`) wraps one Baileys socket per user, keyed by `userId`, with auth state persisted to `backend/data/wa-sessions/<userId>/`.

**This connection never calls `sock.sendMessage()` anywhere in the codebase, intentionally.** Baileys is an unofficial protocol client — using it to send bulk/automated messages is what gets WhatsApp numbers banned (often permanently). The app only *listens* to the vendor's own conversations to build history/contacts/suggestions; the vendor still sends every reply by hand from their own phone. Do not add a send path without deliberately revisiting that tradeoff — see the comment at the top of `manager.js`.

Connection lifecycle: `connection.update` events drive `User.whatsapp.status` (`disconnected`/`connecting`/`connected`) and a QR string held in-memory (fetched via `GET /api/whatsapp/qr`, rendered as data URL). On unexpected disconnect it auto-reconnects once after 3s unless Baileys reports `loggedOut`, in which case the session dir is wiped and the user must re-scan.

Every inbound/outbound message event flows through `backend/src/services/messageIngest.js`, which:
1. Extracts a normalized `{type, text}` from Baileys' raw message shape (`extractContent`)
2. Upserts a `Contact` (keyed by `owner` + `waId`) with rolling `lastMessageAt`/`lastMessageDirection`/`lastMessagePreview`/`messageCount`
3. Inserts a `Message` doc, deduped on `(owner, waMessageId)` — duplicate-key errors are swallowed since Baileys can redeliver on reconnect
4. On an outbound message, stamps `contact.lastFollowUpAt` — this is what marks a pending follow-up suggestion as resolved (a manual reply counts as handling it)

Groups (`@g.us`) and status broadcasts are skipped entirely (MVP scope).

### Follow-up suggestions

`backend/src/services/suggestionEngine.js` (`getFollowUpSuggestions`) finds contacts whose last message was inbound (i.e. the vendor owes a reply) and where `lastFollowUpAt` hasn't caught up to `lastMessageAt`. Silence duration buckets into urgency bands (`URGENCY_BANDS`: info at 1+ day, attention at 3+, critique at 7+). This is purely a UI surfacing mechanism — it never sends anything itself.

### Plans, features, and billing

`backend/src/config/plans.js` is the single source of truth for the three tiers (`starter`/`pro`/`business`), their feature flags, and pricing (FCFA/XOF, no decimals). `priceForCycle` applies prepay discounts for quarterly/yearly cycles — **there is no native recurring debit via GeniusPay**, so subscriptions are prepaid blocks of time, not auto-renewing.

Feature gating happens via `requireFeature(feature)` middleware (`backend/src/middleware/auth.js`), which checks `PLANS[user.plan.id].features` — e.g. `/api/suggestions` requires the `"suggestions"` feature, so it 403s for `starter`. `User.hasActiveAccess()` checks trial/active status against `trialEndsAt`/`currentPeriodEnd`.

Billing flow (`backend/src/routes/billing.js` + `backend/src/services/geniusPay.js`):
1. `POST /api/billing/checkout` creates a `Payment` doc (status `pending`) and a GeniusPay checkout link
2. Confirmation arrives via **either** path, both converging on `activateSubscription()`:
   - `GET /api/billing/checkout/:reference` — vendor-facing poll used right after checkout so the UI doesn't have to wait on the webhook
   - `POST /api/billing/webhook/geniuspay` — GeniusPay's async webhook
3. `activateSubscription` extends `user.plan.currentPeriodEnd` from whichever is later (existing period end, or now) by `cycle.months * 30 days`, so early renewals stack rather than overwrite

**Webhook body handling is order-sensitive**: in `backend/src/index.js`, `webhookRouter` (raw body, for HMAC verification) is mounted on `/api/billing/webhook` *before* the global `express.json()` middleware. If you reorder this, GeniusPay signature verification breaks because the body would already be parsed/re-serialized JSON instead of the exact signed bytes. Signature check: `HMAC-SHA256(timestamp + "." + rawBody, GENIUSPAY_WEBHOOK_SECRET)`, timing-safe compared in `verifyWebhookSignature`.

### Auth

Standard JWT-in-header (`Authorization: Bearer <token>`), signed/verified in `backend/src/middleware/auth.js` (`signToken`/`requireAuth`). No refresh tokens — long-lived JWT (`JWT_EXPIRES_IN`, default 30d). `req.user` is a full Mongoose `User` doc set by `requireAuth`, available to every downstream route handler.

### Frontend

- `frontend/src/api/client.js` — thin fetch wrapper (`api.get/post/patch/delete`), reads/writes JWT from `localStorage` (`relance_token`), throws on non-OK responses using `{error}` from the JSON body
- `frontend/src/context/AuthContext.jsx` — holds the current user/loading state
- `frontend/src/App.jsx` — route table; `PrivateArea` gates authenticated routes behind `AppShell`, `PublicOnly` redirects logged-in users away from `/connexion` and `/inscription`
- UI copy is in French (routes like `/connexion`, `/inscription`, `/abonnement`, `/relances`; error messages like `"Authentification requise"`) — match this when adding user-facing strings
- Vite dev server proxies `/api` to the backend, so frontend code calls relative paths like `/contacts`, not absolute URLs

## Conventions worth preserving

- Ownership scoping: virtually every query filters by `owner: req.user._id` — this is a single-tenant-per-vendor multi-tenant app, don't add a query that skips this scope.
- Mongoose model files live flat in `backend/src/models/`, one per collection, no repository/DAO layer — routes and services import models directly.
- Comments in this codebase are used specifically to flag non-obvious constraints (e.g. the read-only WhatsApp rule, the webhook raw-body ordering, the dedupe-on-redelivery behavior) — follow that pattern rather than narrating what code does.
