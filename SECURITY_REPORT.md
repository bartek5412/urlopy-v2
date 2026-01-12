# Raport Bezpieczeństwa - Aplikacja URLOPY

## 🔴 KRYTYCZNE PROBLEMY

### 1. Hasła przechowywane w plain text

**Lokalizacja:** `lib/auth.ts` linie 30-34, 71-72

**Problem:**

- Hasła są przechowywane w bazie danych bez hashowania
- Porównywanie haseł odbywa się przez zwykłe porównanie stringów

**Ryzyko:**

- W przypadku wycieku bazy danych wszystkie hasła są widoczne
- Administrator bazy może zobaczyć wszystkie hasła

**Rekomendacja:**

```typescript
import bcrypt from "bcryptjs";

// Przy tworzeniu użytkownika:
const hashedPassword = await bcrypt.hash(password, 10);

// Przy logowaniu:
const isValid = await bcrypt.compare(password, user.password);
```

### 2. Brak walidacji i sanitizacji danych wejściowych

**Lokalizacja:** Wszystkie endpointy API

**Problem:**

- Brak walidacji formatu emaila
- Brak walidacji długości hasła
- Brak sanitizacji danych tekstowych (name, description)
- Brak walidacji zakresów liczbowych (daysAvailable, daysPerYear)

**Ryzyko:**

- Możliwość wprowadzenia nieprawidłowych danych
- Potencjalne problemy z XSS przy wyświetlaniu danych

**Rekomendacja:**

```typescript
// Walidacja emaila
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
}

// Walidacja hasła
if (password.length < 8) {
  return NextResponse.json(
    { error: "Password must be at least 8 characters" },
    { status: 400 }
  );
}

// Sanityzacja tekstu
import DOMPurify from "isomorphic-dompurify";
const sanitizedName = DOMPurify.sanitize(name);
```

### 3. Brak rate limiting

**Lokalizacja:** Wszystkie endpointy API, szczególnie `/api/auth/login`

**Problem:**

- Brak ograniczenia liczby prób logowania
- Możliwość brute force attack

**Ryzyko:**

- Atakujący może próbować zgadywać hasła bez limitu
- Możliwość DoS przez nadmierną liczbę requestów

**Rekomendacja:**

```typescript
// Użyj next-rate-limit lub podobnej biblioteki
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 5, // maksymalnie 5 prób
});
```

### 4. Middleware nie weryfikuje istnienia użytkownika

**Lokalizacja:** `middleware.ts` linia 5-11

**Problem:**

- Middleware sprawdza tylko obecność cookie `user_id`
- Nie weryfikuje czy użytkownik faktycznie istnieje w bazie

**Ryzyko:**

- Możliwość podrobienia cookie z nieistniejącym ID
- Brak weryfikacji czy sesja jest nadal ważna

**Rekomendacja:**

```typescript
// W middleware sprawdź czy użytkownik istnieje
const user = await prisma.user.findUnique({
  where: { id: parseInt(user_id.value) },
});
if (!user) {
  // Usuń nieprawidłowe cookie i przekieruj
}
```

## 🟡 ŚREDNIE PROBLEMY

### 5. Brak walidacji uprawnień w niektórych endpointach

**Lokalizacja:** `/api/leave-requests` GET endpoint

**Problem:**

- Endpoint GET `/api/leave-requests` zwraca wszystkie wnioski bez sprawdzania uprawnień
- Użytkownik może zobaczyć wnioski innych użytkowników

**Rekomendacja:**

```typescript
// Zawsze sprawdzaj uprawnienia przed zwróceniem danych
const currentUser = await getCurrentUser();
if (!currentUser) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Jeśli nie jest liderem, zwróć tylko jego wnioski
if (currentUser.role !== "leader") {
  return NextResponse.json(await getLeaveRequestsByEmail(currentUser.email));
}
```

### 6. Brak walidacji emaila w query params

**Lokalizacja:** `/api/leave-requests` GET endpoint linia 26

**Problem:**

- Możliwość podania dowolnego emaila w query params
- Użytkownik może próbować pobrać wnioski innych użytkowników

**Rekomendacja:**

