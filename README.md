# Mijoté

Application web familiale pour collecter et partager les recettes de famille. Chaque membre accède à l'application via un lien personnel unique (sans mot de passe). Les membres peuvent ajouter des recettes, et proposer des modifications sous forme de suggestions soumises au vote de la famille.

## Fonctionnalités

- **Recettes structurées** : titre, ingrédients (quantité, unité, nom), étapes de préparation, photos
- **Authentification simplifiée** : accès par lien unique, sans compte ni mot de passe
- **Suggestions collaboratives** : proposer des modifications sur le titre, les ingrédients ou les étapes
- **Système de vote** : les suggestions sont appliquées automatiquement après approbation (seuil configurable)
- **Vue diff** : visualisation des différences entre la recette et la suggestion
- **Notifications email** : notification à toute la famille quand une nouvelle recette est ajoutée
- **Administration** : gestion des membres et de leurs liens d'accès par un compte admin
- **Design cahier de recettes** : interface inspirée des vieux cahiers manuscrits, responsive mobile

## Stack technique

- **Next.js 16** (App Router)
- **PostgreSQL 16**
- **Prisma 6** (ORM)
- **Tailwind CSS 4**
- **Nodemailer** (emails via Brevo SMTP)

## Développement

### Prérequis

- Node.js 22+
- Docker & Docker Compose

### Installation

```bash
# Cloner le projet
git clone https://github.com/m-maillot/mijote.git
cd scanbelotte

# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer PostgreSQL
docker compose up -d

# Appliquer les migrations
npx prisma migrate dev

# (Optionnel) Charger les données de démo
npx prisma db seed

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur http://localhost:3010.

### Données de démo

Le seed crée 3 membres et 3 recettes :

| Membre | Lien |
|--------|------|
| Mamie Jeanne (admin) | http://localhost:3010/api/auth?token=mamie-token-secret |
| Papa Michel | http://localhost:3010/api/auth?token=papa-token-secret |
| Maman Sophie | http://localhost:3010/api/auth?token=maman-token-secret |

## Déploiement (Docker)

### Avec Docker Compose

```bash
# Copier et configurer le fichier de production
cp docker-compose.prod.yml docker-compose.yml
```

Éditer les variables d'environnement dans `docker-compose.yml` :

```yaml
environment:
  DATABASE_URL: "postgresql://recettes:recettes@db:5432/recettes?schema=public"
  ADMIN_NAME: "Votre Nom"          # Nom du compte admin (créé au 1er lancement)
  ADMIN_EMAIL: "vous@email.fr"     # Email du compte admin
  APP_URL: "https://recettes.votredomaine.fr"
  SMTP_HOST: "smtp-relay.brevo.com"
  SMTP_PORT: "587"
  SMTP_USER: "votre-login-brevo"
  SMTP_PASS: "votre-clé-smtp"
  SMTP_FROM: "Carnet de Recettes <recettes@votredomaine.fr>"
```

```bash
docker compose up -d
```

Au premier lancement, le compte admin est automatiquement créé et son lien d'accès est affiché dans les logs :

```bash
docker compose logs app
```

### Sur Synology

1. Ouvrir **Container Manager**
2. Aller dans **Projet** > **Créer**
3. Coller le contenu de `docker-compose.prod.yml`
4. Renseigner les variables d'environnement
5. Lancer le projet
6. Consulter les logs pour récupérer le lien admin

### Stockage des données

| Donnée | Volume |
|--------|--------|
| Base de données | `pgdata` |
| Photos des recettes | `uploads` |

## Configuration

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | — |
| `ADMIN_NAME` | Nom du compte admin (1er lancement) | — |
| `ADMIN_EMAIL` | Email du compte admin | — |
| `APP_URL` | URL publique de l'application | `http://localhost:3000` |
| `APPROVAL_THRESHOLD` | Nombre de votes pour approuver une suggestion | `2` |
| `SMTP_HOST` | Serveur SMTP | — |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Login SMTP | — |
| `SMTP_PASS` | Mot de passe SMTP | — |
| `SMTP_FROM` | Adresse d'expéditeur | — |

## CI/CD

Une image Docker est automatiquement construite et publiée sur GitHub Container Registry (`ghcr.io`) à chaque tag :

```bash
git tag v1.0.0
git push origin v1.0.0
```

L'image sera disponible sur `ghcr.io/m-maillot/mijote:1.0.0` et `:latest`.

Les images sont construites pour `linux/amd64` et `linux/arm64` (compatible Synology).
