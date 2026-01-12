#!/bin/sh
set -e

# Uruchom migracje jeśli są
if [ -f "package.json" ] && [ -d "node_modules/prisma" ]; then
  echo "Running Prisma migrations..."
  npm run prisma:migrate || true
fi

# Uruchom aplikację
exec node server.js
