# Konfiguracja automatycznego wdrożenia (GitHub Actions)

## Wymagania

1. Repozytorium GitHub z kodem aplikacji
2. VPS z zainstalowanym Docker i Docker Compose
3. Dostęp SSH do VPS (klucz SSH)

## Kroki konfiguracji

### 1. Przygotuj VPS

Na VPS utwórz katalog projektu i przygotuj strukturę:

```bash
sudo mkdir -p /opt/urlopy-v2
sudo chown $USER:$USER /opt/urlopy-v2
cd /opt/urlopy-v2

# Utwórz podstawowy docker-compose.prod.yml (lub skopiuj go później)
# Utwórz plik .env z zmiennymi środowiskowymi
```

### 2. Utwórz klucz SSH (jeśli nie masz)

```bash
# Na lokalnym komputerze lub bezpośrednio na GitHub
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/vps_deploy_key

# Skopiuj klucz publiczny na VPS
ssh-copy-id -i ~/.ssh/vps_deploy_key.pub user@vps-ip

# Wyświetl klucz prywatny (będzie potrzebny dla GitHub Secrets)
cat ~/.ssh/vps_deploy_key
```

### 3. Konfiguracja GitHub Secrets

W repozytorium GitHub przejdź do: **Settings** > **Secrets and variables** > **Actions**

Dodaj następujące secrets:

| Secret Name | Wartość | Opis |
|------------|---------|------|
| `VPS_HOST` | `twoja-vps-ip` lub `vps.example.com` | Adres IP lub domena VPS |
| `VPS_USERNAME` | `root` lub `ubuntu` | Nazwa użytkownika SSH |
| `VPS_SSH_KEY` | Zawartość `~/.ssh/vps_deploy_key` | Prywatny klucz SSH |
| `VPS_PORT` | `22` (opcjonalnie) | Port SSH (domyślnie 22) |

### 4. Przygotuj pliki na VPS

Na VPS musi być plik `.env` w katalogu `/opt/urlopy-v2/`:

```bash
# Na VPS
cd /opt/urlopy-v2
nano .env
```

Dodaj:
```env
DATABASE_URL=file:./prisma/prod.db
GOOGLE_CALENDAR_CLIENT_EMAIL=calendarcp@gothic-imprint-484700-j0.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=primary
```

**WAŻNE:** Upewnij się, że folder `prisma/` z migracjami jest już na VPS (zostanie skopiowany automatycznie podczas pierwszego deploy).

### 5. Automatyczne wdrożenie

Po skonfigurowaniu, każde push do gałęzi `main` (lub innej skonfigurowanej) automatycznie:

1. Zbuduje obraz Docker
2. Skopiuje obraz i pliki na VPS
3. Zaimportuje obraz i uruchomi kontener

Możesz też uruchomić deployment ręcznie:
- W GitHub: **Actions** > **Deploy to VPS** > **Run workflow**

## Uruchomienie ręczne na VPS (bez GitHub Actions)

Jeśli nie chcesz używać GitHub Actions, możesz użyć skryptu:

```bash
# deploy.sh
#!/bin/bash
cd /opt/urlopy-v2
git pull origin main  # lub skopiuj pliki ręcznie
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --force-recreate
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## Monitorowanie wdrożenia

### W GitHub:
- Przejdź do zakładki **Actions** w repozytorium
- Zobacz logi każdego wdrożenia

### Na VPS:
```bash
# Sprawdź status kontenerów
docker-compose -f docker-compose.prod.yml ps

# Zobacz logi
docker-compose -f docker-compose.prod.yml logs -f

# Sprawdź ostatnie wdrożenie
docker images | grep urlopy
```

## Rozwiązywanie problemów

### Błąd: "Permission denied (publickey)"
- Sprawdź czy klucz SSH jest poprawnie skonfigurowany w GitHub Secrets
- Upewnij się, że klucz publiczny jest na VPS: `cat ~/.ssh/authorized_keys`

### Błąd: "Cannot connect to Docker daemon"
- Upewnij się, że użytkownik ma uprawnienia do Docker: `sudo usermod -aG docker $USER`
- Sprawdź czy Docker jest uruchomiony: `sudo systemctl status docker`

### Błąd: "File .env not found"
- Utwórz plik `.env` ręcznie na VPS w katalogu `/opt/urlopy-v2/`
- Upewnij się, że zawiera wszystkie wymagane zmienne

### Baza danych nie jest zapisywana
- Sprawdź uprawnienia do folderu `prisma/`: `ls -la /opt/urlopy-v2/prisma/`
- Upewnij się, że wolumeny są prawidłowo zamontowane w `docker-compose.prod.yml`

## Backup przed wdrożeniem (opcjonalne)

Możesz dodać krok backupu w workflow:

```yaml
- name: Backup database before deployment
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USERNAME }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /opt/urlopy-v2
      docker-compose -f docker-compose.prod.yml exec -T urlopy-app cp /app/prisma/prod.db /app/prisma/prod.db.backup.$(date +%Y%m%d_%H%M%S) || true
```

## Zmiana gałęzi wdrożenia

Domyślnie workflow wdraża z gałęzi `main`. Aby zmienić:

W pliku `.github/workflows/deploy.yml` zmień:
```yaml
branches:
  - main  # Zmień na swoją gałąź, np. 'master', 'production'
```
