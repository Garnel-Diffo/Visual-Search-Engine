# Visual-Search-Engine

> Dépôt GitHub : [Garnel-Diffo/Visual-Search-Engine](https://github.com/Garnel-Diffo/Visual-Search-Engine)

Moteur de recherche visuelle par similarité d'images, basé sur des **représentations
vectorielles (embeddings) extraites par un réseau de neurones convolutif pré-entraîné**
(transfert d'apprentissage, sans ré-entraînement), appliqué au **Clothing Dataset** (CODAIT).

Le projet est composé de trois parties :

- **`notebook/`** - Analyse exploratoire, comparaison de plusieurs techniques d'extraction de
  représentations vectorielles, sélection du meilleur modèle, export ONNX et des artefacts.
- **`backend/`** - API REST Flask (déployée sur Render) qui encode une image envoyée par
  l'utilisateur et retrouve les articles les plus similaires du catalogue, avec les
  métadonnées stockées dans PostgreSQL (Neon).
- **`frontend/`** - Application web Next.js (déployée sur Vercel) consommant l'API : upload
  d'image, catalogue, pages de détail avec articles similaires.

---

## Sommaire

1. [Architecture générale](#1-architecture-générale)
2. [Prérequis](#2-prérequis)
3. [Le notebook de recherche visuelle](#3-le-notebook-de-recherche-visuelle)
   - [3.1 Structure du notebook](#31-structure-du-notebook)
   - [3.2 Dataset](#32-dataset)
   - [3.3 Comparaison des techniques d'extraction](#33-comparaison-des-techniques-dextraction)
   - [3.4 Modèle retenu et hyperparamètres](#34-modèle-retenu-et-hyperparamètres)
   - [3.5 Artefacts exportés](#35-artefacts-exportés)
4. [Backend Flask](#4-backend-flask)
   - [4.1 Architecture du backend](#41-architecture-du-backend)
   - [4.2 Modèle de données PostgreSQL](#42-modèle-de-données-postgresql)
   - [4.3 Configuration locale (.env)](#43-configuration-locale-env)
   - [4.4 Installation et lancement local](#44-installation-et-lancement-local)
   - [4.5 Peuplement de la base de données](#45-peuplement-de-la-base-de-données)
   - [4.6 Endpoints de l'API](#46-endpoints-de-lapi)
5. [Frontend Next.js](#5-frontend-nextjs)
   - [5.1 Configuration locale (.env)](#51-configuration-locale-env)
   - [5.2 Installation et lancement local](#52-installation-et-lancement-local)
   - [5.3 Pages de l'application](#53-pages-de-lapplication)
6. [Test complet en local](#6-test-complet-en-local)
7. [Déploiement](#7-déploiement)
   - [7.1 Préparer le dépôt GitHub](#71-préparer-le-dépôt-github)
   - [7.2 Déployer le backend sur Render](#72-déployer-le-backend-sur-render)
   - [7.3 Déployer le frontend sur Vercel](#73-déployer-le-frontend-sur-vercel)
8. [Limitations et pistes d'amélioration](#8-limitations-et-pistes-damélioration)

---

## 1. Architecture générale

```
                ┌─────────────────────────┐
                │   notebook/              │
                │   (comparaison de CNN    │
                │    pré-entraînés,        │
                │    PyTorch + ONNX)       │
                └──────────┬───────────────┘
                            │ export (encoder.onnx, .npy, .csv)
                            ▼
┌──────────────────────────────────────────┐        ┌───────────────────────────┐
│  backend/ (Flask, Render)                 │◄──────►│  PostgreSQL (Neon)        │
│  - encode l'image envoyée (ONNX Runtime)  │        │  - clothing_items         │
│  - recherche par similarité cosinus       │        │    (métadonnées + URL     │
│  - API REST JSON                          │        │     de la vignette)       │
└──────────────────┬─────────────────────────┘        └───────────────────────────┘
                   │ HTTP / JSON
                   ▼
┌──────────────────────────────────────────┐
│  frontend/ (Next.js, Vercel)              │
│  - upload d'image -> articles similaires  │
│  - catalogue (filtres, pagination)        │
│  - page de détail + articles similaires   │
│  - vignettes servies statiquement         │
└──────────────────────────────────────────┘
```

Les images du catalogue ne sont **jamais stockées en base** : seules les métadonnées
(catégorie, identifiant, index dans la matrice d'embeddings, URL de la vignette servie par le
frontend) sont conservées dans PostgreSQL. La recherche par similarité repose sur les
**embeddings pré-calculés** du catalogue (`image_embeddings.npy`) et sur un **encodeur ONNX**
léger (`encoder.onnx`), tous deux exportés une fois pour toutes par le notebook - aucune
dépendance à PyTorch n'est nécessaire en production.

---

## 2. Prérequis

- **Python 3.12+** (notebook et backend)
- **Node.js 20+** et npm (frontend)
- Un compte [Neon](https://neon.tech) (PostgreSQL géré, gratuit) - la chaîne de connexion est
  déjà fournie dans `backend/.env`

---

## 3. Le notebook de recherche visuelle

Dossier : [`notebook/`](notebook/)

- `build_notebook.py` : script générateur du notebook (toutes les cellules sont écrites en
  français, commentaires inclus).
- `visual_search_engine.ipynb` : notebook exécuté, prêt à être ouvert dans Jupyter.
- `data/clothing-dataset/` : jeu de données Clothing Dataset téléchargé localement.
- `models/` : artefacts exportés après extraction (copiés dans `backend/model_artifacts/`).

### 3.1 Structure du notebook

Le notebook suit les phases classiques d'un projet de Machine Learning appliqué à la
recherche par similarité d'images :

1. Importation des bibliothèques et configuration (graine aléatoire, device, chemins)
2. Chargement et nettoyage du catalogue (suppression des images "Skip", fichiers manquants,
   doublons)
3. Analyse exploratoire des données (EDA) - distribution des catégories, sections
   adulte/enfant, échantillon d'images, statistiques de tailles
4. Pipeline de prétraitement (redimensionnement, recadrage central, normalisation ImageNet)
   et `Dataset`/`DataLoader` PyTorch
5. Implémentation de quatre techniques d'extraction de représentations vectorielles :
   histogramme couleur HSV (baseline), ResNet18, MobileNetV3-Large, ResNet50 (tous
   pré-entraînés sur ImageNet, poids gelés)
6. Métrique d'évaluation **Precision@K** (K=5, 10), basée sur la catégorie comme proxy de
   pertinence, sur des requêtes aléatoires
7. Extraction des représentations pour les ~5 400 images du catalogue avec chacune des
   quatre techniques, comparaison (temps d'extraction, précision)
8. Sélection **data-driven** de la meilleure technique (la plus précise parmi les CNN, avec
   un compromis dimension/temps en cas d'écart négligeable)
9. Visualisation des embeddings par catégorie (PCA)
10. Démonstration de recherche visuelle (requête -> voisins les plus proches)
11. Export du modèle retenu au format **ONNX** + validation PyTorch vs ONNX Runtime
12. Export des embeddings (`image_embeddings.npy`), des métadonnées (`metadata.csv`) et des
    vignettes du catalogue pour le frontend
13. Conclusion et export des métriques (`comparison_results.json`, `eval_metrics.json`)

Le **déploiement n'est volontairement pas traité dans le notebook** : il est entièrement géré
par le backend Flask, qui charge les artefacts exportés (étapes 11-12).

### 3.2 Dataset

[Clothing Dataset (CODAIT)](https://github.com/alexeygrigorev/clothing-dataset) :
- 5 403 images brutes, réparties en 20 catégories (dont "Skip" et "Not sure")
- Après nettoyage (suppression des images "Skip", fichiers manquants et doublons) :
  **5 391 images, 19 catégories**

Les fichiers sont déjà téléchargés dans `notebook/data/clothing-dataset/`.

### 3.3 Comparaison des techniques d'extraction

Quatre techniques ont été comparées sur les 5 391 images du catalogue (Precision@K calculée
sur 1 000 requêtes aléatoires, catégorie comme proxy de pertinence) :

| Technique             | Dimension | Temps d'extraction | ms / image | Precision@5 | Precision@10 |
|-----------------------|----------:|--------------------:|-----------:|------------:|-------------:|
| Histogramme couleur HSV (baseline) |   48 |    64 s | 11.9 | 0.186 | 0.170 |
| ResNet18              |       512 |   905 s | 167.9 | 0.599 | 0.574 |
| MobileNetV3-Large     |       960 |   301 s | 55.8 | 0.612 | 0.586 |
| **ResNet50 (retenu)** |  **2048** | **1750 s** | **324.6** | **0.648** | **0.626** |

La baseline (histogramme couleur) est nettement dominée par les CNN pré-entraînés. Parmi les
trois CNN, **ResNet50 obtient la meilleure précision** (Precision@10 = 0.626, soit un écart
de ~+0.04 sur MobileNetV3-Large, supérieur au seuil de tolérance retenu de 0.005) : c'est donc
la technique sélectionnée **automatiquement** par le notebook (sélection data-driven, voir
`eval_metrics.json` -> `selected_technique`).

### 3.4 Modèle retenu et hyperparamètres

| Hyperparamètre              | Valeur |
|------------------------------|--------|
| Architecture                 | ResNet50 |
| Poids pré-entraînés           | ImageNet |
| Taille d'entrée               | 224 x 224 |
| Redimensionnement              | plus petit côté -> 256 px, puis recadrage central 224 x 224 |
| Normalisation                  | moyenne `[0.485, 0.456, 0.406]`, écart-type `[0.229, 0.224, 0.225]` (ImageNet) |
| Normalisation des embeddings   | L2 (similarité cosinus = produit scalaire) |
| Dimension des embeddings        | 2048 |
| Format d'export                 | ONNX (opset 17), inférence via ONNX Runtime (CPU) |

Aucun ré-entraînement n'est effectué : seule l'inférence du backbone pré-entraîné (transfert
d'apprentissage) est utilisée pour extraire les représentations vectorielles.

### 3.5 Artefacts exportés

Dans `notebook/models/` (et copiés dans `backend/model_artifacts/`) :

- `encoder.onnx` - backbone ResNet50 exporté au format ONNX (~94 Mo)
- `image_embeddings.npy` - embeddings normalisés (L2) des 5 391 images du catalogue,
  `float32`, shape `(5391, 2048)`
- `metadata.csv` - métadonnées légères (`item_index`, `image_id`, `label`, `kids`)
- `comparison_results.json` - résultats détaillés de la comparaison des 4 techniques
- `eval_metrics.json` - hyperparamètres retenus et métriques finales

Les vignettes (240x240, JPEG qualité 80) des 5 391 images sont exportées dans
`frontend/public/catalog/`, servies statiquement par le frontend.

---

## 4. Backend Flask

Dossier : [`backend/`](backend/)

### 4.1 Architecture du backend

```
backend/
├── app/
│   ├── __init__.py        # create_app() : factory Flask
│   ├── config.py           # configuration (variables d'environnement)
│   ├── extensions.py        # instance SQLAlchemy
│   ├── models.py            # modèle ClothingItem
│   ├── routes/
│   │   ├── health.py          # GET /api/health
│   │   ├── images.py           # GET /api/images, /api/images/<id>, /api/images/<id>/similar, /api/images/labels
│   │   └── search.py            # POST /api/search (upload d'image)
│   └── services/
│       ├── encoder.py          # encodeur ONNX (image -> embedding normalisé)
│       └── index.py             # index vectoriel (similarité cosinus sur les embeddings)
├── scripts/
│   └── populate_db.py          # peuplement (upsert) ponctuel de la base Neon
├── model_artifacts/             # encoder.onnx, image_embeddings.npy, metadata.csv (exportés par le notebook)
├── wsgi.py                       # point d'entrée Gunicorn / Flask
├── Procfile                       # commande de démarrage pour Render
├── requirements.txt               # dépendances de production
├── .env                            # configuration locale (non versionné)
└── .env.example                    # modèle de configuration
```

L'`ImageEncoder` (`app/services/encoder.py`) charge `encoder.onnx` via ONNX Runtime au
démarrage de l'application, et applique exactement le même prétraitement (redimensionnement,
recadrage central, normalisation ImageNet) que celui utilisé dans le notebook pour produire
`image_embeddings.npy`. Le `VisualIndex` (`app/services/index.py`) charge les embeddings du
catalogue et calcule la similarité cosinus par simple produit scalaire NumPy (les embeddings
étant déjà normalisés en norme L2).

### 4.2 Modèle de données PostgreSQL

Une seule table, volontairement minimaliste (les images elles-mêmes ne sont jamais stockées
en base) :

- **`clothing_items`** : `id` (clé primaire), `image_id` (identifiant unique de l'image,
  UUID), `item_index` (indice dans la matrice d'embeddings, unique), `label` (catégorie),
  `kids` (section enfant), `image_url` (URL de la vignette servie par le frontend)

### 4.3 Configuration locale (.env)

Le fichier `backend/.env` (déjà créé, non versionné) contient :

```env
FLASK_ENV=development
DATABASE_URL=ma_chaine_de_connexion_postgresql_neon.tech
CORS_ORIGINS=http://localhost:3000
PORT=5000
DEFAULT_TOP_K=12
MAX_TOP_K=50
MAX_UPLOAD_SIZE_MB=8
```

Un modèle est disponible dans `backend/.env.example`.

### 4.4 Installation et lancement local

```bash
cd backend
python -m venv .venv

# Windows
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe wsgi.py

# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
python wsgi.py
```

L'API démarre sur **http://localhost:5000**. Vérification rapide :

```bash
curl http://localhost:5000/api/health
```

### 4.5 Peuplement de la base de données

À exécuter **une seule fois** (déjà fait pour la base Neon fournie, mais nécessaire si vous
recréez votre propre base ou ré-générez les artefacts) :

```bash
cd backend
./.venv/Scripts/python.exe -m scripts.populate_db
```

Ce script :
1. Crée la table `clothing_items` (si absente).
2. Charge `model_artifacts/metadata.csv` et insère/met à jour (upsert sur `image_id`) les
   5 391 articles du catalogue, avec l'URL de leur vignette (`/catalog/<image_id>.jpg`).

Le script est **idempotent** : les exécutions suivantes mettent simplement à jour les lignes
existantes sans créer de doublons.

### 4.6 Endpoints de l'API

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | État de l'API et informations sur le modèle chargé (dimension des embeddings, nombre d'articles) |
| GET | `/api/images` | Liste paginée du catalogue (`label`, `kids`, `page`, `perPage`) |
| GET | `/api/images/labels` | Liste des catégories disponibles, avec le nombre d'articles |
| GET | `/api/images/<image_id>` | Détails d'un article |
| GET | `/api/images/<image_id>/similar` | Articles les plus similaires (similarité cosinus des embeddings, `k`) |
| POST | `/api/search` | Recherche par image : upload (`multipart/form-data`, champ `image`) -> articles les plus similaires (`k`) |

---

## 5. Frontend Next.js

Dossier : [`frontend/`](frontend/)

Application Next.js 16 (App Router, TypeScript, Tailwind CSS v4, React 19).

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                # accueil + recherche par image
│   │   ├── catalog/page.tsx         # catalogue (filtres par catégorie/section, pagination)
│   │   └── catalog/[id]/page.tsx     # détail d'un article + articles similaires
│   ├── components/                  # Navbar, Footer, SearchUploader, ImageCard, CatalogFilters, Pagination, ...
│   └── lib/api.ts                    # client API (fetch vers le backend Flask)
├── public/catalog/                    # vignettes du catalogue (exportées par le notebook)
├── .env.local                          # configuration locale (non versionné)
└── .env.example                        # modèle de configuration
```

### 5.1 Configuration locale (.env)

`frontend/.env.local` (déjà créé, non versionné) :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 5.2 Installation et lancement local

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:3000**.

### 5.3 Pages de l'application

- **`/`** - Accueil : présentation du projet, zone de recherche par image (upload / glisser-déposer)
- **`/catalog`** - Catalogue des articles (filtres par catégorie et section enfant, pagination)
- **`/catalog/[id]`** - Détail d'un article + articles visuellement similaires (embeddings CNN)

---

## 6. Test complet en local

1. Démarrer le backend (port 5000) - voir [4.4](#44-installation-et-lancement-local)
2. Démarrer le frontend (port 3000) - voir [5.2](#52-installation-et-lancement-local)
3. Ouvrir **http://localhost:3000** :
   - La page d'accueil doit afficher le nombre total d'articles et la zone d'upload.
   - Envoyer une photo de vêtement doit afficher les articles les plus similaires du catalogue.
   - `/catalog` doit afficher le catalogue paginé, avec filtres par catégorie et section
     enfant fonctionnels.
   - Cliquer sur un article doit afficher sa page de détail avec des articles similaires.

✅ Ce parcours a été testé de bout en bout avec la base Neon fournie (5 391 articles, 19
catégories) : tous les endpoints API (`/api/health`, `/api/images`, `/api/images/labels`,
`/api/images/<id>`, `/api/images/<id>/similar`, `/api/search`) et toutes les pages répondent
correctement (codes 200, CORS validé entre `http://localhost:3000` et
`http://localhost:5000`).

---

## 7. Déploiement

> Tout a été testé en local et fonctionne. Les étapes ci-dessous sont à exécuter **par vous**,
> dans l'ordre, après avoir poussé le code sur GitHub.

### 7.1 Préparer le dépôt GitHub

```bash
cd Visual-Search-Engine
git init
git add .
git commit -m "Initial commit: Visual-Search-Engine"
git branch -M main
git remote add origin https://github.com/Garnel-Diffo/Visual-Search-Engine.git
git push -u origin main
```

Le `.gitignore` exclut déjà : `.venv/`, `node_modules/`, `.env*` (sauf `.env.example`),
`notebook/data/`, les fichiers `.next/`, etc.

> ⚠️ Les fichiers `notebook/models/encoder.onnx` et `backend/model_artifacts/encoder.onnx`
> pèsent chacun ~94 Mo (sous la limite de 100 Mo de GitHub, mais proches du seuil
> d'avertissement de 50 Mo). Si `git push` échoue ou affiche un avertissement de taille,
> envisagez [Git LFS](https://git-lfs.com/) pour ces deux fichiers.

### 7.2 Déployer le backend sur Render

1. Sur [Render](https://render.com), créer un **New > Web Service**, connecter votre dépôt
   GitHub et sélectionner le dossier racine **`backend`** (Root Directory : `backend`).
2. Configuration du service :
   - **Runtime** : Python 3
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `gunicorn wsgi:app` (déjà défini dans `backend/Procfile`)
3. Ajouter les **variables d'environnement** (Environment) suivantes (copier les valeurs de
   `backend/.env`) :
   - `FLASK_ENV` = `production`
   - `DATABASE_URL` = *(votre chaîne de connexion Neon, voir `backend/.env`)*
   - `CORS_ORIGINS` = *(URL Vercel de votre frontend, ex : `https://visual-search-engine.vercel.app`)*
   - `DEFAULT_TOP_K` = `12`
   - `MAX_TOP_K` = `50`
   - `MAX_UPLOAD_SIZE_MB` = `8`
4. Déployer. Une fois le service en ligne, vérifier `https://<votre-service>.onrender.com/api/health`.
5. La base Neon est déjà peuplée - aucune action supplémentaire n'est nécessaire. Si vous
   recréez une base, exécutez `populate_db.py` en local en pointant `DATABASE_URL` vers la
   nouvelle base (le script peut être lancé depuis votre machine, il n'a pas besoin d'être
   exécuté sur Render).

### 7.3 Déployer le frontend sur Vercel

1. Sur [Vercel](https://vercel.com), **Add New > Project**, importer le même dépôt GitHub et
   définir le **Root Directory** sur `frontend`.
2. Vercel détecte automatiquement Next.js (build : `next build`, output : `.next`).
3. Ajouter la variable d'environnement :
   - `NEXT_PUBLIC_API_URL` = `https://<votre-service>.onrender.com` (URL du backend Render,
     **sans** slash final)
4. Déployer. Une fois en ligne, vérifier que `/`, `/catalog`, `/catalog/[id]` et la recherche
   par image fonctionnent.
5. **Important** : revenir sur Render et mettre à jour `CORS_ORIGINS` avec l'URL Vercel finale
   (ex : `https://visual-search-engine.vercel.app`), puis redéployer le backend.

---

## 8. Limitations et pistes d'amélioration

- La recherche par similarité est effectuée par **force brute** (produit scalaire NumPy sur
  5 391 embeddings) : largement suffisant pour ce volume, mais ne s'étendrait pas
  efficacement à des catalogues de plusieurs millions d'images sans index approximatif (FAISS,
  HNSW, etc.).
- La pertinence (Precision@K) est évaluée à partir de la **catégorie comme proxy de
  similarité visuelle** : deux articles de catégories différentes mais visuellement proches
  (ex. deux vêtements de couleur/texture similaires) peuvent être considérés comme
  "non pertinents" par cette métrique, bien que visuellement cohérents.
- Le modèle n'est **pas fine-tuné** sur le Clothing Dataset (transfert d'apprentissage pur,
  poids ImageNet gelés) : un fine-tuning supervisé sur les catégories du dataset
  améliorerait probablement encore la précision.
- Pour ré-extraire les embeddings avec un nouveau modèle ou un nouveau dataset : relancer
  `notebook/build_notebook.py` puis le notebook, copier les nouveaux artefacts dans
  `backend/model_artifacts/` et `frontend/public/catalog/`, puis relancer `populate_db.py`.
