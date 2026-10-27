# Déploiement

Chaque push sur `main` (ou un lancement manuel dans l'onglet Actions) exécute
`.github/workflows/deploy.yml` : build de l'image, push sur `ghcr.io/m-maillot/mijote`, copie de
`docker-compose.prod.yml` sur le VPS puis `docker compose up -d` en SSH.

Le VPS héberge déjà Tableau-Clair, dont le Caddy occupe les ports 80/443. Mijoté ne lance donc pas
son propre proxy : il se rattache au même réseau Docker (`proxy`) et le Caddy existant route vers lui.

## 0. Prérequis

- Le VPS a été préparé avec `scripts/bootstrap-server.sh` (dépôt Tableau-Clair) : Docker installé,
  utilisateur `deploy` **sans mot de passe et sans sudo**, connexion SSH par clé uniquement,
  pare-feu ouvert sur 22/80/443 (rien à changer pour Mijoté).
- Tableau-Clair est déployé : c'est lui qui porte Caddy et crée le réseau `proxy`.
- DNS de `ludlows.fr` : enregistrements `A` et `AAAA` vers le VPS (mêmes valeurs que
  `tableau-clair.fr`).
- Brevo : le domaine de `SMTP_FROM` doit être authentifié (SPF + DKIM). Le domaine n'a qu'un seul
  enregistrement SPF, qui doit inclure `include:spf.brevo.com`.

## 1. Sur le serveur (une seule fois)

### Dossier de l'application

`deploy` n'a pas de `sudo` : crée le dossier avec l'utilisateur administrateur du VPS
(`ubuntu` ou `debian` selon l'image), en le donnant à `deploy`.

```bash
ssh <utilisateur-admin>@<IP> 'sudo install -d -o deploy -g deploy -m 750 /opt/mijote'
```

### Fichier `.env`

Génère le mot de passe en hexadécimal (les caractères `/`, `+` et `=` du base64 cassent l'URL
Postgres) :

```bash
openssl rand -hex 24
```

Puis, connecté en `deploy` (`ssh deploy@<IP>`), crée `/opt/mijote/.env` :

```env
POSTGRES_PASSWORD=<mot de passe généré>
APPROVAL_THRESHOLD=2

# Photos (S3)
S3_BUCKET="..."
S3_REGION="eu-west-3"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_ENDPOINT=""
ADMIN_NAME="Admin"
ADMIN_EMAIL="vous@exemple.fr"
# Connexion Google (optionnel). URI de redirection : https://ludlows.fr/api/auth/google/callback
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APP_URL="https://ludlows.fr"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="Carnet de Recettes <recettes@ludlows.fr>"
```

```bash
chmod 600 /opt/mijote/.env
```

(`DATABASE_URL` est construit par le compose à partir de `POSTGRES_PASSWORD`.)

> **Le mot de passe doit être sûr dans une URL** (pas de `@ : / ? # %`…), sinon Prisma échoue avec
> `P1013 invalid port number in database URL`. Générer : `openssl rand -hex 24`.
> Postgres ne lit le mot de passe qu'à l'initialisation du volume : si le volume `pgdata` existe déjà,
> changer la valeur ne suffit pas (`docker compose -f docker-compose.prod.yml down -v` pour repartir
> de zéro, ou `ALTER USER recettes PASSWORD '…'`).

### Réseau partagé avec Caddy

⚠️ Ces modifications se font **dans le dépôt Tableau-Clair**, pas sur le serveur : le workflow de
Tableau-Clair réécrit `docker-compose.prod.yml` et `Caddyfile` à chaque déploiement.

Dans `docker-compose.prod.yml` de Tableau-Clair, ajouter au service `caddy` :

```yaml
    networks:
      - default
      - proxy
```

et en bas du fichier :

```yaml
networks:
  proxy:
    name: proxy
```

Dans le `Caddyfile` de Tableau-Clair, ajouter :

```caddy
ludlows.fr {
	encode zstd gzip
	reverse_proxy mijote:3000
}
```

Puis pousser sur `main` : le workflow de Tableau-Clair déploie et recrée Caddy (quelques secondes
de coupure sur `tableau-clair.fr`). Ne relance pas `docker compose` à la main : sans la variable
`APP_IMAGE`, il tente de reconstruire l'image et échoue.

Côté Mijoté, le `docker-compose.prod.yml` rattache **uniquement le service web** au réseau
`proxy` (jamais la base de données) :

```yaml
services:
  mijote:
    networks:
      - default
      - proxy

networks:
  proxy:
    external: true
    name: proxy
```

Le réseau doit exister avant le premier déploiement de Mijoté : déploie donc Tableau-Clair
d'abord.

> Limite : Caddy appartient à la pile Tableau-Clair (`depends_on` sur son application). Si elle ne
> démarre pas, Caddy non plus, et `ludlows.fr` est aussi indisponible. Si cela devient gênant,
> sors Caddy dans sa propre pile.

## 2. Clé SSH de déploiement

`deploy` n'a pas de mot de passe : `ssh-copy-id` ne fonctionne pas. Ajoute la clé publique via ta
connexion habituelle (ta clé personnelle est déjà autorisée) :

```bash
ssh-keygen -t ed25519 -f mijote_deploy -N "" -C "github-actions-mijote"
ssh deploy@<IP> 'cat >> ~/.ssh/authorized_keys' < mijote_deploy.pub
ssh -i mijote_deploy deploy@<IP> true && echo OK     # doit afficher OK
ssh-keyscan -t ed25519 <IP>                          # -> DEPLOY_KNOWN_HOSTS
```

L'utilisateur `deploy` peut lancer `docker` et écrire dans `/opt/mijote` (étape 1).

## 3. Secrets GitHub (Settings → Secrets and variables → Actions)

| Secret               | Valeur                                       |
| -------------------- | -------------------------------------------- |
| `DEPLOY_HOST`        | IP du VPS                                    |
| `DEPLOY_USER`        | `deploy`                                     |
| `DEPLOY_SSH_KEY`     | contenu de `mijote_deploy` (clé privée)      |
| `DEPLOY_KNOWN_HOSTS` | sortie de `ssh-keyscan`                      |

Supprime ensuite la clé privée locale. Le package ghcr créé au premier push peut rester privé : le
workflow fait `docker login` sur le serveur avec le `GITHUB_TOKEN` le temps du `pull`.

## 4. Premier déploiement

1. Tableau-Clair est déployé avec le réseau `proxy` et le bloc `ludlows.fr`.
2. Push sur `main` de Mijoté (ou Actions → Deploy → Run workflow).
3. Vérifier : `https://ludlows.fr` (le premier certificat peut prendre une minute).

En cas de souci, sur le serveur en `deploy` :

```bash
cd /opt/mijote
docker compose -f docker-compose.prod.yml logs --tail 100
docker compose -f /opt/tableau-clair/docker-compose.prod.yml logs --tail 30 caddy
docker network inspect proxy    # Caddy et mijote doivent y figurer
```