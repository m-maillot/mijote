#!/bin/sh
set -e

echo "Application des migrations..."
if ! npx prisma migrate deploy 2>&1; then
  echo "Tentative de résolution des migrations échouées..."
  # Extraire les noms des migrations échouées et les marquer comme rolled-back
  npx prisma migrate status 2>&1 | grep -i "failed" | grep -oP '`\K[^`]+' | while read -r migration; do
    echo "Résolution de la migration échouée: $migration"
    npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null || true
  done
  echo "Nouvelle tentative d'application des migrations..."
  npx prisma migrate deploy
fi

echo "Initialisation du compte admin..."
node prisma/init-admin.js

echo "Démarrage de l'application..."
exec node server.js
