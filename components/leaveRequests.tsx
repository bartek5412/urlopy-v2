"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import { DateRange } from "react-day-picker";

interface LeaveRequest {
  id?: number;
  employee_email: string;
  start_date: string;
  end_date: string;
  description?: string;
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
}

interface LeaveRequestsProps {
  refreshKey?: number;
  onRequestUpdated?: () => void;
  onStatusChange?: (
    requestId: number,
    oldStatus: string,
    newStatus: string
  ) => void;
}

export default function LeaveRequests({
  refreshKey,
  onRequestUpdated,
  onStatusChange,
}: LeaveRequestsProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<number | null>(null);
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>();
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    role?: string;
  } | null>(null);
  const [previousStatuses, setPreviousStatuses] = useState<Map<number, string>>(
    new Map()
  );
  const onStatusChangeRef = useRef(onStatusChange);

  // Aktualizuj ref przy każdej zmianie onStatusChange
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    let isMounted = true;
    let userEmail: string | null = null;

    async function fetchLeaveRequests(silent = false) {
      try {
        if (!silent) {
          setLoading(true);
        }
        // Pobierz aktualnego użytkownika
        const userResponse = await fetch("/api/auth/me");
        if (!userResponse.ok) {
          if (!silent) {
            setLoading(false);
          }
          return;
        }
        const userData = await userResponse.json();
        userEmail = userData.user?.email;
        if (isMounted) {
          setCurrentUser(userData.user);
        }

        // Pobierz wnioski dla zalogowanego użytkownika
        const response = await fetch(
          `/api/leave-requests?email=${encodeURIComponent(userEmail || "")}`
        );
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();

            if (!isMounted) return;

            // Sprawdź, czy któryś wniosek zmienił status
            // Użyj funkcji aktualizującej, aby mieć dostęp do aktualnej wartości previousStatuses
            setPreviousStatuses((prevStatuses) => {
              const newStatuses = new Map<number, string>();
              data.forEach((req: LeaveRequest) => {
                if (req.id) {
                  const requestId = req.id;
                  const newStatus = req.status || "pending";
                  newStatuses.set(requestId, newStatus);
                  const previousStatus = prevStatuses.get(requestId);
                  // Jeśli status się zmienił, powiadom komponent nadrzędny
                  // Użyj setTimeout, aby uniknąć aktualizacji stanu podczas renderowania
                  if (
                    previousStatus &&
                    previousStatus !== newStatus &&
                    onStatusChangeRef.current
                  ) {
                    setTimeout(() => {
                      onStatusChangeRef.current?.(
                        requestId,
                        previousStatus,
                        newStatus
                      );
                    }, 0);
                  }
                }
              });
              return newStatuses;
            });
            setLeaveRequests(data);
          } else {
            console.error("Otrzymano nieprawidłową odpowiedź z serwera");
          }
        } else {
          console.error(`Błąd HTTP: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        if (!silent && isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeaveRequests();

    // Ustaw interwał, aby okresowo sprawdzać zmiany statusu (co 10 sekund, bez pokazywania loading)
    const interval = setInterval(() => {
      if (isMounted) {
        fetchLeaveRequests(true); // silent refresh
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey, localRefreshKey]);

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setEditDateRange({
      from: new Date(request.start_date),
      to: new Date(request.end_date),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRequest?.id || !editDateRange?.from || !editDateRange?.to)
      return;

    try {
      // Formatuj daty w lokalnej strefie czasowej (YYYY-MM-DD)
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const response = await fetch(`/api/leave-requests/${editingRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: formatDate(editDateRange.from),
          end_date: formatDate(editDateRange.to),
          description: editingRequest.description,
          status: "pending", // Zmień status na pending przy edycji
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingRequest(null);
        setLocalRefreshKey((prev) => prev + 1);
        // Powiadom komponent nadrzędny o aktualizacji (status zmieniony na pending)
        if (onRequestUpdated) {
          onRequestUpdated();
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error updating leave request:", errorData);
        alert(
          `Błąd: ${errorData.error || "Nie udało się zaktualizować wniosku"}`
        );
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert("Wystąpił błąd podczas aktualizacji wniosku");
    }
  };

  const handleDelete = (id: number) => {
    setDeleteRequestId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteRequestId) return;

    try {
      const response = await fetch(`/api/leave-requests/${deleteRequestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setDeleteRequestId(null);
        setLocalRefreshKey((prev) => prev + 1);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error deleting leave request:", errorData);
        alert(`Błąd: ${errorData.error || "Nie udało się usunąć wniosku"}`);
      }
    } catch (error) {
      console.error("Error deleting leave request:", error);
      alert("Wystąpił błąd podczas usuwania wniosku");
    }
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (leaveRequests.length === 0) {
    return <div>Brak wniosków urlopowych</div>;
  }

  return (
    <div>
      {leaveRequests.map((leaveRequest) => (
        <div
          key={leaveRequest.id}
          className="flex flex-col gap-2 bg-card p-2 rounded-lg"
        >
          <Card className="w-full p-4">
            <CardHeader>
              <CardDescription>
                <div className="flex flex-row justify-between">
                  Status wniosku{" "}
                  <Badge
                    className={cn(
                      leaveRequest.status === "pending"
                        ? "bg-yellow-500"
                        : leaveRequest.status === "approved"
                        ? "bg-green-500"
                        : "bg-red-500"
                    )}
                  >
                    {leaveRequest.status === "pending"
                      ? "Oczekuje na akceptację"
                      : leaveRequest.status === "approved"
                      ? "Zaakceptowane"
                      : "Odrzucone"}
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Label>Data rozpoczęcia: {leaveRequest.start_date}</Label>
                <Label>Data zakończenia: {leaveRequest.end_date}</Label>

                <Label>Rodzaj urlopu: {leaveRequest.description}</Label>
              </div>
              <div className="flex flex-row justify-end gap-2">
                <Button
                  onClick={() => handleEdit(leaveRequest)}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Edytuj
                </Button>
                {/* Pokaż przycisk usuwania tylko gdy użytkownik ma uprawnienia */}
                {(() => {
                  const isLeader = currentUser?.role === "leader";
                  const isOwner =
                    leaveRequest.employee_email === currentUser?.email;
                  const canDeleteAsEmployee =
                    isOwner &&
                    (leaveRequest.status === "pending" ||
                      leaveRequest.status === "rejected");
                  const canDelete = isLeader || canDeleteAsEmployee;

                  return canDelete ? (
                    <Button
                      onClick={() =>
                        leaveRequest.id && handleDelete(leaveRequest.id)
                      }
                      className="bg-secondary text-white hover:bg-secondary/90"
                    >
                      Usuń
                    </Button>
                  ) : null;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Dialog edytowania */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edytuj wniosek urlopowy</DialogTitle>
            <DialogDescription>Zmień daty lub opis urlopu</DialogDescription>
          </DialogHeader>
          {editingRequest && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <Label>Data urlopu</Label>
                <Calendar
                  mode="range"
                  selected={editDateRange}
                  onSelect={setEditDateRange}
                  numberOfMonths={2}
                  className="rounded-lg border"
                />
              </div>
              <div>
                <Label>Opis</Label>
                <Input
                  value={editingRequest.description || ""}
                  onChange={(e) =>
                    setEditingRequest({
                      ...editingRequest,
                      description: e.target.value,
                    })
                  }
                  placeholder="Opis urlopu"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button onClick={handleSaveEdit}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog potwierdzenia usunięcia */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć ten wniosek urlopowy? Ta operacja jest
              nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
