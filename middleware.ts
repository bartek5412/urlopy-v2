import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token");

  // Ochrona routes wymagających logowania
  // Middleware działa w Edge Runtime i nie może używać Prisma Client
  // Weryfikacja użytkownika w bazie jest wykonywana w API routes i layoutach
  if (request.nextUrl.pathname.startsWith("/leave-request")) {
    if (!authToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith("/list-requests")) {
    if (!authToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Przekieruj zalogowanych użytkowników ze strony logowania
  // (sprawdzamy tylko obecność cookie, weryfikacja w bazie jest w layoutach)
  if (request.nextUrl.pathname === "/" && authToken) {
    // Przekieruj do /leave-request - jeśli użytkownik nie istnieje,
    // weryfikacja w layoutzie/API route przekieruje z powrotem
    return NextResponse.redirect(new URL("/leave-request", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/leave-request/:path*", "/list-requests/:path*", "/"],
};
