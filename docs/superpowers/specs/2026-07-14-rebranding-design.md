# Rebranding & refonte du design system — Relance

## Contexte

Après l'ajout de nouvelles fonctionnalités (vitrine commerciale, factures, intelligence relationnelle — voir commit précédent), le fondateur reste insatisfait du produit sur l'axe design. Diagnostic après clarification : le problème n'est pas un détail isolé mais une impression généralisée que le produit "fait trop IA" — visuellement (cards arrondies partout, dégradés/blobs décoratifs, palette orange saturée "startup safe", icônes minimalistes génériques), dans le ton du texte (copy lisse et "gentille" façon chatbot, emojis), et dans la structure des pages (sidebar + topbar + grille de stat-cards, un layout SaaS très répandu et peu différenciant).

Ce document couvre une refonte complète de l'identité : palette, typographie, langage de forme, ton de voix, et structure de navigation. Le nom "Relance" est gardé comme nom de travail pour ce document — le fondateur n'a validé aucune alternative proposée mais reste ouvert à en changer plus tard ; le naming est explicitement hors scope de cette passe (voir "Hors scope").

## Personnalité de marque

Fondation sérieuse/rassurante (l'app gère les clients et, bientôt, l'argent d'un commerçant — elle doit inspirer une confiance quasi "bancaire") avec des touches d'énergie commerçante par-dessus, jamais l'inverse. Concrètement : la structure, la palette et la typographie portent le sérieux ; l'accent chaud et le ton direct portent l'énergie.

## Identité visuelle

### Palette

On abandonne complètement l'orange saturé actuel (perçu comme "couleur par défaut de générateur IA") pour une base bleu nuit + un accent or/ambre mat unique.

- `--paper` (fond) : `#F8F6F1` — crème chaud neutre, proche de l'existant mais moins "papier vintage"
- `--ink` (texte/structure) : `#10182B` — bleu nuit très foncé, pas noir pur ; c'est la couleur qui porte le "sérieux/bancaire"
- `--accent` : `#C99A3B` — or/ambre mat, jamais saturé/néon ; réservé aux CTA et moments qui comptent vraiment (pas décoratif)
- `--live` (statut connecté/succès) : `#2F7A5C` — émeraude sourd, garde le principe existant : cette couleur ne sert *jamais* qu'à signaler un état, jamais la décoration
- `--danger` : `#B4402A` — rouge brique sourd, cohérent avec la désaturation générale de la palette

### Typographie

Sora, Manrope et JetBrains Mono sont devenues des choix par défaut très reconnaissables des outils/templates générés rapidement. Remplacées par :

- **Fraunces** (serif display) — titres et moments d'identité. Apporte du caractère et une touche premium/éditoriale qu'un sans-serif géométrique ne peut pas donner.
- **IBM Plex Sans** (corps de texte) — lisible, avec un ton "outil professionnel" plutôt que "startup generic sans".
- **IBM Plex Mono** (chiffres, données, timestamps) — cohérent avec Plex Sans, remplace JetBrains Mono.

### Langage de forme

- Coins nettement moins arrondis : 4–10px selon le composant (au lieu de 14–20px actuellement).
- Suppression des ombres "sticker" (décalage épais façon autocollant) sur l'ensemble des composants. À la place : bordures fines nettes (1px, encre à faible opacité) pour la hiérarchie, et des ombres très subtiles réservées aux éléments réellement flottants (modales, menus) — pas aux cards de contenu normal.

## Ton & voix

Le tutoiement est conservé (proximité avec le commerçant, cohérent avec le marché local) mais l'exécution change : phrases courtes et affirmatives, zéro emoji, formulations directes plutôt que "gentilles/chatbot".

Exemple concret (Dashboard) :
- Avant : *"Bonjour Awa 👋"* / *"Connecte ton WhatsApp — Scanne un QR code pour commencer à historiser tes conversations."*
- Après : *"Awa"* (en eyebrow, sans salutation) + *"WhatsApp déconnecté"* / *"Scanne le QR pour démarrer."*

Ce principe (raccourcir, couper les formules de politesse creuses, couper les emojis, aller droit à l'état/l'action) s'applique à toutes les pages, pas seulement au dashboard.

## Structure & navigation

Le constat de départ : la coquille actuelle (sidebar desktop + bottom-nav mobile, topbar générique) est un patron "SaaS admin panel" très répandu, peu différenciant, et ne reflète pas l'usage réel — les vendeurs consultent l'app depuis leur téléphone, entre deux clients, pas depuis un poste de travail façon back-office.

**Nouvelle coquille : identité "app à onglets" mobile-native, adaptée en desktop plutôt que remplacée.**

- **Mobile** : navigation par onglets en bas d'écran, comme aujourd'hui — c'est le format natif, pas besoin de le réinventer, juste de le retravailler avec la nouvelle identité visuelle.
- **Desktop / écran large** : pas de sidebar verticale. Les mêmes onglets remontent en barre horizontale fine sous l'en-tête. Le contenu utilise réellement la largeur disponible :
  - Catalogue, Contacts : grilles multi-colonnes plutôt qu'une colonne unique étirée
  - Contacts → détail contact : panneaux côte à côte (liste à gauche, détail à droite) plutôt qu'une navigation en profondeur qui recharge toute la page
  - Le composant `AppShell.jsx` doit gérer ce basculement au breakpoint desktop plutôt que d'avoir deux navigations totalement séparées comme c'est le cas aujourd'hui (`app-sidebar` vs `bottom-nav`)

### Dashboard : passage du "stat-grid générique" à un format "briefing"

Le dashboard actuel (bannière décorative avec blob + grille de 4 stat-cards) est le point le plus "générique SaaS" du produit. Nouvelle approche : un format "briefing du jour" où le contenu à forte valeur (leads chauds, résumé hebdomadaire déjà construit via `weeklyDigest.js`) devient le contenu principal en haut de page, et les compteurs bruts (nombre de contacts, messages/7j) passent en ligne compacte secondaire plutôt qu'en grosses cards décoratives.

Cette même logique de densité et de hiérarchie (le contenu à valeur en premier, les métriques brutes en support discret) s'applique aux pages de liste (Contacts, Catalogue, Factures) : moins d'espace décoratif, plus d'information utile visible sans scroll.

## Hors scope

- **Naming** : aucune alternative à "Relance" n'a été retenue pendant ce brainstorm. Le nom actuel est gardé comme nom de travail ; à revisiter séparément si une meilleure piste émerge — ne bloque pas cette refonte.
- **Rattachement des nouvelles fonctionnalités (vitrine, factures, scoring) aux tiers de prix** : décision produit indépendante, déjà notée comme en attente dans le travail précédent.
- **Paiement par vente (GeniusPay)** : toujours bloqué en attendant la validation externe du modèle sous-marchand/split, sans lien avec ce rebranding.
- **Logo (`Logomark.jsx`)** : le concept ("une ligne qui part et revient sur elle-même") n'a pas été remis en question pendant ce brainstorm ; il sera ré-exécuté avec la nouvelle palette (encre bleu nuit + accent or) mais son concept reste inchangé. Si le nom change plus tard, le logo sera revisité à ce moment-là.
