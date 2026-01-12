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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
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

interface User {
  id: number;
  email: string;
  name?: string;
  role?: string;
  leaderId?: number | null;
  daysAvailable?: number;
  daysPerYear?: number;
  usedDays?: number; // Wykorzystane dni urlopu
}

interface LeaveRequest {
  id?: number;
  employee_email: string;
  start_date: string;
  end_date: string;
  description?: string;
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
}

interface UserManagementProps {
  onExport?: (userIds: number[]) => void;
}

export default function UserManagement({ onExport }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [daysToAdd, setDaysToAdd] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
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
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchAllLeaveRequests();
    }
  }, [activeTab]);

  // Funkcja do obliczania wykorzystanych dni urlopu
  async function calculateUsedDays(email: string): Promise<number> {
    try {
      const response = await fetch(
        `/api/leave-requests?email=${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        // Oblicz wykorzystane dni tylko z zaakceptowanych wniosków
        const approvedRequests = data.filter(
          (req: any) => req.status === "approved"
        );
        let totalDays = 0;
        approvedRequests.forEach((req: any) => {
          const start = new Date(req.start_date);
          const end = new Date(req.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDays += diffDays + 1; // +1 bo wliczamy oba dni
        });
        return totalDays;
      }
    } catch (error) {
      console.error(`Error calculating used days for ${email}:`, error);
    }
    return 0;
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        const usersData = data.users || [];

        // Oblicz wykorzystane dni dla każdego użytkownika
        const usersWithUsedDays = await Promise.all(
          usersData.map(async (user: User) => {
            const usedDays = await calculateUsedDays(user.email);
            return { ...user, usedDays };
          })
        );

        setUsers(usersWithUsedDays);
        setLeaders(data.leaders || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          leaderId: editingUser.leaderId,
          daysAvailable: editingUser.daysAvailable,
          daysPerYear: editingUser.daysPerYear,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        alert(
          `Błąd: ${
            errorData.error || "Nie udało się zaktualizować użytkownika"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Wystąpił błąd podczas aktualizacji użytkownika");
    }
  };

  const handleAddDays = async () => {
    if (!daysToAdd || selectedUsers.length === 0) {
      alert("Wybierz użytkowników i podaj liczbę dni");
      return;
    }

    const days = parseInt(daysToAdd);
    if (isNaN(days) || days <= 0) {
      alert("Podaj poprawną liczbę dni");
      return;
    }

    try {
      const response = await fetch("/api/users/add-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers,
          days: days,
        }),
      });

      if (response.ok) {
        setDaysToAdd("");
        setSelectedUsers([]);
        fetchUsers();
        alert("Dni urlopu zostały dodane");
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        alert(`Błąd: ${errorData.error || "Nie udało się dodać dni"}`);
      }
    } catch (error) {
      console.error("Error adding days:", error);
      alert("Wystąpił błąd podczas dodawania dni");
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleExportSelected = () => {
    if (selectedUsers.length === 0) {
      alert("Wybierz użytkowników do eksportu");
      return;
    }
    if (onExport) {
      onExport(selectedUsers);
    }
  };

  // Funkcje do zarządzania wnioskami urlopowymi
  async function fetchAllLeaveRequests() {
    try {
      setRequestsLoading(true);
      const response = await fetch("/api/leave-requests");
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setRequestsLoading(false);
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
        await fetchAllLeaveRequests();
        await fetchUsers(); // Odśwież użytkowników, aby zaktualizować wykorzystane dni
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
        await fetchAllLeaveRequests();
        await fetchUsers(); // Odśwież użytkowników, aby zaktualizować wykorzystane dni
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Zarządzanie użytkownikami</h3>
            <p className="text-sm text-muted-foreground">
              Edytuj użytkowników, dodawaj dni urlopu i eksportuj dane
            </p>
          </div>
          <div className="flex gap-2 items-center mx-4">
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
              size="sm"
            >
              Użytkownicy
            </Button>
            <Button
              variant={activeTab === "requests" ? "default" : "outline"}
              onClick={() => setActiveTab("requests")}
              size="sm"
            >
              Wszystkie wnioski
            </Button>
          </div>
        </div>
        {activeTab === "users" && selectedUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-start sm:items-center">
            <Input
              type="number"
              placeholder="Dni do dodania"
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(e.target.value)}
              className="w-full sm:w-32"
            />
            <Button
              onClick={handleAddDays}
              size="sm"
              className="w-full sm:w-auto"
            >
              Dodaj dni
            </Button>
            <Button
              onClick={handleExportSelected}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              Eksportuj wybrane ({selectedUsers.length})
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="h-[600px] pr-4">
        {activeTab === "users" ? (
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id} className="mb-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold">
                            {user.name || user.email}
                          </Label>
                          <Badge
                            className={
                              user.role === "leader"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                            }
                          >
                            {user.role === "leader" ? "Lider" : "Pracownik"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="text-sm mt-1">
                          Dostępne dni urlopu:{" "}
                          {Math.max(
                            0,
                            (user.daysAvailable ?? 26) - (user.usedDays ?? 0)
                          )}{" "}
                          / {user.daysAvailable ?? 26} (wykorzystane:{" "}
                          {user.usedDays ?? 0}) | Dni/rok:{" "}
                          {user.daysPerYear ?? 26}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleEdit(user)}
                      variant="outline"
                      size="sm"
                    >
                      Edytuj
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div>Ładowanie...</div>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">
                  Brak wniosków urlopowych
                </div>
              </div>
            ) : (
              leaveRequests.map((leaveRequest) => (
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
                            ? new Date(
                                leaveRequest.created_at
                              ).toLocaleDateString("pl-PL")
                            : "Nieznana"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          leaveRequest.status === "approved"
                            ? "bg-green-500"
                            : leaveRequest.status === "rejected"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }
                      >
                        {leaveRequest.status === "pending"
                          ? "Oczekuje"
                          : leaveRequest.status === "approved"
                          ? "Zaakceptowane"
                          : "Odrzucone"}
                      </Badge>
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
                          <div className="text-sm">
                            {leaveRequest.description}
                          </div>
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
                        size="sm"
                      >
                        Usuń
                      </Button>
                      {leaveRequest.status !== "approved" && (
                        <Button
                          onClick={() => handleAction(leaveRequest, "approve")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Zaakceptuj
                        </Button>
                      )}
                      {leaveRequest.status !== "rejected" && (
                        <Button
                          onClick={() => handleAction(leaveRequest, "reject")}
                          variant="destructive"
                          size="sm"
                        >
                          Odrzuć
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* Dialog edytowania użytkownika */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edytuj użytkownika</DialogTitle>
            <DialogDescription>
              Zmień dane użytkownika, rolę i dni urlopu
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <Label className="my-2">Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div>
                <Label className="my-2">Imię i nazwisko</Label>
                <Input
                  value={editingUser.name || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  placeholder="Imię i nazwisko"
                />
              </div>
              <div>
                <Label className="my-2">Rola</Label>
                <Select
                  value={editingUser.role || "employee"}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Pracownik</SelectItem>
                    <SelectItem value="leader">Lider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingUser.role === "employee" && (
                <div>
                  <Label className="my-2">Przypisany lider</Label>
                  <Select
                    value={editingUser.leaderId?.toString() || "none"}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        leaderId: value === "none" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Brak przypisanego lidera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Brak przypisanego lidera
                      </SelectItem>
                      {leaders.map((leader) => (
                        <SelectItem
                          key={leader.id}
                          value={leader.id.toString()}
                        >
                          {leader.name || leader.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="my-2">Dostępne dni urlopu</Label>
                <Input
                  type="number"
                  value={editingUser.daysAvailable ?? 26}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      daysAvailable: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="my-2">Dni urlopu na rok</Label>
                <Input
                  type="number"
                  value={editingUser.daysPerYear ?? 26}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      daysPerYear: parseInt(e.target.value) || 0,
                    })
                  }
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
