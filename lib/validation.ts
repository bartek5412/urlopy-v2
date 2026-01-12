// Funkcje walidacji danych wejściowych

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Hasło jest wymagane" };
  }
  if (password.length < 8) {
    return { valid: false, error: "Hasło musi mieć co najmniej 8 znaków" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Hasło nie może mieć więcej niż 128 znaków" };
  }
  return { valid: true };
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input) return "";
  // Usuń niebezpieczne znaki HTML/JS
  let sanitized = input
    .replace(/[<>]/g, "") // Usuń < i >
    .trim();
  
  // Ogranicz długość
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: "Nieprawidłowa data rozpoczęcia" };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: "Nieprawidłowa data zakończenia" };
  }
  if (end < start) {
    return { valid: false, error: "Data zakończenia musi być po dacie rozpoczęcia" };
  }
  
  return { valid: true };
}

export function validateRole(role: string): boolean {
  return role === "employee" || role === "leader";
}

export function validateDaysAvailable(days: number): { valid: boolean; error?: string } {
  if (isNaN(days) || days < 0 || days > 365) {
    return { valid: false, error: "Dostępne dni urlopu muszą być między 0 a 365" };
  }
  return { valid: true };
}

export function validateDaysPerYear(days: number): { valid: boolean; error?: string } {
  if (isNaN(days) || days < 0 || days > 365) {
    return { valid: false, error: "Dni urlopu na rok muszą być między 0 a 365" };
  }
  return { valid: true };
}
