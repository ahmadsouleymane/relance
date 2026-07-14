# Relance — WhatsApp CRM pour vendeurs CI

Historise les conversations WhatsApp d'un vendeur, centralise ses contacts, et lui
signale qui relancer avant de perdre la vente. Pas d'envoi automatique : le vendeur
écrit et envoie toujours lui-même, depuis son téléphone.

## Pourquoi c'est construit comme ça (à ne pas casser)

- **Baileys en lecture seule.** `backend/src/whatsapp/manager.js` n'appelle jamais
  `sock.sendMessage()`. C'est délibéré : l'envoi automatisé/en masse via une librairie
  non-officielle comme Baileys est ce qui déclenche les bannissements WhatsApp
  (souvent permanents, sans recours). Le produit ne fait que suggérer une relance —
  jamais l'envoyer. Si un jour un vrai bulk sending est nécessaire, ça doit passer par
  l'API officielle Meta Cloud, pas par cette connexion.
- **GeniusPay, pas de prélèvement récurrent natif.** Les abonnements sont vendus en
  cycles prépayés (mensuel / trimestriel -10% / annuel -20%) plutôt qu'en débit
  automatique, parce que GeniusPay ne propose pas de recurring billing. Voir
  `backend/src/config/plans.js`.

## Structure

```
backend/     API Node.js + Express + MongoDB + Baileys
frontend/    App React (Vite), mobile-first
```

## Démarrage local

Prérequis : Node 20+, une instance MongoDB (locale ou Atlas).

### Backend

```bash
cd backend
cp .env.example .env   # renseigner MONGODB_URI, JWT_SECRET, clés GENIUSPAY_*
npm install
npm run dev             # http://localhost:4000
```

Clés GeniusPay (sandbox) : créer un compte sur https://pay.genius.ci puis récupérer
`pk_sandbox_...` / `sk_sandbox_...` dans le dashboard marchand.

Pour enregistrer l'URL de webhook auprès de GeniusPay (une fois, par environnement) :

```bash
node scripts/registerWebhook.js
```

Nécessite `APP_BASE_URL` accessible publiquement (utiliser un tunnel type ngrok en local).

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, proxy /api -> localhost:4000
```

## Plans & tarifs (FCFA / mois, avant remise de cycle)

| Plan | Prix | Fonctionnalités |
|---|---|---|
| Starter | 5 000 F | Historique, contacts, tags |
| Pro | 15 000 F | + suggestions de relance, rappels |
| Business | 45 000 F | + statistiques, comptes WhatsApp multiples |

Remises : -10% en trimestriel, -20% en annuel. Source unique de vérité :
`backend/src/config/plans.js`.

## Déploiement

- **Backend** : Render (Web Service) ou VPS (Hetzner/Contabo). Le dossier
  `backend/data/wa-sessions` doit être sur un disque persistant — sans ça, chaque
  redéploiement force un nouveau scan QR pour tous les vendeurs connectés.
- **Frontend** : `npm run build` puis servir `frontend/dist` (Render Static Site,
  Netlify, ou nginx sur le même VPS).
- Mettre à jour `CORS_ORIGIN` (backend) et l'URL de l'API consommée par le frontend
  (`vite.config.js` proxy en dev ; en prod, servir l'API sous le même domaine ou
  configurer une base URL absolue dans `frontend/src/api/client.js`).
- Ré-enregistrer le webhook GeniusPay avec l'URL de prod une fois déployé.

## Reconnexion WhatsApp (support)

`frontend/src/pages/Connect.jsx` affiche le statut (connecté / en attente de scan /
déconnecté) et un nouveau QR en cas de coupure. La session se relance automatiquement
une fois côté serveur (`whatsapp/manager.js`) sauf déconnexion explicite ("logged out"
depuis le téléphone), auquel cas un nouveau scan est requis.
