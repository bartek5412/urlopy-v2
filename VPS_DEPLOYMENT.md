# Instrukcja wdrożenia na VPS

## Metoda 1: Eksport/Import obrazu Docker (Rekomendowana)

### Na lokalnym komputerze:

1. **Zbuduj obraz:**
   ```bash
   docker-compose build
   ```

2. **Eksportuj obraz do pliku tar:**
   ```bash
   docker save urlopy-v2-urlopy-app:latest | gzip > urlopy-app.tar.gz
   ```
   
   Lub jeśli obraz ma inną nazwę:
   ```bash
   docker images | grep urlopy
   # Znajdź nazwę obrazu (np. urlopy-v2-urlopy-app:latest)
   docker save urlopy-v2-urlopy-app:latest | gzip > urlopy-app.tar.gz
   ```

3. **Skopiuj plik na VPS:**
   ```bash
   scp urlopy-app.tar.gz user@vps-ip:/path/to/destination/
   ```

### Na VPS:

1. **Zaimportuj obraz:**
   ```bash
   gunzip -c urlopy-app.tar.gz | docker load
   ```

2. **Skopiuj pliki projektu na VPS:**
   ```bash
   # Utwórz katalog projektu
   mkdir -p /opt/urlopy-v2
   cd /opt/urlopy-v2
   
   # Skopiuj potrzebne pliki (scp, rsync, lub git clone)
   # Potrzebne pliki:
   # - docker-compose.prod.yml (lub docker-compose.yml)
   # - .env (z zmiennymi środowiskowymi)
   # - prisma/ (jeśli chcesz zachować baze danych lub migracje)
   ```

3. **Utwórz plik `.env` na VPS** (z tymi samymi wartościami co lokalnie)

4. **Uruchom kontener:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Metoda 2: Build na VPS (Zalecana dla produkcyjnego)

### Na VPS:

1. **Zainstaluj Docker i Docker Compose:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Zainstaluj Docker Compose (jeśli nie ma)
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Sklonuj repozytorium lub skopiuj pliki:**
   ```bash
   # Opcja A: Git
   git clone <twoje-repo-url> /opt/urlopy-v2
   cd /opt/urlopy-v2
   
   # Opcja B: SCP/RSYNC (skopiuj cały projekt)
   rsync -avz --exclude node_modules --exclude .next --exclude '*.db*' ./ user@vps-ip:/opt/urlopy-v2/
   ```

3. **Utwórz plik `.env` na VPS:**
   ```bash
   nano /opt/urlopy-v2/.env
   ```
   
   Dodaj te same zmienne co lokalnie:
   ```env
   DATABASE_URL=file:./prisma/prod.db
   GOOGLE_CALENDAR_CLIENT_EMAIL=calendarcp@gothic-imprint-484700-j0.iam.gserviceaccount.com
   GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_CALENDAR_ID=primary
   ```

4. **Zbuduj i uruchom:**
   ```bash
   cd /opt/urlopy-v2
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Metoda 3: Docker Hub (Opcjonalna)

Jeśli chcesz użyć Docker Hub:

1. **Na lokalnym komputerze - zbuduj i wypchnij:**
   ```bash
   docker build -t twoj-dockerhub-user/urlopy-v2:latest .
   docker login
   docker push twoj-dockerhub-user/urlopy-v2:latest
   ```

2. **Na VPS - pobierz i uruchom:**
   ```bash
   docker pull twoj-dockerhub-user/urlopy-v2:latest
   # Użyj docker-compose z obrazem z Docker Hub
   ```

## Konfiguracja na VPS

### 1. Utwórz katalog z projektem:
```bash
sudo mkdir -p /opt/urlopy-v2
sudo chown $USER:$USER /opt/urlopy-v2
cd /opt/urlopy-v2
```

### 2. Pliki do skopiowania:

**Wymagane:**
- `docker-compose.prod.yml` (lub `docker-compose.yml`)
- `.env` (z wszystkimi zmiennymi środowiskowymi)
- `prisma/` (folder z migracjami)

**Opcjonalne (jeśli budujesz na VPS):**
- Cały projekt (lub użyj git clone)

### 3. Uruchom kontener:

```bash
# Użyj docker-compose.prod.yml (dla produkcji)
docker-compose -f docker-compose.prod.yml up -d

# Sprawdź logi
docker-compose -f docker-compose.prod.yml logs -f

# Sprawdź status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Ustaw reverse proxy (nginx/traefik) - opcjonalnie:

Jeśli chcesz użyć nginx przed aplikacją:

```nginx
server {
    listen 80;
    server_name twoja-domena.pl;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Aktualizacja aplikacji na VPS

### Metoda A: Eksport/Import (jeśli używasz metody 1):
```bash
# Na lokalnym komputerze
docker-compose build
docker save urlopy-v2-urlopy-app:latest | gzip > urlopy-app.tar.gz
scp urlopy-app.tar.gz user@vps:/tmp/

# Na VPS
docker-compose -f docker-compose.prod.yml down
gunzip -c /tmp/urlopy-app.tar.gz | docker load
docker-compose -f docker-compose.prod.yml up -d
```

### Metoda B: Rebuild na VPS (jeśli używasz metody 2):
```bash
# Na VPS
cd /opt/urlopy-v2
git pull  # lub skopiuj nowe pliki
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## Backup bazy danych

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec urlopy-app cp /app/prisma/prod.db /app/prisma/prod.db.backup
scp user@vps:/opt/urlopy-v2/prisma/prod.db ./backup-$(date +%Y%m%d).db

# Restore
scp backup.db user@vps:/opt/urlopy-v2/prisma/prod.db
docker-compose -f docker-compose.prod.yml restart urlopy-app
```

## Monitorowanie

```bash
# Logi w czasie rzeczywistym
docker-compose -f docker-compose.prod.yml logs -f

# Status kontenerów
docker-compose -f docker-compose.prod.yml ps

# Zużycie zasobów
docker stats urlopy-v2
```

## Rozwiązywanie problemów

### Kontener nie startuje:
```bash
docker-compose -f docker-compose.prod.yml logs urlopy-app
docker-compose -f docker-compose.prod.yml ps
```

### Błąd z bazą danych:
```bash
# Sprawdź uprawnienia do pliku bazy danych
ls -la /opt/urlopy-v2/prisma/

# Sprawdź logi Prisma
docker-compose -f docker-compose.prod.yml exec urlopy-app npx prisma migrate status
```

### Błąd z Google Calendar:
```bash
# Sprawdź zmienne środowiskowe w kontenerze
docker-compose -f docker-compose.prod.yml exec urlopy-app env | grep GOOGLE
```

## Automatyczne uruchamianie po restarcie VPS

Docker Compose z `restart: unless-stopped` automatycznie uruchomi kontenery po restarcie VPS. Jeśli chcesz być pewny:

```bash
# Sprawdź czy Docker service jest włączony
sudo systemctl enable docker
sudo systemctl enable docker-compose  # jeśli zainstalowane jako service
```
