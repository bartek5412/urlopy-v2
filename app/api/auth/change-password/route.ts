import { NextRequest, NextResponse } from "next/server";
import { changePassword, getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      currentUser.id,
      currentPassword,
      newPassword
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Nie udało się zmienić hasła" },
        { status: 400 }
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
