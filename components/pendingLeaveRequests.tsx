"use client";

import { useEffect, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ScrollArea } from "./ui/scroll-area";

interface LeaveRequest {
  id?: number;
  employee_email: string;
  start_date: string;
  end_date: string;
  description?: string;
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
}

interface PendingLeaveRequestsProps {
  onUpdate?: () => void;
}

export default function PendingLeaveRequests({
  onUpdate,
}: PendingLeaveRequestsProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  async function fetchPendingRequests() {
    try {
      setLoading(true);
      const response = await fetch("/api/leave-requests?status=pending");
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else {
        console.error(`Błąd HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (request: LeaveRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
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
        // Odśwież listę
        await fetchPendingRequests();
        // Powiadom komponent nadrzędny o aktualizacji
        if (onUpdate) {
          onUpdate();
        }
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

  const confirmAction = async () => {
    if (!selectedRequest?.id || !actionType) return;

    try {
      const newStatus = actionType === "approve" ? "approved" : "rejected";
      const response = await fetch(
        `/api/leave-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (response.ok) {
        setActionDialogOpen(false);
        setSelectedRequest(null);
        setActionType(null);
        // Odśwież listę
        await fetchPendingRequests();
        // Powiadom komponent nadrzędny o aktualizacji
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error updating leave request status:", errorData);
        alert(
          `Błąd: ${
            errorData.error || "Nie udało się zaktualizować statusu wniosku"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating leave request status:", error);
      alert("Wystąpił błąd podczas aktualizacji statusu wniosku");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Ładowanie...</div>
      </div>
    );
  }

  if (leaveRequests.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">
          Brak wniosków urlopowych do zaakceptowania
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px] pr-4">
        {leaveRequests.map((leaveRequest) => (
          <Card key={leaveRequest.id} className="mb-4">
            <CardHeader>
              <div className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {leaveRequest.employee_email}
                  </CardTitle>
                  <CardDescription>
                    Data utworzenia:{" "}
                    {leaveRequest.created_at
                      ? new Date(leaveRequest.created_at).toLocaleDateString(
                          "pl-PL"
                        )
                      : "Nieznana"}
                  </CardDescription>
                </div>
                <Badge className="bg-yellow-500">Oczekuje na akceptację</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-semibold">
                    Data rozpoczęcia:
                  </Label>
                  <div className="text-sm">
                    {new Date(leaveRequest.start_date).toLocaleDateString(
                      "pl-PL"
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Data zakończenia:
                  </Label>
                  <div className="text-sm">
                    {new Date(leaveRequest.end_date).toLocaleDateString(
                      "pl-PL"
                    )}
                  </div>
                </div>
                {leaveRequest.description && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold">Opis:</Label>
                    <div className="text-sm">{leaveRequest.description}</div>
                  </div>
                )}
              </div>
              <div className="flex flex-row justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    if (leaveRequest.id) {
                      handleDelete(leaveRequest.id);
                    }
                  }}
                  variant="destructive"
                >
                  Usuń
                </Button>
                <Button
                  onClick={() => handleAction(leaveRequest, "reject")}
                  variant="destructive"
                >
                  Odrzuć
                </Button>
                <Button
                  onClick={() => handleAction(leaveRequest, "approve")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Zaakceptuj
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>

      {/* Dialog potwierdzenia akcji */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve"
                ? "Potwierdź akceptację wniosku"
                : "Potwierdź odrzucenie wniosku"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Czy na pewno chcesz zaakceptować wniosek urlopowy od ${selectedRequest?.employee_email}?`
                : `Czy na pewno chcesz odrzucić wniosek urlopowy od ${selectedRequest?.employee_email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {actionType === "approve" ? "Zaakceptuj" : "Odrzuć"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
