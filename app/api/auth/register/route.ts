import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - maksymalnie 3 rejestracje na 15 minut
    const identifier = getRateLimitIdentifier(request);
    const limitResult = rateLimit(identifier, 3, 15 * 60 * 1000);
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Zbyt wiele prób rejestracji. Spróbuj ponownie za 15 minut.",
          retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i hasło są wymagane" },
        { status: 400 }
      );
    }

    const result = await createUser(email, password, name);

    if (!result.user) {
      const statusCode = result.error?.includes("już istnieje") ? 409 : 400;
      return NextResponse.json(
        { error: result.error || "Nie udało się utworzyć użytkownika" },
        { status: statusCode }
      );
    }

    // Automatyczne logowanie po rejestracji
    const cookieStore = await cookies();
    cookieStore.set("user_id", result.user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dni
    });

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    console.error("Error registering:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
