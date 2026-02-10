import { NextRequest, NextResponse } from "next/server";
import {
  loginUser,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - maksymalnie 5 prób logowania na 15 minut
    const identifier = getRateLimitIdentifier(request);
    const limitResult = rateLimit(identifier, 5, 15 * 60 * 1000);

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.",
          retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (limitResult.resetTime - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i hasło są wymagane" },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    if (!result.user) {
      return NextResponse.json(
        { error: result.error || "Nieprawidłowy email lub hasło" },
        { status: 401 }
      );
    }

    const token = createAuthToken(result.user);

    // Ustaw cookie z tokenem JWT
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
