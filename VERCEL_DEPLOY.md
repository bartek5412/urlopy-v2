# Wdrożenie na Vercel

## Problem z SQLite

SQLite **nie działa** na Vercel, ponieważ:

- Vercel używa serverless functions z read-only filesystem
- SQLite wymaga zapisu do pliku na dysku
- Każda funkcja serverless ma własny, tymczasowy filesystem

## Rozwiązanie: PostgreSQL

Musisz zmienić bazę danych na PostgreSQL. Masz kilka opcji:

### Opcja 1: Vercel Postgres (Zalecane)

1. **W Vercel Dashboard:**

   - Przejdź do swojego projektu
   - **Storage** → **Create Database** → **Postgres**
   - Utwórz bazę danych

2. **Zmienne środowiskowe:**
   - Vercel automatycznie doda `POSTGRES_URL` i `POSTGRES_PRISMA_URL`
   - Dodaj w **Settings** → **Environment Variables**:
     ```
     DATABASE_URL=$POSTGRES_PRISMA_URL
     ```

### Opcja 2: Zewnętrzna baza danych

Możesz użyć:

- **Supabase** (darmowy tier)
- **Neon** (darmowy tier)
- **PlanetScale** (darmowy tier)
- **Railway** (darmowy tier)

## Migracja z SQLite do PostgreSQL

### 1. Zaktualizuj `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Zaktualizuj `package.json`:

Usuń `better-sqlite3` (nie jest potrzebny dla PostgreSQL):

```json
// Usuń tę linię:
"better-sqlite3": "^12.6.0",
```

### 3. Zainstaluj PostgreSQL driver:

```bash
npm install pg @types/pg
```

### 4. Utwórz nową migrację:

```bash
npx prisma migrate dev --name init_postgres
```

### 5. Wgraj zmiany na Vercel:

```bash
git add .
git commit -m "Migrate to PostgreSQL for Vercel"
git push
```

## Konfiguracja na Vercel

1. **Environment Variables:**

   - W Vercel Dashboard → **Settings** → **Environment Variables**
   - Dodaj `DATABASE_URL` z connection string PostgreSQL

2. **Build Command:**

   - Vercel automatycznie wykryje Next.js
   - Upewnij się, że `package.json` ma:
     ```json
     "build": "prisma generate && next build"
     ```

3. **Deploy:**
   - Vercel automatycznie zbuduje i wdroży po push do Git

## Migracja danych (jeśli masz istniejące dane)

Jeśli masz dane w SQLite, które chcesz przenieść:

1. **Eksportuj dane z SQLite:**

   ```bash
   npx prisma db pull
   ```

2. **Zaimportuj do PostgreSQL:**
   - Użyj narzędzi do migracji danych
   - Lub ręcznie przez Prisma Studio

## Troubleshooting

### Błąd: "Failed to register"

**Przyczyna:** SQLite nie działa na Vercel

**Rozwiązanie:**

1. Zmień na PostgreSQL (jak wyżej)
2. Upewnij się, że `DATABASE_URL` jest ustawiony w Vercel
3. Uruchom migracje: `npx prisma migrate deploy`

### Błąd: "Prisma Client not generated"

**Rozwiązanie:**

- Dodaj `prisma generate` do build command
- Lub użyj `postinstall` script w `package.json`:
  ```json
  "postinstall": "prisma generate"
  ```

### Błąd: "Connection timeout"

**Rozwiązanie:**

- Sprawdź, czy connection string jest poprawny
- Upewnij się, że baza danych pozwala na połączenia z Vercel IP
- Dla Vercel Postgres to działa automatycznie

## Alternatywa: Pozostań przy VPS

Jeśli chcesz pozostać przy SQLite, lepiej użyć VPS (jak wcześniej przygotowaliśmy):

- Docker + SQLite działa dobrze
- Pełna kontrola nad środowiskiem
- Tańsze dla większych aplikacji
