# Instrukcja wdrożenia aplikacji na VPS z aaPanel

## Wymagania

- VPS z zainstalowanym aaPanel
- Docker i Docker Compose zainstalowane na serwerze
- Domena (opcjonalnie, ale zalecane)

## Krok 1: Przygotowanie serwera

### 1.1. Zainstaluj Docker i Docker Compose (jeśli nie są zainstalowane)

```bash
# Zainstaluj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Zainstaluj Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Dodaj użytkownika do grupy docker (opcjonalnie)
sudo usermod -aG docker $USER
```

### 1.2. Utwórz katalog dla aplikacji

```bash
mkdir -p /www/wwwroot/urlopy-v2
cd /www/wwwroot/urlopy-v2
```

## Krok 2: Wgranie plików na serwer

### Opcja A: Przez Git (zalecane)

```bash
# Sklonuj repozytorium
git clone <twoje-repo-url> .

# Lub jeśli już masz repozytorium lokalnie, użyj scp:
# scp -r . user@your-server:/www/wwwroot/urlopy-v2/
```

### Opcja B: Przez aaPanel File Manager

1. Zaloguj się do aaPanel
2. Przejdź do File Manager
3. Przejdź do `/www/wwwroot/urlopy-v2`
4. Wgraj wszystkie pliki projektu (możesz użyć opcji "Upload")

## Krok 3: Konfiguracja

### 3.1. Utwórz plik .env

```bash
cd /www/wwwroot/urlopy-v2
cp .env.example .env
nano .env
```

Ustaw zmienne środowiskowe:

```env
DATABASE_URL="file:./prisma/prod.db"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://twoja-domena.pl
```

### 3.2. Utwórz katalog dla bazy danych

```bash
mkdir -p prisma
chmod 755 prisma
```

## Krok 4: Budowanie i uruchomienie kontenera

### 4.1. Zbuduj obraz Dockera

```bash
cd /www/wwwroot/urlopy-v2
docker-compose build
```

### 4.2. Uruchom migracje bazy danych

```bash
# Uruchom kontener tymczasowo do wykonania migracji (użyj npm run zamiast npx)
docker-compose -f docker-compose.prod.yml run --rm urlopy-app npm run prisma:migrate
```

### 4.3. Uruchom aplikację

```bash
docker-compose up -d
```

### 4.4. Sprawdź status

```bash
docker-compose ps
docker-compose logs -f urlopy-app
```

## Krok 5: Konfiguracja reverse proxy w aaPanel

### 5.1. Utwórz nową stronę w aaPanel

1. Zaloguj się do aaPanel
2. Przejdź do **Website** → **Add Site**
3. Wprowadź domenę (np. `urlopy.twoja-domena.pl`)
4. Wybierz **PHP Version: None** (nie potrzebujemy PHP)
5. Kliknij **Submit**

### 5.2. Skonfiguruj reverse proxy

1. Przejdź do **Website** → **List**
2. Kliknij **Settings** przy swojej domenie
3. Przejdź do zakładki **Reverse Proxy**
4. Kliknij **Add Reverse Proxy**
5. Wypełnij:
   - **Proxy Name**: `urlopy-proxy`
   - **Target URL**: `http://127.0.0.1:3000`
   - **Send Domain**: Włącz
   - **Cache**: Wyłącz (opcjonalnie)
6. Kliknij **Submit**

### 5.3. (Opcjonalnie) Włącz SSL

1. Przejdź do **SSL** w ustawieniach strony
2. Wybierz **Let's Encrypt** lub wgraj własny certyfikat
3. Włącz **Force HTTPS**

## Krok 6: Zarządzanie aplikacją

### Sprawdzanie logów

```bash
cd /www/wwwroot/urlopy-v2
docker-compose logs -f urlopy-app
```

### Restart aplikacji

```bash
docker-compose restart
```

### Zatrzymanie aplikacji

```bash
docker-compose down
```

### Aktualizacja aplikacji

```bash
cd /www/wwwroot/urlopy-v2

# Pobierz najnowsze zmiany (jeśli używasz Git)
git pull

# Zbuduj nowy obraz
docker-compose build

# Zatrzymaj stare kontenery
docker-compose down

# Uruchom nowe kontenery
docker-compose up -d

# Uruchom migracje (jeśli są nowe)
docker-compose -f docker-compose.prod.yml run --rm urlopy-app npm run prisma:migrate
```

### Backup bazy danych

```bash
# Backup SQLite
cp /www/wwwroot/urlopy-v2/prisma/prod.db /backup/urlopy-$(date +%Y%m%d).db
```

## Krok 7: Automatyczne uruchamianie przy starcie serwera

Docker Compose automatycznie uruchamia kontenery z flagą `restart: unless-stopped`, więc aplikacja powinna uruchomić się automatycznie po restarcie serwera.

Jeśli chcesz mieć pewność, możesz dodać do crontab:

```bash
crontab -e
```

Dodaj linię:

```
@reboot cd /www/wwwroot/urlopy-v2 && docker-compose up -d
```

## Rozwiązywanie problemów

### Aplikacja nie uruchamia się

1. Sprawdź logi: `docker-compose logs urlopy-app`
2. Sprawdź, czy port 3000 nie jest zajęty: `netstat -tulpn | grep 3000`
3. Sprawdź uprawnienia do plików: `ls -la /www/wwwroot/urlopy-v2`

### Baza danych nie działa

1. Sprawdź, czy plik bazy istnieje: `ls -la prisma/prod.db`
2. Uruchom migracje ręcznie: `docker-compose run --rm urlopy-app npx prisma migrate deploy`
3. Sprawdź uprawnienia: `chmod 644 prisma/prod.db`

### Reverse proxy nie działa

1. Sprawdź konfigurację w aaPanel
2. Sprawdź logi nginx: `tail -f /www/server/nginx/logs/error.log`
3. Upewnij się, że aplikacja działa: `curl http://localhost:3000`

## Bezpieczeństwo

1. **Zmiana domyślnego portu** (opcjonalnie): Jeśli nie chcesz używać portu 3000, zmień go w `docker-compose.yml` i zaktualizuj reverse proxy
2. **Firewall**: Upewnij się, że port 3000 jest dostępny tylko lokalnie (nie publicznie)
3. **Backup**: Regularnie rób backup bazy danych
4. **Logi**: Monitoruj logi aplikacji pod kątem podejrzanych aktywności

## Monitorowanie

Możesz użyć następujących komend do monitorowania:

```bash
# Status kontenerów
docker-compose ps

# Użycie zasobów
docker stats urlopy-v2

# Logi w czasie rzeczywistym
docker-compose logs -f urlopy-app
```

## Wsparcie

W razie problemów sprawdź:

- Logi aplikacji: `docker-compose logs urlopy-app`
- Logi Docker: `docker logs urlopy-v2`
- Logi nginx: `/www/server/nginx/logs/error.log`
