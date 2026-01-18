# Konfiguracja Google Calendar API

## Wymagania

1. Biblioteka `jsonwebtoken` - należy ją zainstalować:
   ```bash
   npm install jsonwebtoken
   npm install --save-dev @types/jsonwebtoken
   ```

2. Konto Google Cloud i włączone API Google Calendar

## Kroki konfiguracji

### 1. Utwórz projekt w Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Google Calendar API** dla projektu

### 2. Utwórz Service Account

1. W Google Cloud Console przejdź do **IAM & Admin** > **Service Accounts**
2. Kliknij **Create Service Account**
3. Podaj nazwę i opis (np. "Leave Management Calendar")
4. Kliknij **Create and Continue**
5. Pomiń rolę (kliknij **Continue**)
6. Kliknij **Done**

### 3. Utwórz klucz prywatny

1. W liście Service Accounts znajdź utworzone konto
2. Kliknij na nie, a następnie przejdź do zakładki **Keys**
3. Kliknij **Add Key** > **Create new key**
4. Wybierz **JSON** i kliknij **Create**
5. Plik JSON zostanie pobrany - **Zachowaj go bezpiecznie!**

### 4. Udostępnij kalendarz Service Account

1. Otwórz pobrany plik JSON i znajdź pole `client_email` (np. `leave-calendar@project-id.iam.gserviceaccount.com`)
2. Otwórz [Google Calendar](https://calendar.google.com/)
3. Po lewej stronie znajdź kalendarz, do którego chcesz dodawać wydarzenia
4. Kliknij na trzy kropki obok nazwy kalendarza > **Settings and sharing**
5. W sekcji **Share with specific people** kliknij **Add people**
6. Wpisz adres email z `client_email` i nadaj uprawnienia **Make changes to events**
7. Kliknij **Send**

### 5. Skonfiguruj zmienne środowiskowe

Dodaj następujące zmienne do pliku `.env`:

```env
# Google Calendar API - Service Account Email
GOOGLE_CALENDAR_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com

# Google Calendar API - Private Key (ze ściągniętego pliku JSON, pole "private_key")
# UWAGA: Usuń cudzysłowy i nowe linie (\n), zostaw tylko ciągły tekst
GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n

# Google Calendar ID (może być "primary" dla głównego kalendarza lub ID kalendarza)
GOOGLE_CALENDAR_ID=primary
```

**UWAGA:** Jeśli kopiujesz klucz prywatny z pliku JSON:
- W pliku JSON może być zapisany jako: `"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBA...\\n-----END PRIVATE KEY-----\\n"`
- W `.env` powinien być jako: `GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n`
- Lub możesz użyć pojedynczego stringa bez `\n` - kod automatycznie zamieni `\\n` na `\n`

### 6. Uruchom migrację bazy danych

```bash
npx prisma migrate deploy
npx prisma generate
```

## Testowanie

Po skonfigurowaniu:
1. Zaakceptuj wniosek urlopowy jako lider
2. Sprawdź czy wydarzenie pojawiło się w kalendarzu Google
3. Usuń wniosek - wydarzenie powinno zostać usunięte z kalendarza

## Rozwiązywanie problemów

### Błąd: "Google Calendar credentials not configured"
- Sprawdź czy zmienne środowiskowe są poprawnie ustawione
- Upewnij się, że nazwy zmiennych są dokładnie takie same jak w dokumentacji

### Błąd: "Insufficient Permission" lub "Forbidden"
- Upewnij się, że udostępniłeś kalendarz Service Account
- Sprawdź czy email Service Account jest poprawny

### Wydarzenie nie jest tworzone/usuwane
- Sprawdź logi serwera (konsola) - mogą zawierać szczegóły błędów
- Upewnij się, że Google Calendar API jest włączone w projekcie
