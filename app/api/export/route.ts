import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLeaveRequestsByEmail, getAllLeaveRequests } from "@/lib/leave-requests";
import prisma from "@/lib/db";

// GET - eksportuj urlopy do CSV
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userIds = searchParams.get("userIds");

    let requests: any[] = [];

    if (currentUser.role === "leader" && userIds) {
      // Eksport dla wybranych użytkowników (lider)
      const userIdArray = userIds.split(",").map((id) => parseInt(id));
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIdArray,
          },
        },
      });

      for (const user of users) {
        const userRequests = await getLeaveRequestsByEmail(user.email);
        requests = requests.concat(userRequests);
      }
    } else if (currentUser.role === "leader") {
      // Eksport wszystkich urlopów (lider)
      requests = await getAllLeaveRequests();
    } else {
      // Eksport własnych urlopów (employee)
      requests = await getLeaveRequestsByEmail(currentUser.email);
    }

    // Konwertuj do CSV
    const headers = ["Email", "Data rozpoczęcia", "Data zakończenia", "Status", "Opis", "Data utworzenia"];
    const rows = requests.map((req) => [
      req.employee_email,
      req.start_date,
      req.end_date,
      req.status === "pending" ? "Oczekuje" : req.status === "approved" ? "Zaakceptowane" : "Odrzucone",
      req.description || "",
      req.created_at || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Zwróć CSV jako odpowiedź
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="urlopy_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leave requests:", error);
    return NextResponse.json(
      { error: "Failed to export leave requests" },
      { status: 500 }
    );
  }
}
