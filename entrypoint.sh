#!/bin/sh
set -e
cd /app
# Upewnij sie, ze katalog bazy istnieje
mkdir -p /app/prisma

# Napraw przypadek, gdy prod.db zostal utworzony jako katalog
if [ -d "/app/prisma/prod.db" ] && [ -f "/app/prisma/prod.db/prod.db" ]; then
  echo "Fixing nested prod.db directory..."
  mv /app/prisma/prod.db/prod.db /app/prisma/prod.db.tmp
  rmdir /app/prisma/prod.db
  mv /app/prisma/prod.db.tmp /app/prisma/prod.db
fi

# Napraw przypadek, gdy baza trafila do /app/prisma/prisma/prod.db
if [ -f "/app/prisma/prisma/prod.db" ]; then
  echo "Fixing nested prisma directory..."
  if [ ! -f "/app/prisma/prod.db" ]; then
    mv /app/prisma/prisma/prod.db /app/prisma/prod.db
  else
    rm -f /app/prisma/prisma/prod.db
  fi
  rmdir /app/prisma/prisma || true
fi

# Uruchom migracje jeśli są
if [ -f "package.json" ] && [ -d "node_modules/prisma" ]; then
  echo "Running Prisma migrations..."
  npm run prisma:migrate || true
fi

# Uruchom aplikację
exec node server.js
