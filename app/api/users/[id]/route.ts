import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateRole, validateDaysAvailable, validateDaysPerYear, sanitizeString } from "@/lib/validation";

// PUT - zaktualizuj użytkownika
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "leader") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, role, leaderId, daysAvailable, daysPerYear } = body;

    const updateData: any = {};
    
    // Walidacja i sanityzacja nazwy
    if (name !== undefined) {
      updateData.name = name ? sanitizeString(name, 100) : null;
    }
    
    // Walidacja roli
    if (role !== undefined) {
      if (!validateRole(role)) {
        return NextResponse.json(
          { error: "Nieprawidłowa rola. Dozwolone wartości: employee, leader" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    
    // Walidacja leaderId
    if (leaderId !== undefined) {
      if (leaderId !== null && (isNaN(leaderId) || leaderId < 1)) {
        return NextResponse.json(
          { error: "Nieprawidłowe ID lidera" },
          { status: 400 }
        );
      }
      updateData.leaderId = leaderId || null;
    }
    
    // Walidacja daysAvailable
    if (daysAvailable !== undefined) {
      const validation = validateDaysAvailable(daysAvailable);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      updateData.daysAvailable = daysAvailable;
    }
    
    // Walidacja daysPerYear
    if (daysPerYear !== undefined) {
      const validation = validateDaysPerYear(daysPerYear);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      updateData.daysPerYear = daysPerYear;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || undefined,
      role: updatedUser.role || "employee",
      leaderId: updatedUser.leaderId || null,
      daysAvailable: updatedUser.daysAvailable ?? 26,
      daysPerYear: updatedUser.daysPerYear ?? 26,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
