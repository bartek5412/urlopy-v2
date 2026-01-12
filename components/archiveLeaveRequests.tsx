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

export default function ArchiveLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchiveRequests();
  }, []);

  async function fetchArchiveRequests() {
    try {
      setLoading(true);
      // Pobierz aktualnego użytkownika
      const userResponse = await fetch("/api/auth/me");
      if (!userResponse.ok) {
        setLoading(false);
        return;
      }
      const userData = await userResponse.json();
      const userEmail = userData.user?.email;

      // Pobierz wszystkie wnioski użytkownika
      const response = await fetch(
        `/api/leave-requests?email=${encodeURIComponent(userEmail)}`
      );
      if (response.ok) {
        const data = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filtruj tylko wnioski, których termin już minął
        const archived = data.filter((req: LeaveRequest) => {
          const endDate = new Date(req.end_date);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        });
        
        setLeaveRequests(archived);
      } else {
        console.error(`Błąd HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching archive leave requests:", error);
    } finally {
      setLoading(false);
    }
  }

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
          Brak zarchiwizowanych wniosków urlopowych
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
                    {new Date(leaveRequest.start_date).toLocaleDateString("pl-PL")} - {new Date(leaveRequest.end_date).toLocaleDateString("pl-PL")}
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
