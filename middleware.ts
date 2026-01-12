import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function middleware(request: NextRequest) {
  const user_id = request.cookies.get("user_id");

  // Ochrona routes wymagających logowania
  if (request.nextUrl.pathname.startsWith("/leave-request")) {
    if (!user_id) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Weryfikuj czy użytkownik faktycznie istnieje w bazie
    try {
      const userId = parseInt(user_id.value);
      if (isNaN(userId)) {
        // Nieprawidłowe ID - usuń cookie i przekieruj
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("user_id");
        return response;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }, // Tylko sprawdź czy istnieje, nie pobieraj wszystkich danych
      });

      if (!user) {
        // Użytkownik nie istnieje - usuń cookie i przekieruj
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("user_id");
        return response;
      }
    } catch (error) {
      // W przypadku błędu, usuń cookie i przekieruj
      console.error("Error verifying user in middleware:", error);
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("user_id");
      return response;
    }
  }

  // Przekieruj zalogowanych użytkowników ze strony logowania
  if (request.nextUrl.pathname === "/" && user_id) {
    // Sprawdź czy użytkownik istnieje przed przekierowaniem
    try {
      const userId = parseInt(user_id.value);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (user) {
          return NextResponse.redirect(new URL("/leave-request", request.url));
        } else {
          // Użytkownik nie istnieje - usuń cookie
          const response = NextResponse.next();
          response.cookies.delete("user_id");
          return response;
        }
      }
    } catch (error) {
      // W przypadku błędu, kontynuuj normalnie
      console.error("Error checking user in middleware:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/leave-request/:path*", "/"],
};
