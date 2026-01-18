import { NextRequest, NextResponse } from "next/server";
import {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestsByEmail,
  getLeaveRequestsByStatus,
  checkDateConflict,
  calculateLeaveDays,
  getUsedLeaveDays,
} from "@/lib/leave-requests";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateEmail, validateDateRange, sanitizeString } from "@/lib/validation";

// GET - pobierz wszystkie wnioski, dla konkretnego emaila lub o określonym statusie
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const status = searchParams.get("status") as
      | "pending"
      | "approved"
      | "rejected"
      | null;

    if (email) {
      // Walidacja emaila
      if (!validateEmail(email)) {
        return NextResponse.json(
          { error: "Nieprawidłowy format emaila" },
          { status: 400 }
        );
      }

      // Sprawdź uprawnienia - użytkownik może pobrać tylko swoje wnioski (chyba że jest liderem)
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (currentUser.role !== "leader" && email !== currentUser.email) {
        return NextResponse.json(
          { error: "Forbidden - możesz pobrać tylko swoje wnioski" },
          { status: 403 }
        );
      }

      const requests = await getLeaveRequestsByEmail(email);
      // Jeśli podano również status, filtruj wyniki
      if (status) {
        const filtered = requests.filter((req) => req.status === status);
        return NextResponse.json(filtered);
      }
      return NextResponse.json(requests);
    }

    // Jeśli podano status, zwróć tylko wnioski o tym statusie
    if (status) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      let requests = await getLeaveRequestsByStatus(status);

      // Jeśli użytkownik jest liderem i ma przypisanych pracowników (leaderId), filtruj wnioski
      if (
        currentUser &&
        currentUser.role === "leader" &&
        status === "pending"
      ) {
        // Sprawdź, czy są pracownicy z tym liderem używając raw query
        try {
          const employeesWithLeader = await prisma.$queryRaw<
            Array<{ email: string }>
          >`
            SELECT email FROM users WHERE leader_id = ${currentUser.id}
          `;

          if (employeesWithLeader.length > 0) {
            // Jeśli lider ma przypisanych pracowników, pokaż tylko ich wnioski
            const employeeEmails = employeesWithLeader.map((e) => e.email);
            requests = requests.filter((req) =>
              employeeEmails.includes(req.employee_email)
            );
          }
          // Jeśli nie ma przypisanych pracowników, pokaż wszystkie (zachowanie domyślne)
        } catch (error) {
          console.error("Error fetching employees with leader:", error);
          // W przypadku błędu, pokaż wszystkie wnioski
        }
      }

      return NextResponse.json(requests);
    }

    // Jeśli nie podano emaila ani statusu, sprawdź uprawnienia
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Tylko liderzy mogą pobrać wszystkie wnioski
    if (currentUser.role !== "leader") {
      return NextResponse.json(
        { error: "Forbidden - tylko liderzy mogą pobrać wszystkie wnioski" },
        { status: 403 }
      );
    }

    const requests = await getAllLeaveRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

// POST - utwórz nowy wniosek urlopowy
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { employee_email, start_date, end_date, description } = body;

    if (!employee_email || !start_date || !end_date) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: employee_email, start_date, end_date",
        },
        { status: 400 }
      );
    }

    // Walidacja emaila
    if (!validateEmail(employee_email)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format emaila" },
        { status: 400 }
      );
    }

    // Walidacja dat
    const dateValidation = validateDateRange(start_date, end_date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Sanityzacja opisu
    const sanitizedDescription = description ? sanitizeString(description, 500) : undefined;

    // Sprawdź uprawnienia - użytkownik może tworzyć tylko swoje wnioski
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.email !== employee_email && currentUser.role !== "leader") {
      return NextResponse.json(
        { error: "Forbidden - możesz tworzyć tylko swoje wnioski" },
        { status: 403 }
      );
    }

    // Walidacja: nie można wysłać wniosku jeśli do terminu urlopu jest mniej niż 2 dni
    const startDate = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const daysUntilStart = Math.floor(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // if (daysUntilStart < 2) {
    //   return NextResponse.json(
    //     {
    //       error:
    //         "Nie można wysłać wniosku - termin urlopu musi być co najmniej 2 dni od dzisiaj",
    //     },
    //     { status: 400 }
    //   );
    // }

    // Sprawdź konflikty dat przed utworzeniem wniosku
    const hasConflict = await checkDateConflict(
      employee_email,
      start_date,
      end_date
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: "Masz już urlop w wybranym terminie" },
        { status: 409 }
      );
    }

    // Sprawdź dostępne dni urlopu
    const user = await prisma.user.findUnique({
      where: { email: employee_email },
    });

    if (user) {
      const requestedDays = calculateLeaveDays(start_date, end_date);
      const usedDays = await getUsedLeaveDays(employee_email);
      const availableDays = user.daysAvailable ?? 26;

      if (usedDays + requestedDays > availableDays) {
        return NextResponse.json(
          {
            error: `Nie masz wystarczającej liczby dni urlopu. Dostępne: ${
              availableDays - usedDays
            }, Wymagane: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    }

    const newRequest = await createLeaveRequest({
      employee_email: employee_email.toLowerCase().trim(),
      start_date,
      end_date,
      description: sanitizedDescription,
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create leave request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
