import prisma from "./db";
import { isPolishHoliday } from "./polish-holidays";
import { createCalendarEvent, deleteCalendarEvent } from "./google-calendar";

export interface LeaveRequest {
  id?: number;
  employee_email: string;
  start_date: string;
  end_date: string;
  description?: string;
  status?: "pending" | "approved" | "rejected";
  google_calendar_event_id?: string;
  created_at?: string | Date;
}

// Pobierz wszystkie wnioski urlopowe
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  const requests = await prisma.leaveRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((req) => ({
    id: req.id,
    employee_email: req.employeeEmail,
    start_date: req.startDate,
    end_date: req.endDate,
    description: req.description || undefined,
    status: req.status as "pending" | "approved" | "rejected",
    created_at: req.createdAt,
  }));
}

// Pobierz wniosek po ID
export async function getLeaveRequestById(
  id: number
): Promise<LeaveRequest | undefined> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
  });

  if (!request) return undefined;

  return {
    id: request.id,
    employee_email: request.employeeEmail,
    start_date: request.startDate,
    end_date: request.endDate,
    description: request.description || undefined,
    status: request.status as "pending" | "approved" | "rejected",
    created_at: request.createdAt,
  };
}

// Pobierz wnioski dla konkretnego pracownika
export async function getLeaveRequestsByEmail(
  email: string
): Promise<LeaveRequest[]> {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeEmail: email,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((req) => ({
    id: req.id,
    employee_email: req.employeeEmail,
    start_date: req.startDate,
    end_date: req.endDate,
    description: req.description || undefined,
    status: req.status as "pending" | "approved" | "rejected",
    created_at: req.createdAt,
  }));
}

// Pobierz wnioski o określonym statusie
export async function getLeaveRequestsByStatus(
  status: "pending" | "approved" | "rejected"
): Promise<LeaveRequest[]> {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      status: status,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((req) => ({
    id: req.id,
    employee_email: req.employeeEmail,
    start_date: req.startDate,
    end_date: req.endDate,
    description: req.description || undefined,
    status: req.status as "pending" | "approved" | "rejected",
    created_at: req.createdAt,
  }));
}

// Oblicz liczbę dni urlopu między datami (bez weekendów)
export function calculateLeaveDays(startDate: string, endDate: string): number {
  // Parsuj daty w formacie YYYY-MM-DD w lokalnej strefie czasowej
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };
  
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  // Funkcja sprawdzająca czy dzień to weekend (sobota=6, niedziela=0)
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  
  let daysCount = 0;
  const currentDate = new Date(start);
  
  // Iteruj przez wszystkie dni w zakresie (włącznie z dniem końcowym)
  while (currentDate <= end) {
    // Zliczaj tylko dni robocze (bez weekendów i świąt)
    if (!isWeekend(currentDate) && !isPolishHoliday(currentDate)) {
      daysCount++;
    }
    // Przejdź do następnego dnia
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`[calculateLeaveDays] ${startDate} to ${endDate}: ${daysCount} dni roboczych (włączając weekendy byłoby ${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1})`);
  
  return daysCount;
}

// Oblicz wykorzystane dni urlopu dla użytkownika
export async function getUsedLeaveDays(email: string): Promise<number> {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeEmail: email,
      status: "approved", // Tylko zaakceptowane urlopy
    },
  });

  let totalDays = 0;
  for (const request of requests) {
    totalDays += calculateLeaveDays(request.startDate, request.endDate);
  }

  return totalDays;
}

// Sprawdź, czy istnieją konflikty dat dla użytkownika
export async function checkDateConflict(
  email: string,
  startDate: string,
  endDate: string,
  excludeId?: number
): Promise<boolean> {
  const existingRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeEmail: email,
      status: {
        in: ["pending", "approved"], // Sprawdzaj tylko pending i approved
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  for (const request of existingRequests) {
    const existingStart = new Date(request.startDate);
    const existingEnd = new Date(request.endDate);

    // Sprawdź, czy daty się nakładają
    if (
      (newStart >= existingStart && newStart <= existingEnd) ||
      (newEnd >= existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return true; // Konflikt znaleziony
    }
  }

  return false; // Brak konfliktu
}

// Utwórz nowy wniosek urlopowy
export async function createLeaveRequest(
  request: Omit<LeaveRequest, "id" | "created_at">
): Promise<LeaveRequest> {
  const newRequest = await prisma.leaveRequest.create({
    data: {
      employeeEmail: request.employee_email,
      startDate: request.start_date,
      endDate: request.end_date,
      description: request.description || null,
      status: request.status || "pending",
    },
  });

  return {
    id: newRequest.id,
    employee_email: newRequest.employeeEmail,
    start_date: newRequest.startDate,
    end_date: newRequest.endDate,
    description: newRequest.description || undefined,
    status: newRequest.status as "pending" | "approved" | "rejected",
    created_at: newRequest.createdAt,
  };
}

// Zaktualizuj status wniosku
export async function updateLeaveRequestStatus(
  id: number,
  status: "pending" | "approved" | "rejected"
): Promise<LeaveRequest | undefined> {
  // Pobierz obecny wniosek aby sprawdzić poprzedni status i eventId
  const currentRequest = await prisma.leaveRequest.findUnique({
    where: { id },
  });

  if (!currentRequest) {
    return undefined;
  }

  const oldStatus = currentRequest.status;
  const googleCalendarEventId = currentRequest.googleCalendarEventId;

  // Jeśli zmieniamy status z "approved" na inny, usuń wydarzenie z Google Calendar
  if (oldStatus === "approved" && status !== "approved" && googleCalendarEventId) {
    try {
      await deleteCalendarEvent(googleCalendarEventId);
    } catch (error) {
      console.error("Error deleting calendar event:", error);
    }
  }

  const updateData: any = { status };
  
  // Jeśli zmieniamy status na "approved", utwórz wydarzenie w Google Calendar
  if (status === "approved" && oldStatus !== "approved") {
    // Pobierz informacje o użytkowniku
    const user = await prisma.user.findUnique({
      where: { email: currentRequest.employeeEmail },
    });

    try {
      const eventId = await createCalendarEvent(
        currentRequest.startDate,
        currentRequest.endDate,
        currentRequest.employeeEmail,
        user?.name || undefined,
        currentRequest.description || undefined
      );
      
      if (eventId) {
        updateData.googleCalendarEventId = eventId;
      }
    } catch (error) {
      console.error("Error creating calendar event:", error);
    }
  }

  // Jeśli zmieniamy status z "approved" na inny, usuń eventId z bazy
  if (oldStatus === "approved" && status !== "approved") {
    updateData.googleCalendarEventId = null;
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id },
    data: updateData,
  });

  return {
    id: updatedRequest.id,
    employee_email: updatedRequest.employeeEmail,
    start_date: updatedRequest.startDate,
    end_date: updatedRequest.endDate,
    description: updatedRequest.description || undefined,
    status: updatedRequest.status as "pending" | "approved" | "rejected",
    created_at: updatedRequest.createdAt,
  };
}

