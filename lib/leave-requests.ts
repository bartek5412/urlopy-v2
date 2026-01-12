import prisma from "./db";

export interface LeaveRequest {
  id?: number;
  employee_email: string;
  start_date: string;
  end_date: string;
  description?: string;
  status?: "pending" | "approved" | "rejected";
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

// Oblicz liczbę dni urlopu między datami
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 bo wliczamy oba dni (początkowy i końcowy)
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
  const updatedRequest = await prisma.leaveRequest.update({
    where: { id },
    data: { status },
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
    await prisma.leaveRequest.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
