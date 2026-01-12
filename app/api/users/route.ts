import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - pobierz wszystkich użytkowników (tylko dla lidera)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "leader") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const leaders = users.filter((u) => u.role === "leader");

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
        role: u.role || "employee",
        leaderId: u.leaderId || null,
        daysAvailable: u.daysAvailable ?? 26,
        daysPerYear: u.daysPerYear ?? 26,
      })),
      leaders: leaders.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
