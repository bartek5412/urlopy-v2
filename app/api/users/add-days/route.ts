import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

// POST - dodaj dni urlopu do użytkowników
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "leader") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userIds, days } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid userIds array" },
        { status: 400 }
      );
    }

    if (!days || isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: "Invalid days value" },
        { status: 400 }
      );
    }

    // Zaktualizuj dni urlopu dla wszystkich wybranych użytkowników
    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map((id: string | number) => parseInt(id.toString())),
        },
      },
      data: {
        daysAvailable: {
          increment: days,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding days:", error);
    return NextResponse.json(
      { error: "Failed to add days" },
      { status: 500 }
    );
  }
}
