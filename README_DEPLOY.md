# Szybki start - Wdrożenie na VPS z aaPanel

## Krótka instrukcja

### 1. Przygotuj serwer

```bash
# Zainstaluj Docker (jeśli nie masz)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Zainstaluj Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Wgraj pliki na serwer

```bash
# Utwórz katalog
mkdir -p /www/wwwroot/urlopy-v2
cd /www/wwwroot/urlopy-v2

# Wgraj pliki (przez Git, scp, lub aaPanel File Manager)
# Jeśli używasz Git:
git clone <twoje-repo> .
```

### 3. Skonfiguruj

```bash
# Utwórz plik .env
cat > .env << EOF
DATABASE_URL="file:./prisma/prod.db"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://twoja-domena.pl
EOF

# Utwórz katalog dla bazy danych
mkdir -p prisma
```

### 4. Zbuduj i uruchom

```bash
# Zbuduj obraz
docker-compose -f docker-compose.prod.yml build

# Uruchom migracje
docker-compose -f docker-compose.prod.yml run --rm urlopy-app npm run prisma:migrate

# Uruchom aplikację
docker-compose -f docker-compose.prod.yml up -d

# Sprawdź logi
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Skonfiguruj reverse proxy w aaPanel

1. **Website** → **Add Site** → Wprowadź domenę
2. **Settings** → **Reverse Proxy** → **Add Reverse Proxy**
   - Target URL: `http://127.0.0.1:3000`
   - Send Domain: ✅ Włącz
3. **SSL** → Włącz Let's Encrypt

### 6. Zarządzanie

```bash
# Restart
docker-compose -f docker-compose.prod.yml restart

# Zatrzymaj
docker-compose -f docker-compose.prod.yml down

# Logi
docker-compose -f docker-compose.prod.yml logs -f urlopy-app

# Aktualizacja
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml run --rm urlopy-app npm run prisma:migrate
```

## Ważne!

- Port 3000 jest dostępny tylko lokalnie (127.0.0.1) - bezpieczeństwo
- Baza danych jest w `./prisma/prod.db` - rób regularne backupy
- Aplikacja automatycznie restartuje się po restarcie serwera

## Pełna dokumentacja

Zobacz [DEPLOYMENT.md](./DEPLOYMENT.md) dla szczegółowej instrukcji.
