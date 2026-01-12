import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const user_id = request.cookies.get("user_id");

  // Ochrona routes wymagających logowania
  // Middleware działa w Edge Runtime i nie może używać Prisma Client
  // Weryfikacja użytkownika w bazie jest wykonywana w API routes i layoutach
  if (request.nextUrl.pathname.startsWith("/leave-request")) {
    if (!user_id) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    // Podstawowa walidacja formatu cookie (tylko sprawdza czy jest liczbą)
    const userId = parseInt(user_id.value);
    if (isNaN(userId)) {
      // Nieprawidłowe ID - usuń cookie i przekieruj
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("user_id");
      return response;
    }
  }

  // Przekieruj zalogowanych użytkowników ze strony logowania
  // (sprawdzamy tylko obecność cookie, weryfikacja w bazie jest w layoutach)
  if (request.nextUrl.pathname === "/" && user_id) {
    const userId = parseInt(user_id.value);
    if (!isNaN(userId)) {
      // Przekieruj do /leave-request - jeśli użytkownik nie istnieje,
      // weryfikacja w layoutzie/API route przekieruje z powrotem
      return NextResponse.redirect(new URL("/leave-request", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/leave-request/:path*", "/"],
};
