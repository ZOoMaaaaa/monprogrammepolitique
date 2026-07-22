# Mon Programme Politique

> Plateforme web civique et ludique : chaque citoyen construit **son propre programme politique**, puis les programmes s'affrontent en **duels** notés par la communauté. Classement, niveaux et profils publics à la clé.

> 🔗 Démo en ligne : _à venir_

---

## Fonctionnalités

- **Création de programme** — l'utilisateur rédige ses mesures par thématique (catégories) via un formulaire dédié.
- **Duels** — deux programmes s'affrontent, la communauté vote : un format ludique pour comparer les idées.
- **Classement & niveaux** — leaderboard, système d'XP et de niveaux pour la progression des membres.
- **Profils publics** — chaque membre dispose d'une page profil consultable.
- **Mode invité** — consultation des duels et du classement sans compte.
- **Authentification** — inscription, connexion, réinitialisation de mot de passe (Supabase Auth).
- **Back-office admin** — modération, gestion des utilisateurs (bannissement), administration du contenu.
- **Contexte IA** — une Edge Function Supabase enrichit automatiquement les programmes d'un contexte / résumé généré par LLM.
- **Conformité** — bannière cookies et pages légales (mentions, CGU, règles).

## Stack technique

| Domaine | Technologies |
|---|---|
| Front-end | React 19, Vite 8, React Router 7 |
| Back-end / données | Supabase (PostgreSQL, Auth, Edge Functions Deno) |
| IA | Edge Function `generate-ai-context` → API Groq (modèle `openai/gpt-oss-120b`) |
| Qualité | ESLint |
| Déploiement | Vercel |

## Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com)
- Une clé API [Groq](https://console.groq.com) (pour la génération du contexte IA)

## Installation

```bash
git clone https://github.com/ZOoMaaaaa/monprogrammepolitique.git
cd monprogrammepolitique
npm install
```

Crée un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## Lancer en développement

```bash
npm run dev        # http://localhost:5173
```

Autres scripts :

```bash
npm run build      # build de production
npm run preview    # prévisualiser le build
npm run lint       # lint ESLint
```

## Configuration Supabase

```bash
# Schéma et données de départ (à appliquer sur votre base Supabase)
supabase/schema.sql
supabase/seed.sql

# Edge Function de génération du contexte IA
supabase functions deploy generate-ai-context
supabase secrets set GROQ_API_KEY=votre_cle_groq
```

Un script Node (`scripts/backfill-ai-context.js`) permet de (re)générer en masse le contexte IA des programmes existants.

## Structure du projet

```
src/
  pages/         Écrans (Home, Duel, Leaderboard, ProgramForm, Admin, ProfilePage…)
  components/    NavBar, Footer, LevelProgress, CookieBanner
  contexts/      AuthContext (session, profil, mode invité)
  lib/           supabase.js, categories.js, levels.js
supabase/
  schema.sql     Schéma de la base
  seed.sql       Données initiales
  functions/     Edge Function generate-ai-context (Deno)
scripts/         backfill-ai-context.js
```

## Licence

Projet personnel — tous droits réservés.
