#!/bin/sh
set -e

echo "Application des migrations..."
npx prisma migrate deploy

echo "Initialisation du compte admin..."
npx tsx prisma/init-admin.ts

echo "Démarrage de l'application..."
exec node server.js