```typescript
if (email) {
  const currentUser = await getCurrentUser();
  // Użytkownik może pobrać tylko swoje wnioski (chyba że jest liderem)
  if (
    currentUser &&
    currentUser.role !== "leader" &&
    email !== currentUser.email
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Walidacja formatu emaila
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }
}
```

### 7. Brak walidacji danych w PUT endpointach

**Lokalizacja:** `/api/users/[id]/route.ts`, `/api/leave-requests/[id]/route.ts`

**Problem:**

- Brak walidacji wartości liczbowych (mogą być ujemne lub zbyt duże)
- Brak walidacji roli (można ustawić nieprawidłową wartość)

**Rekomendacja:**

```typescript
// Walidacja roli
if (role && !["employee", "leader"].includes(role)) {
  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

// Walidacja dni urlopu
if (daysAvailable !== undefined && (daysAvailable < 0 || daysAvailable > 365)) {
  return NextResponse.json(
    { error: "Invalid daysAvailable value" },
    { status: 400 }
  );
}
```

### 8. Użycie localStorage dla wrażliwych danych

**Lokalizacja:** `app/leave-request/page.tsx`

**Problem:**

- localStorage może być dostępne dla skryptów XSS
- Przechowywanie ID powiadomionych wniosków w localStorage

**Rekomendacja:**

- Rozważyć użycie httpOnly cookies lub session storage
- Dodać walidację danych z localStorage przed użyciem

## 🟢 DROBNE PROBLEMY

### 9. Brak CSRF protection

**Problem:**

- Next.js ma domyślną ochronę CSRF, ale warto to zweryfikować

**Rekomendacja:**

- Upewnij się, że wszystkie POST/PUT/DELETE requesty używają odpowiednich nagłówków
- Rozważyć dodanie CSRF tokens dla krytycznych operacji

### 10. Brak logowania bezpieczeństwa

**Problem:**

- Brak logowania podejrzanych aktywności (nieudane logowania, próby dostępu do nieautoryzowanych zasobów)

**Rekomendacja:**

```typescript
// Loguj nieudane próby logowania
if (!user) {
  console.warn(
    `Failed login attempt for email: ${email} from IP: ${request.ip}`
  );
  // Rozważyć użycie dedykowanego systemu logowania
}
```

### 11. Brak timeout dla sesji

**Problem:**

- Cookie ma maxAge 7 dni, ale nie ma mechanizmu odświeżania sesji

**Rekomendacja:**

- Rozważyć krótszy czas życia sesji
- Dodać mechanizm odświeżania tokenów

### 12. Brak walidacji dat

**Problem:**

- Brak sprawdzania czy data końcowa jest po dacie początkowej
- Brak sprawdzania czy daty nie są w przeszłości (dla niektórych operacji)

**Rekomendacja:**

```typescript
if (new Date(end_date) < new Date(start_date)) {
  return NextResponse.json(
    { error: "End date must be after start date" },
    { status: 400 }
  );
}
```

## ✅ DOBRE PRAKTYKI (już zaimplementowane)

1. ✅ Użycie httpOnly cookies
2. ✅ Secure flag dla cookies w produkcji
3. ✅ SameSite protection dla cookies
4. ✅ Sprawdzanie uprawnień przed operacjami (DELETE, PUT)
5. ✅ Użycie Prisma ORM (ochrona przed SQL injection)
6. ✅ Walidacja ID przed użyciem (parseInt, isNaN)

## PRIORYTET NAPRAWY

1. **KRYTYCZNE (natychmiast):**

   - Hashowanie haseł (bcrypt)
   - Walidacja i sanitizacja danych wejściowych
   - Rate limiting dla logowania

2. **WYSOKIE (w ciągu tygodnia):**

   - Weryfikacja użytkownika w middleware
   - Walidacja uprawnień w GET endpointach
   - Walidacja emaila w query params

3. **ŚREDNIE (w ciągu miesiąca):**

   - Walidacja danych w PUT endpointach
   - Logowanie bezpieczeństwa
   - Poprawa mechanizmu sesji

4. **NISKIE (gdy będzie czas):**
   - CSRF protection
   - Timeout sesji
   - Walidacja dat
