# Instrukcja uruchomienia lokalnie na Dockerze

## Krok 1: Utwórz plik .env

Utwórz plik `.env` w katalogu głównym projektu (na tym samym poziomie co `docker-compose.yml`):

```bash
# Database
DATABASE_URL=file:./prisma/prod.db

# Google Calendar API - Service Account
# Wartości z pliku gothic-imprint-484700-j0-43b197b19070.json:
GOOGLE_CALENDAR_CLIENT_EMAIL=calendarcp@gothic-imprint-484700-j0.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZHUmvdSGyMRUx\nLYjTpYfRvp0nNXhhqiVeP6LyYbD5mLOSGNoxSIhoqREOYlgVRfntq4x+sEwQfguu\nFKKQ8rtVI8bUfgcyQ14LAVJVLbsyWxZ/Ey/8+Q+6qFBUoA2vHvRcewgAq+1tNhMQ\n/uZkacmtYa50FC2bEPAmE+yzLoT3MUy11q7vz58KCSKdA+nlFzaOMaz5nA1PyZDP\nI8OvK4NOmVDxQpoWXuaIxkn6Y0aTMT0s3DF6TJE1+gzlXnkPeqMmRoCqooGE5QEp\n8d+ztGuvf34l1IpSOpXJ4qxZ37AIwxyj3WkE+qNDCkhSlNJfH2PboU2tmt8bt6Bv\nw5uSFmEBAgMBAAECggEAPpwOirV5cRxsYxEhev8qKpcQVKU7wNZDDmnFgKYhVeju\nJ7xY94tWIvBWRdKgWgoi56Hn0wTd+oeOsLWsp6YH1aaKiO6K/riknwHTj1Kvv/a6\nhwyucwITwh0VhUHekFiZ2S11glQSFMNaPjVzlRNYoFIh78F94VDCIAjw4j8RAwNB\nawMgrCkDp79OflsXOErL0jW47qdf+ib3h97l2+nXnflmPxFAGPvu1JVAbwjJSgDy\nuPOemEjW8sCliGcTTs22T7x0m+XtAlNBDebTG+qZpocE2xTe4usB79EGHYmNub4\nlVaFkWpMqMOm27/rtOx1ZVl9v4oXPMxwyCzLc33ADQKBgQD1K4wPn7fgL4m0Ifsc\nZxWqqwDeY9TZ5uaCKxuxkuZKBc5b1wx94f4pUqqzCEkOj82FTcZv9AoivC7rhmgN\nbzs6G3Tv91W+D9DIF3ukooPNw9pxd12iwlytSqpamQVTBibwXu7VjDVmz/frkkuL\ne9amWq+yHO9nRxx/ckSuYoRVtwKBgQDitHqa/OY9D9rSMeueE71o+upTqpf8THgG\nADRCrJ4JIcR3T4+lG5NH1LoIiTcUjbAUOjBMUJoTs0NJ/hg89pS4UabeSPJwX4Oi\nscOmogVaqZpCC1eBxJIuE1MWd7B8A/08GZkMwr7JkVCmh3AeqMO3nSk2Hvul5qBI\nK2hrK6A/BwKBgF9GOPupWc9pKd4yhl8XQDg+k+vYZ9L2BAX5sp1jNNL3RqYx/8y7\nkgWE9oj0Y0+hWoC/JKpE79tnveQRK0ZtP1rpaJwIRe3CP6RCW+4yqX3A6pbFiEHD\nvjgpl+H1LTiCX4dxnOanwejeUL3e8DSYP2YOP9C7pd1AqTZttXr/FeYpAoGABjg5\nXOMvVeGHeVjRRAb6nVS09RKrFMrsSA3dYS7nLwz0HOnb4QW+pqvZZr6M+k1g1U07\nYfycHYo/gFouRA3nyp7C2zpZHGgibmY+HeY4C2K3zrQM9Ix2DjmNgAJMnzpkyi9R\nmZ4GKfWIpuj0VIMAy5rONKPo94Y6Q4CdXsNVpCUCgYA7VEVU1XvPm5KZHnoi+d3H\n2fYr3xh31q/+PozJ3D0FPBQYbphocoV+6rYI0DjolIbU3JWPgHf6jFa2obC9nZM1\nHQqqUQ0jEytAVu2uuigB2K7H3Aoy4g3EFycPEGpTDFcDaVDpfiPTTVUbHZvte9mX\nmY7RaB+cWdQ5Dg3R4ZVtoA==\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

**UWAGA:** 
- Wartość `GOOGLE_CALENDAR_PRIVATE_KEY` może być w cudzysłowach (jak powyżej) lub bez, jeśli używasz .env który obsługuje wieloliniowe wartości
- Kod automatycznie zamienia `\n` na rzeczywiste znaki nowej linii
- Jeśli masz problemy, możesz też użyć wartości bez `\n` - po prostu jedną linię

## Krok 2: Udostępnij kalendarz Service Account

**WAŻNE:** Przed uruchomieniem musisz udostępnić kalendarz Google Service Account:

1. Otwórz [Google Calendar](https://calendar.google.com/)
2. Po lewej stronie znajdź kalendarz, do którego chcesz dodawać wydarzenia (lub użyj "primary")
3. Kliknij na trzy kropki obok nazwy kalendarza > **Settings and sharing**
4. W sekcji **Share with specific people** kliknij **Add people**
5. Wpisz: `calendarcp@gothic-imprint-484700-j0.iam.gserviceaccount.com`
6. Nadaj uprawnienia **Make changes to events**
7. Kliknij **Send**

## Krok 3: Zbuduj i uruchom kontener Docker

```bash
# Zbuduj obraz (pierwszy raz lub po zmianach w kodzie)
docker-compose build

# Uruchom kontener w tle
docker-compose up -d

# Lub uruchom w trybie interaktywnym (zobaczysz logi)
docker-compose up
```

## Krok 4: Sprawdź czy działa

Aplikacja powinna być dostępna pod adresem: http://localhost:3000

Możesz sprawdzić logi:
```bash
docker-compose logs -f
```

## Przydatne komendy

```bash
# Zatrzymaj kontener
docker-compose down

# Zatrzymaj i usuń wolumeny (UWAGA: usunie bazę danych!)
docker-compose down -v

# Odbuduj obraz od zera
docker-compose build --no-cache

# Zobacz logi
docker-compose logs -f urlopy-app

# Wejdź do kontenera (do debugowania)
docker-compose exec urlopy-app sh
```

## Rozwiązywanie problemów

### Błąd: "Google Calendar credentials not configured"
- Sprawdź czy plik `.env` istnieje i zawiera wszystkie zmienne
- Sprawdź czy Docker używa zmiennych z `.env` (docker-compose.yml ma `env_file: - .env`)

### Wydarzenia nie są tworzone
- Upewnij się, że udostępniłeś kalendarz Service Account (krok 2)
- Sprawdź logi: `docker-compose logs -f urlopy-app`
- Sprawdź czy Google Calendar API jest włączone w Google Cloud Console

### Baza danych nie jest zapisywana
- Sprawdź czy wolumeny są prawidłowo zamontowane w `docker-compose.yml`
- Pliki bazy danych powinny być w katalogu `./prisma/` na hoście
