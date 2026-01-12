import { NextRequest, NextResponse } from "next/server";
import {
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
} from "@/lib/leave-requests";
import { getCurrentUser } from "@/lib/auth";

// GET - pobierz wniosek po ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const leaveRequest = await getLeaveRequestById(id);
    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error fetching leave request:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

// PUT/PATCH - zaktualizuj wniosek urlopowy
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

    const body = await request.json();
    const { employee_email, start_date, end_date, description, status } = body;

    // Jeśli próbujemy zmienić status (akceptacja/odrzucenie), sprawdź uprawnienia
    if (status === "approved" || status === "rejected") {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (currentUser.role !== "leader") {
        return NextResponse.json(
          { error: "Only leaders can approve or reject leave requests" },
          { status: 403 }
        );
      }
    }

    const updatedRequest = await updateLeaveRequest(id, {
      employee_email,
      start_date,
      end_date,
      description,
      status,
    });

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating leave request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update leave request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - usuń wniosek urlopowy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Pobierz aktualnego użytkownika i wniosek
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leaveRequest = await getLeaveRequestById(id);
    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Sprawdź uprawnienia:
    // - Lider może usuwać wszystkie wnioski
    // - Employee może usuwać tylko swoje wnioski, które są pending lub rejected
    const isLeader = currentUser.role === "leader";
    const isOwner = leaveRequest.employee_email === currentUser.email;
    const canDeleteAsEmployee =
      isOwner &&
      (leaveRequest.status === "pending" || leaveRequest.status === "rejected");

    if (!isLeader && !canDeleteAsEmployee) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do usunięcia tego wniosku" },
        { status: 403 }
      );
    }

    const deleted = await deleteLeaveRequest(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
