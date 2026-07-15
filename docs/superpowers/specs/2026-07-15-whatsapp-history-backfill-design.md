# Backfill de l'historique WhatsApp à la connexion

**Date**: 2026-07-15
**Statut**: Approuvé

## Contexte

Relance est un CRM WhatsApp passif (lecture seule via Baileys) pour petits commerces en Côte d'Ivoire, encore en construction avant lancement. Un audit produit a identifié que `backend/src/whatsapp/manager.js` tourne avec `syncFullHistory: false` et n'écoute **aucun** événement d'historique (`messaging-history.set`) — résultat : quand un vendeur connecte son WhatsApp, le CRM démarre totalement vide, même s'il a des années de conversations avec ses clients réguliers. Pour un outil dont la promesse est de connaître déjà les clients du vendeur, c'est le gap le plus fondamental identifié en brainstorming : sans backfill, les suggestions de relance, le scoring de leads et les analytics n'ont rien à exploiter au jour 1.

Ce chantier est le premier d'une feuille de route en plusieurs étapes (validée avec l'utilisateur) : backfill historique → brouillons de relance copier-coller → fidélité par récurrence d'achat → transcription vocale → extraction de commande → positionnement. Chaque étape aura son propre design/plan/implémentation. Ce document ne couvre que le backfill.

Décisions produit actées avec l'utilisateur pendant le brainstorming :
- Viser l'**historique complet** (`syncFullHistory: true`), pas seulement le récent — accepté malgré le risque de première connexion plus longue sur réseau instable.
- Afficher un **statut visible** ("import en cours") plutôt que de remplir silencieusement en arrière-plan.

## Approche retenue

### `backend/src/whatsapp/manager.js`
- Passer `syncFullHistory: true`.
- Ajouter un state par session : `historySync: { status: "syncing"|"complete", count: 0 }`, initialisé à `syncing`/0 dès l'ouverture de connexion (`connection === "open"`).
- Écouter `sock.ev.on("messaging-history.set", ({ messages, isLatest }) => ...)` : filtrer groupes/broadcast, appeler `logHistoryMessages(userId, messages)`, incrémenter `count`, persister sur `User.whatsapp` (throttlé par event, pas par message).
- Quand `isLatest === true` → statut `complete`.
- Filet de sécurité : timeout de 2 min après l'ouverture de connexion — si `isLatest` n'arrive jamais, forcer `complete` pour ne pas bloquer la bannière indéfiniment.
- Réinitialiser `historySync` à `idle`/0 sur chaque nouveau `start()` et sur logout (`stop()` / branche `loggedOut`).

### `backend/src/services/messageIngest.js`

**Correction de correctness bundlée** (même racine que le besoin bulk) : `upsertContact` (ligne 44) met actuellement à jour `lastMessageAt`/`messageCount` **avant** de savoir si `storeMessage` va réellement insérer — un message redélivré par Baileys (cas déjà documenté dans le code) gonfle donc `messageCount` même quand il est jeté comme doublon. Ça compte double pour le backfill puisque les paquets n'arrivent pas forcément en ordre chronologique. Découplage :
- `ensureContact` : seulement `$setOnInsert`, retourne l'`_id` du contact.
- `storeMessage` : retourne `true`/`false` selon insertion réelle (déjà try/catch sur E11000).
- Les champs roulants (`lastMessageAt`, `lastMessageDirection`, `lastMessagePreview`, `lastFollowUpAt`, `$inc messageCount`) ne sont appliqués que si l'insertion a réussi, via une update conditionnelle (pipeline `$set` comparant les timestamps) pour ne jamais écraser un état plus récent avec un message plus ancien arrivé en retard.

**Nouvelle fonction bulk** `logHistoryMessages(ownerId, waMessages)` :
- Filtre groupes/broadcast via un helper partagé `isTrackableChat(waId)` (factorisation des deux checks dupliqués existants aux lignes 82 et 111).
- Regroupe par contact ; insère via `Message.insertMany(docs, { ordered: false })`, catch des erreurs E11000, garde la liste des insertions réussies.
- `Contact.bulkWrite` avec la même update conditionnelle par timestamp que ci-dessus, par contact touché.
- Réutilise les helpers purs déjà existants : `extractContent`, `previewOf`, `hasIntentSignal` — pas de nouvelle logique d'extraction.

### `backend/src/models/User.js`
Ajouter à `whatsapp` : `historySyncStatus` (enum `idle`/`syncing`/`complete`, défaut `idle`) et `historySyncedCount` (Number, défaut 0).

### `backend/src/routes/whatsapp.js`
`GET /status` : ajouter `historySyncStatus` et `historySyncedCount` à la réponse existante.

### `frontend/src/pages/Connect.jsx`
Le `poll()` existant (déjà à 3s, ligne 16) lit les deux nouveaux champs. Quand `status === "connected"` et `historySyncStatus === "syncing"` : bannière "Import de l'historique en cours… (X messages importés)" avec spinner, sous la bannière de statut existante. Disparaît sur `complete`.

### Ce qui ne change pas
Suggestions de relance (`suggestionEngine.js`), lead scoring, analytics : aucune modification — ils lisent déjà `Contact`/`Message`, donc les données importées y apparaissent automatiquement dès le prochain calcul/affichage.

### Limites assumées
- Groupes/status toujours exclus du backfill, cohérent avec le live.
- Pas de barre de progression avec total exact (WhatsApp ne communique pas de total à l'avance) — juste un compteur croissant.
- Historique complet peut prendre du temps sur connexion instable — compromis accepté explicitement.

## Vérification

- `npm run dev:memory` côté backend, connecter un compte WhatsApp de test avec un historique de conversations existant, scanner le QR, observer dans les logs/DB que `messaging-history.set` déclenche bien `logHistoryMessages` et que des `Contact`/`Message` apparaissent progressivement.
- Vérifier en base (Mongo) qu'aucun doublon de `waMessageId` n'est créé et que `messageCount` par contact correspond exactement au nombre de messages stockés pour ce contact.
- Simuler une redélivrance (redémarrer la connexion en cours de sync) et vérifier que `messageCount`/`lastMessageAt` restent corrects (pas de double comptage, pas de régression vers un état plus ancien).
- Frontend : sur `/whatsapp` (Connect.jsx), vérifier que la bannière "Import en cours" apparaît après connexion et disparaît une fois `historySyncStatus === "complete"`.
- Vérifier que les suggestions de relance et le tableau de bord analytics reflètent bien les contacts/messages importés sans aucune modification de leur code.
- Tester le cas d'un numéro neuf sans historique : la bannière doit passer à `complete` rapidement (via `isLatest` ou le timeout de secours) sans rester bloquée sur "syncing".

## Feuille de route (hors scope de ce document)

Chantiers suivants identifiés en brainstorming, par ordre de priorité recommandé, chacun avec son propre design à venir :
1. Backfill de l'historique (ce document)
2. Brouillons de relance copier-coller — messages de relance suggérés que le vendeur copie-colle lui-même dans WhatsApp, préservant la philosophie "lecture seule / jamais d'envoi automatique"
3. Rappel de fidélité par récurrence d'achat — détecter les clients réguliers qui n'ont pas acheté depuis leur cycle habituel
4. Transcription des notes vocales — les messages audio sont aujourd'hui stockés sans contenu exploitable (`[audio]`)
5. Extraction de commande depuis la conversation — pré-remplir une facture à partir du texte du chat
6. Positionnement / messaging — capitaliser sur l'argument de confiance "lecture seule" face aux outils d'envoi en masse qui font bannir les numéros
