#!/bin/sh
set -e

# Uruchom migracje jeśli są (użyj npm run z package.json)
if [ -f "package.json" ] && [ -d "node_modules/prisma" ]; then
  echo "Running Prisma migrations..."
  node node_modules/prisma/build/index.js migrate deploy || true
fi

# Uruchom aplikację
exec node server.js
