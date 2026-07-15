# Refonte complète du design (chantier 1/6)

**Date**: 2026-07-15
**Statut**: Approuvé

## Contexte

Le MVP de Relance approche de sa sortie. L'utilisateur juge le design actuel (navy/crème/amber, serif éditorial, défini dans `frontend/src/styles/tokens.css`) "moche, mal pensé et ridicule", et l'expérience mobile "catastrophique" — alors que l'app est utilisée par des vendeurs qui l'ouvrent principalement depuis leur téléphone, en Côte d'Ivoire. Demande explicite : ne garder aucun bouton ni écran à l'identique.

Ce chantier est le premier d'une feuille de route en 6 étapes validée avec l'utilisateur (voir section finale). Il pose la fondation visuelle et la nouvelle structure de navigation sur laquelle les 5 chantiers suivants (statuts + IA, relance, catalogue/vitrine, factures, analytics) viendront se greffer. Comme le produit n'est pas encore public, tout est remplacé net — aucun souci de compatibilité ascendante sur les routes ou les composants.

Décisions produit actées avec l'utilisateur en brainstorming (avec companion visuel) :
- **Direction visuelle** : d'abord testée "WhatsApp-natif" (vert/bulles calqués sur WhatsApp), rejetée par l'utilisateur — trop proche du plagiat visuel. Retenue à la place : **"Corail & Encre"** — encre bleu-nuit + corail/terracotta (clin d'œil aux tissus wax ivoiriens), thème clair par défaut (lisibilité en extérieur/plein soleil, usage mobile dominant).
- **Navigation** : simplification de 8 sections à 4 (Aperçu, Conversations, Vendre, Réglages), fusions détaillées ci-dessous.
- **Landing page** : nouveau discours, structuré en 3 piliers équilibrés (relance intelligente / vitrine et ventes / zéro-effort automatique), pas d'argument dominant unique.
- **Logo** : l'utilisateur le refait lui-même — ce chantier laisse un emplacement flexible (`Logomark` reste un composant remplaçable), pas de nouveau logo dans ce design.

## Approche retenue

### `frontend/src/styles/tokens.css` — remplacement complet

```css
--ink:          #16181D;  /* texte, nav active, header */
--ink-soft:     #5B6068;  /* texte secondaire */
--paper:        #FAF8F4;  /* fond général, chaud */
--paper-raised: #FFFFFF;  /* cartes */
--paper-sunken: #F0EEE8;  /* stat tiles, skeletons */

--coral:      #C2452B;  /* accent principal — CTA, actif, urgence de relance */
--coral-tint: #FFE4D6;
--coral-ink:  #7A2C1B;

--jade:       #0B6E4F;  /* réservé aux statuts positifs (connecté, payé, client actif) */
--jade-tint:  #E4F2EC;
--jade-ink:   #0B6E4F;

--danger:      #B4402A;
--danger-tint: #F4DDD5;

--radius-lg: 14px;  /* était 10px — rendu plus doux/app, moins "carte papier" */
```
- **Corail** = couleur de marque et d'action, remplace l'amber comme accent dominant.
- **Jade** = signal de statut uniquement (jamais utilisé comme couleur de marque générale) — pour ne jamais retomber sur une association "vert = WhatsApp".
- Polices inchangées (Fraunces / IBM Plex Sans / IBM Plex Mono) — le problème identifié était la palette et la mise en page, pas la typographie.
- Le variant `prefers-color-scheme: dark` existant est réécrit avec les mêmes rôles de tokens, valeurs adaptées (pas de mode sombre "par défaut" — seulement en respect de l'OS, comme aujourd'hui).

### `frontend/src/styles/base.css` + `frontend/src/styles/pages.css` — remplacés par un seul `frontend/src/styles/components.css`

Fusion des deux fichiers existants en un seul, réorganisé par composant plutôt que par page (plus facile à maintenir à mesure que les pages se recomposent). Composants reconstruits :
- Boutons, champs de formulaire, cartes, avatar, pills/badges — mêmes rôles fonctionnels, nouveau rendu (coins plus doux, cibles tactiles 48px minimum au lieu de 44px).
- Bulles de conversation (`.bubble`) — conservées comme concept (nécessaire pour Conversations) mais recolorées avec les nouveaux tokens, pas de vert.
- **Nouveau composant** : segmented control (`.segmented`) pour les filtres de la page Conversations (`Tous` / `À relancer · N` / `Clients` / `Perdus`).
- Nav basse mobile (4 icônes au lieu de la logique actuelle bottom-nav/tab-bar séparée) + tab-bar desktop équivalente à 4 entrées.
- **Correctif systématique responsive** : toute grille à largeur de carte fixe (`width: 220px`, présent aujourd'hui dans Catalogue et Storefront) devient `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` — c'était la cause principale de débordement horizontal sur mobile (~360-390px, tailles Android d'entrée de gamme courantes en Côte d'Ivoire).

### `frontend/src/App.jsx` — routes renommées, pages fusionnées

| Route actuelle | Nouvelle route | Sort |
|---|---|---|
| `/tableau-de-bord` | `/apercu` | fusionne avec `/analytiques` |
| `/contacts`, `/contacts/:id` | `/conversations`, `/conversations/:id` | fusionne avec `/relances` |
| `/relances` | *(supprimée, devient un filtre dans Conversations)* | — |
| `/contacts/tags` | `/conversations/tags` | inchangée fonctionnellement, accessible via un lien secondaire depuis Conversations (pas dans la nav principale) |
| `/catalogue` | `/vendre/catalogue` | sous-route de Vendre |
| `/factures` | `/vendre/factures` | sous-route de Vendre |
| `/analytiques` | *(supprimée, section dans Aperçu)* | — |
| `/connexion-whatsapp` | `/reglages` (item de menu) | fusionne avec Abonnement |
| `/abonnement` | `/reglages` (item de menu) | fusionne avec WhatsApp |

Pages publiques inchangées de route (`/`, `/connexion`, `/inscription`, `/v/:storeSlug`, `/f/:publicToken`) — reçoivent le nouveau système de tokens mais pas la nav à 4 onglets (qui est réservée à l'espace connecté).

**Détail des fusions :**
- **Aperçu** (`Dashboard.jsx` + `Analytics.jsx` → nouveau composant unique) : bandeau d'alerte relances urgentes → stat tiles (ventes, contacts actifs, factures en attente) → activité 7 jours → section analytics condensée. Pas d'onglets internes : une seule page qui scrolle, sections empilées.
- **Conversations** (`Contacts.jsx` + `Relances.jsx` fusionnés, `ContactDetail.jsx` conservé) : liste unique de contacts avec un segmented control en tête qui filtre la même liste (`Tous`/`À relancer`/`Clients`/`Perdus`) — remplace la navigation séparée vers Relances. Le tri par défaut sous le filtre "À relancer" reprend exactement la logique existante de `suggestionEngine.js` (urgence/ancienneté), aucun changement côté backend.
- **Vendre** (`Catalog.jsx` + `Invoices.jsx`, nouvelle page parente avec sous-onglets) : deux flux distincts (upload photo produit vs lignes de facture) gardent chacun leur écran, reliés par une nav secondaire en haut de la section — pas de fusion des formulaires eux-mêmes.
- **Réglages** (`Connect.jsx` + `Billing.jsx`, nouvelle page parente type "menu profil") : liste d'entrées (Connexion WhatsApp, Abonnement, Lien de ma vitrine, Déconnexion) menant chacune à l'écran existant correspondant — pas de fusion des formulaires, juste un point d'entrée commun puisque ces deux réglages sont consultés rarement.

### `frontend/src/pages/Landing.jsx` — nouveau contenu

Nouvelle structure en 3 piliers équilibrés (au lieu des 4 features actuelles sans hiérarchie claire) :
1. **Zéro-effort** — l'historique se construit tout seul depuis WhatsApp.
2. **Relance intelligente** — Relance sait qui recontacter et quand (prépare le terrain pour le chantier 2, sans mentionner l'IA de façon trop technique dans le pitch grand public).
3. **Vitrine et ventes** — catalogue + factures partageables par lien.

Hero avec un vrai mockup produit (capture stylisée du nouvel Aperçu) plutôt que du texte seul — actuellement la landing n'a aucune image de produit, seulement des icônes et du texte.

### Composants transverses

- `Logomark.jsx` : conservé tel quel (l'utilisateur remplacera lui-même l'asset) — aucune modification de son API (`size` prop) pour ne pas bloquer un remplacement futur.
- `icons.jsx` : les icônes existantes (`IconContacts`, `IconBell`, etc.) sont réutilisées où le sens correspond encore ; nouvelles icônes ajoutées uniquement pour le segmented control et les entrées du menu Réglages.

## Ce qui ne change pas

- Aucune route/logique backend touchée — ce chantier est strictement frontend (CSS + structure de pages/routes React).
- `AuthContext.jsx`, `api/client.js` inchangés.
- Toute la logique métier (suggestionEngine, analyticsEngine, billing, whatsapp manager) reste identique — seule sa présentation change.

## Limites assumées

- Pas de nouveau logo dans ce chantier (l'utilisateur le fournira séparément) — `Logomark` doit rester facilement substituable.
- Les graphiques d'Aperçu restent volontairement simples (stat tiles + un histogramme basique) — la richesse visuelle avancée (histogrammes détaillés, historiques, rendu 3D) est explicitement le chantier 6, pas celui-ci.
- Les éléments d'interface préparant les chantiers 2 à 5 (badge de statut IA, bouton de relance wa.me, toggle de visibilité vitrine, reçu image + lien de paiement) reçoivent un traitement visuel cohérent avec le nouveau design mais restent des coquilles non fonctionnelles jusqu'à leurs chantiers respectifs.
- Pas de suite de tests frontend automatisée dans ce repo (existant, non modifié par ce chantier) — vérification par test manuel en navigateur.

## Vérification

- `npm run build` (frontend) sans erreur après chaque page reconstruite.
- Test manuel dans le navigateur à 3 largeurs : 360px et 375px (tailles Android/iPhone les plus courantes visées), puis desktop (≥900px) — pour chacune des pages listées ci-dessus, en utilisant le compte de test déjà seedé (`test@relance.ci` / `password123`, plan Business actif, données factices en place).
- Vérifier qu'aucune grille de carte ne déborde horizontalement à 360px (Catalogue, Storefront, Vendre).
- Vérifier que la navigation à 4 onglets fonctionne à la fois en bottom-nav mobile et tab-bar desktop, et que le filtre segmenté de Conversations reproduit exactement le comportement actuel de `/relances` (mêmes contacts, même tri par urgence).
- Vérifier que les routes publiques (Landing, Storefront, Facture publique, Login/Register) rendent correctement avec les nouveaux tokens sans dépendre de la nav à 4 onglets.

## Feuille de route (hors scope de ce document)

Chantiers suivants identifiés avec l'utilisateur, dans l'ordre recommandé (chacun avec son propre design à venir) :
1. Refonte du design (ce document)
2. Statuts de contact modifiables depuis la conversation + classification automatique par IA (Grok ou modèle open-source ~120B, clé fournie par l'utilisateur)
3. Système de relance : messages pré-écrits + bouton ouvrant un lien `wa.me` pré-rempli (l'utilisateur envoie lui-même, jamais d'envoi automatique)
4. Catalogue refondu en vitrine publique éditable, gratuite avec l'abonnement (existe déjà partiellement : `Catalog.jsx` + `Storefront.jsx` + `public.js` — ce chantier ajoute probablement un contrôle de visibilité explicite par produit et le polish du chantier 1)
5. Factures : génération d'un reçu image en plus du PDF, avec lien de paiement (existe déjà partiellement : flux `draft/sent/paid` + `GeniusPay` + page publique — ce chantier ajoute l'image et le lien de paiement)
6. Analytics avancés : graphiques riches, historiques, histogrammes, rendu 3D — à cadrer précisément (la 3D est un point de vigilance UX à rediscuter avec des alternatives lisibles)
