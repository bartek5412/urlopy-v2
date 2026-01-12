# Migracja do Prisma 7

Aplikacja została zaktualizowana do Prisma 7, która wymaga innej konfiguracji niż Prisma 6.

## Zmiany

1. **schema.prisma** - Usunięto `url` z datasource (teraz w `prisma.config.ts`)
2. **prisma.config.ts** - Zawiera konfigurację datasource z URL
3. **lib/db.ts** - Używa adaptera `@prisma/adapter-better-sqlite3`
4. **package.json** - Dodano zależność `@prisma/adapter-better-sqlite3`

## Instalacja na serwerze

Po wgraniu zaktualizowanych plików:

```bash
cd /www/wwwroot/urlopy-v2

# Zbuduj nowy obraz z zaktualizowanymi zależnościami
docker-compose -f docker-compose.prod.yml build

# Uruchom migracje
docker-compose -f docker-compose.prod.yml run --rm urlopy-app npx prisma migrate deploy

# Uruchom aplikację
docker-compose -f docker-compose.prod.yml up -d
```

## Rozwiązywanie problemów

Jeśli nadal widzisz błędy:

1. **Sprawdź wersję Prisma w kontenerze:**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm urlopy-app npx prisma --version
   ```

2. **Zainstaluj zależności ręcznie:**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm urlopy-app npm install
   ```

3. **Sprawdź czy prisma.config.ts jest w kontenerze:**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm urlopy-app ls -la prisma.config.ts
   ```

4. **Sprawdź logi:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs urlopy-app
   ```