// Zaktualizuj wniosek urlopowy
export async function updateLeaveRequest(
  id: number,
  request: Partial<Omit<LeaveRequest, "id" | "created_at">>
): Promise<LeaveRequest | undefined> {
  // Pobierz obecny wniosek aby sprawdzić poprzedni status i eventId
  const currentRequest = await prisma.leaveRequest.findUnique({
    where: { id },
  });

  if (!currentRequest) {
    return undefined;
  }

  const oldStatus = currentRequest.status;
  const newStatus = request.status;
  const googleCalendarEventId = currentRequest.googleCalendarEventId;

  const updateData: any = {};

  if (request.employee_email !== undefined)
    updateData.employeeEmail = request.employee_email;
  if (request.start_date !== undefined)
    updateData.startDate = request.start_date;
  if (request.end_date !== undefined) updateData.endDate = request.end_date;
  if (request.description !== undefined)
    updateData.description = request.description || null;
  if (request.status !== undefined) updateData.status = request.status;

  // Jeśli nie ma żadnych danych do aktualizacji, zwróć błąd
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  // Obsługa integracji z Google Calendar
  if (newStatus !== undefined) {
    // Jeśli zmieniamy status z "approved" na inny, usuń wydarzenie z Google Calendar
    if (oldStatus === "approved" && newStatus !== "approved" && googleCalendarEventId) {
      try {
        await deleteCalendarEvent(googleCalendarEventId);
        updateData.googleCalendarEventId = null;
      } catch (error) {
        console.error("Error deleting calendar event:", error);
      }
    }

    // Jeśli zmieniamy status na "approved", utwórz wydarzenie w Google Calendar
    if (newStatus === "approved" && oldStatus !== "approved") {
      // Użyj nowych dat jeśli są aktualizowane, w przeciwnym razie starych
      const startDate = updateData.startDate || currentRequest.startDate;
      const endDate = updateData.endDate || currentRequest.endDate;
      const employeeEmail = updateData.employeeEmail || currentRequest.employeeEmail;
      const description = updateData.description || currentRequest.description;

      // Pobierz informacje o użytkowniku
      const user = await prisma.user.findUnique({
        where: { email: employeeEmail },
      });

      try {
        const eventId = await createCalendarEvent(
          startDate,
          endDate,
          employeeEmail,
          user?.name || undefined,
          description || undefined
        );
        
        if (eventId) {
          updateData.googleCalendarEventId = eventId;
        }
      } catch (error) {
        console.error("Error creating calendar event:", error);
      }
    }
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id },
    data: updateData,
  });

  return {
    id: updatedRequest.id,
    employee_email: updatedRequest.employeeEmail,
    start_date: updatedRequest.startDate,
    end_date: updatedRequest.endDate,
    description: updatedRequest.description || undefined,
    status: updatedRequest.status as "pending" | "approved" | "rejected",
    created_at: updatedRequest.createdAt,
  };
}

// Usuń wniosek
export async function deleteLeaveRequest(id: number): Promise<boolean> {
  try {
    // Pobierz wniosek przed usunięciem aby sprawdzić czy ma eventId i status "approved"
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (leaveRequest && leaveRequest.status === "approved" && leaveRequest.googleCalendarEventId) {
      // Usuń wydarzenie z Google Calendar
      try {
        await deleteCalendarEvent(leaveRequest.googleCalendarEventId);
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        // Kontynuuj usuwanie wniosku nawet jeśli usunięcie z kalendarza się nie powiodło
      }
    }

    await prisma.leaveRequest.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
