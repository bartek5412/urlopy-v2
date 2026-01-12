// Prosty rate limiter używający Map do przechowywania prób

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Wyczyść stare wpisy co 15 minut
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 15 * 60 * 1000);

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minut
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Nowy wpis lub okno czasowe wygasło
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Przekroczono limit
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Zwiększ licznik
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Funkcja pomocnicza do uzyskania identyfikatora z requestu
export function getRateLimitIdentifier(request: Request): string {
  // Użyj IP adresu jako identyfikatora
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
  return ip;
}
