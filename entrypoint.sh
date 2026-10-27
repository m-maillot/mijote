#!/bin/sh
set -e

PRISMA="node /opt/prisma/node_modules/prisma/build/index.js"

echo "Application des migrations..."
if ! $PRISMA migrate deploy 2>&1; then
  echo "Tentative de résolution des migrations échouées..."
  # Extraire les noms des migrations échouées et les marquer comme rolled-back
  $PRISMA migrate status 2>&1 | grep -i "failed" | grep -o '`[^`]*`' | tr -d '`' | while read -r migration; do
    echo "Résolution de la migration échouée: $migration"
    $PRISMA migrate resolve --rolled-back "$migration" 2>/dev/null || true
  done
  echo "Nouvelle tentative d'application des migrations..."
  $PRISMA migrate deploy
fi

echo "Initialisation du compte admin..."
node prisma/init-admin.js

echo "Démarrage de l'application..."
exec node server.js
