import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - maksymalnie 5 prób zmiany hasła na 15 minut
    const identifier = getRateLimitIdentifier(request);
    const limitResult = rateLimit(identifier, 5, 15 * 60 * 1000);

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Zbyt wiele prób. Spróbuj ponownie za 15 minut.",
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

    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Brak autoryzacji" },
        { status: 401 }
      );
    }

    const parsedUserId = Number.parseInt(userId, 10);
    if (Number.isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: "Nieprawidłowa sesja" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Aktualne i nowe hasło są wymagane" },
        { status: 400 }
      );
    }

    const result = await changePassword(
      parsedUserId,
      currentPassword,
      newPassword
    );

    if (!result.ok) {
      const statusCode =
        result.error?.includes("nieprawidłowe") ||
        result.error?.includes("nie istnieje")
          ? 401
          : 400;

      return NextResponse.json(
        { error: result.error || "Nie udało się zmienić hasła" },
        { status: statusCode }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
