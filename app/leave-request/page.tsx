"use client";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Input } from "@/components/ui/input";
import LeaveRequests from "@/components/leaveRequests";
import PendingLeaveRequests from "@/components/pendingLeaveRequests";
import ArchiveLeaveRequests from "@/components/archiveLeaveRequests";
import UserManagement from "@/components/userManagement";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToastContainer } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { pl } from "date-fns/locale";

interface User {
  id: number;
  email: string;
  name?: string;
  role?: string;
  daysAvailable?: number;
  daysPerYear?: number;
}

export default function LeaveRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 2),
  });
  const [type, setType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "my-requests" | "pending" | "archive" | "users"
  >("my-requests");
  const [pendingCount, setPendingCount] = useState(0);
  // Inicjalizuj previousPendingCount z localStorage, aby od razu mieć poprawną wartość
  // Używamy osobnego klucza do śledzenia, czy to pierwsze załadowanie strony
  const [previousPendingCount, setPreviousPendingCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("notifiedPendingCount") || "0");
    }
    return 0;
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type?: "info" | "success" | "warning" | "error";
    }>
  >([]);
  const [availableDays, setAvailableDays] = useState<number | null>(null);
  const [usedDays, setUsedDays] = useState<number>(0);

  // Użyj useMemo aby isLeader był reaktywny
  const isLeader = useMemo(() => user?.role === "leader", [user?.role]);

  // Otwórz dialog gdy pojawi się submitMessage
  useEffect(() => {
    if (submitMessage) {
      setIsDialogOpen(true);
    }
  }, [submitMessage]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.user?.daysAvailable !== undefined) {
            setAvailableDays(data.user.daysAvailable);
          }

          // Sprawdź powiadomienia po zalogowaniu
          const userEmail = data.user?.email;
          const userRole = data.user?.role;

          if (userEmail) {
            // Dla użytkownika: sprawdź czy ma zaakceptowane wnioski, które nie były jeszcze powiadomione
            if (userRole !== "leader") {
              const response = await fetch(
                `/api/leave-requests?email=${encodeURIComponent(userEmail)}`
              );
              if (response.ok) {
                const requests = await response.json();
                const notifiedIds = JSON.parse(
                  localStorage.getItem("notifiedApprovedRequests") || "[]"
                );
                const approvedRequests = requests.filter(
                  (req: any) =>
                    req.status === "approved" && !notifiedIds.includes(req.id)
                );

                if (approvedRequests.length > 0) {
                  // Zapisz wszystkie jako powiadomione
                  approvedRequests.forEach((req: any) => {
                    if (req.id && !notifiedIds.includes(req.id)) {
                      notifiedIds.push(req.id);
                    }
                  });
                  localStorage.setItem(
                    "notifiedApprovedRequests",
                    JSON.stringify(notifiedIds)
                  );

                  // Pokaż powiadomienie
                  setToasts((prev) => [
                    ...prev,
                    {
                      id: `approved-on-login-${Date.now()}`,
                      message:
                        approvedRequests.length === 1
                          ? "Twój wniosek urlopowy został zaakceptowany!"
                          : `Masz ${approvedRequests.length} zaakceptowanych wniosków urlopowych!`,
                      type: "success" as const,
                    },
                  ]);
                  // Odśwież listę
                  setRefreshKey((prev) => prev + 1);
                }
              }
            }

            // Dla lidera: sprawdź czy są nowe wnioski do zaakceptowania
            // Przy logowaniu ZAWSZE pokazuj powiadomienie jeśli są wnioski (niezależnie od localStorage)
            if (userRole === "leader") {
              const response = await fetch(
                "/api/leave-requests?status=pending"
              );
              if (response.ok) {
                const requests = await response.json();
                const newCount = requests.length;

                console.log(`Login check: newCount=${newCount}`);

                // Przy logowaniu zawsze pokazuj powiadomienie jeśli są wnioski
                if (newCount > 0) {
                  console.log(`✅ Login: Showing notification for ${newCount} pending requests`);
                  
                  setToasts((prev) => {
                    const filtered = prev.filter(
                      (t) =>
                        !t.message.includes("nowych wniosków") &&
                        !t.message.includes("nowy wniosek") &&
                        !t.message.includes("do zaakceptowania")
                    );
                    const newToast = {
                      id: `pending-on-login-${Date.now()}`,
                      message: `Masz ${newCount} ${
                        newCount === 1 ? "nowy wniosek" : "nowych wniosków"
                      } do zaakceptowania`,
                      type: "info" as const,
                    };
                    console.log("Login: Adding toast:", newToast);
                    return [...filtered, newToast];
                  });
                  
                  // Zaktualizuj localStorage PO pokazaniu powiadomienia
                  localStorage.setItem(
                    "notifiedPendingCount",
                    newCount.toString()
                  );
                } else {
                  console.log(`Login: No pending requests`);
                  // Jeśli nie ma wniosków, zresetuj localStorage
                  localStorage.setItem("notifiedPendingCount", "0");
                }
              }
            }
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Pobierz wykorzystane dni urlopu
  useEffect(() => {
    const userEmail = user?.email;
    if (!userEmail) return;

    async function fetchUsedDays() {
      try {
        const response = await fetch(
          `/api/leave-requests?email=${encodeURIComponent(userEmail || "")}`
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
          setUsedDays(totalDays);
        }
      } catch (error) {
        console.error("Error fetching used days:", error);
      }
    }
    fetchUsedDays();
  }, [user?.email, refreshKey]);

  // Funkcja do pobierania liczby wniosków do zaakceptowania
  const fetchPendingCount = useCallback(async () => {
    if (!isLeader) return;
    
    try {
      const response = await fetch("/api/leave-requests?status=pending");
      if (response.ok) {
        const data = await response.json();
        const newCount = data.length || 0;

        // Użyj funkcji aktualizującej, aby mieć dostęp do aktualnej wartości previousPendingCount
        setPreviousPendingCount((prevCount) => {
          // ZAWSZE używaj localStorage jako źródła prawdy - jest aktualizowane po każdej akcji
          const storedCount = parseInt(localStorage.getItem("notifiedPendingCount") || "0");
          
          // Użyj storedCount jako actualPrevCount - localStorage jest zawsze aktualne
          const actualPrevCount = storedCount;
          
          // isFirstLoad tylko przy pierwszym załadowaniu strony (nie po usunięciu wszystkich wniosków)
          const isFirstLoad = !hasInitialized && storedCount === 0;

          console.log(`fetchPendingCount: prevCount=${prevCount}, storedCount=${storedCount}, actualPrevCount=${actualPrevCount}, newCount=${newCount}, isFirstLoad=${isFirstLoad}, hasInitialized=${hasInitialized}`);

          // Sprawdź, czy liczba wniosków wzrosła (nowe wnioski)
          // Nie pokazuj powiadomienia tylko przy pierwszym załadowaniu strony
          if (!isFirstLoad && newCount > actualPrevCount) {
            const newRequests = newCount - actualPrevCount;
            console.log(`✅ fetchPendingCount: New pending requests detected: ${newRequests} (${actualPrevCount} -> ${newCount})`);
            
            // Usuń poprzednie powiadomienia o nowych wnioskach i dodaj nowe
            setToasts((prevToasts) => {
              const filtered = prevToasts.filter(
                (t) =>
                  !t.message.includes("nowych wniosków") &&
                  !t.message.includes("nowy wniosek") &&
                  !t.message.includes("do zaakceptowania")
              );
              const newToast = {
                id: `pending-${Date.now()}`,
                message: `Masz ${newRequests} ${
                  newRequests === 1 ? "nowy wniosek" : "nowych wniosków"
                } do zaakceptowania`,
                type: "info" as const,
              };
              console.log("fetchPendingCount: Adding toast:", newToast);
              return [...filtered, newToast];
            });
            
            // Zaktualizuj localStorage PO pokazaniu powiadomienia
            localStorage.setItem("notifiedPendingCount", newCount.toString());
          } else {
            if (isFirstLoad) {
              console.log(`fetchPendingCount: First load with ${newCount} pending requests - no notification, setting localStorage`);
              // Przy pierwszym załadowaniu ustaw localStorage, aby kolejne sprawdzenia mogły wykryć zmiany
              if (newCount > 0) {
                localStorage.setItem("notifiedPendingCount", newCount.toString());
              }
              setHasInitialized(true);
            } else {
              // Zawsze aktualizuj localStorage, aby było zsynchronizowane z rzeczywistością
              // (nawet jeśli liczba się zmniejszyła lub nie zmieniła)
              if (newCount !== actualPrevCount) {
                console.log(`fetchPendingCount: Updating localStorage from ${actualPrevCount} to ${newCount}`);
                localStorage.setItem("notifiedPendingCount", newCount.toString());
              } else {
                console.log(`fetchPendingCount: No change (${newCount} === ${actualPrevCount})`);
              }
            }
          }
          
          // Oznacz jako zainicjalizowane po pierwszym wywołaniu
          if (!hasInitialized) {
            setHasInitialized(true);
          }
          
          return newCount;
        });
        
        setPendingCount(newCount);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  }, [isLeader]);

  // Pobierz liczbę wniosków do zaakceptowania (tylko dla lidera)
  useEffect(() => {
    if (isLeader) {
      fetchPendingCount();
      // Odśwież licznik co 10 sekund (częściej niż wcześniej)
      const interval = setInterval(fetchPendingCount, 10000);
      return () => clearInterval(interval);
    } else {
      setPendingCount(0);
      setPreviousPendingCount(0);
    }
  }, [isLeader, fetchPendingCount]);

  // Callback dla zmiany statusu wniosku
  const handleStatusChange = useCallback(
    (requestId: number, oldStatus: string, newStatus: string) => {
      console.log("Status change detected:", {
        requestId,
        oldStatus,
        newStatus,
      });
      // Jeśli wniosek został zaakceptowany, pokaż powiadomienie
      if (oldStatus !== "approved" && newStatus === "approved") {
        console.log("Adding approval toast notification");
        setToasts((prev) => {
          const filtered = prev.filter(
            (t) => !t.message.includes("zaakceptowany")
          );
          const newToast = {
            id: `approved-${Date.now()}`,
            message: "Twój wniosek urlopowy został zaakceptowany!",
            type: "success" as const,
          };
          console.log("New toast:", newToast);
          // Zapisz w localStorage, że to powiadomienie zostało wyświetlone
          const notifiedIds = JSON.parse(
            localStorage.getItem("notifiedApprovedRequests") || "[]"
          );
          notifiedIds.push(requestId);
          localStorage.setItem(
            "notifiedApprovedRequests",
            JSON.stringify(notifiedIds)
          );
          // Odśwież listę wniosków i wykorzystane dni
          setRefreshKey((prev) => prev + 1);
          return [...filtered, newToast];
        });
      }
    },
    []
  );

  // Funkcja do usuwania toastów
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const filtered = prev.filter((toast) => toast.id !== id);
      // Jeśli usunięto toast o zaakceptowanych wnioskach, odśwież listę
      const removedToast = prev.find((toast) => toast.id === id);
      if (removedToast && removedToast.message.includes("zaakceptowany")) {
        setRefreshKey((prev) => prev + 1);
      }
      return filtered;
    });
  }, []);

  // Funkcja eksportu urlopów
  const exportLeaveRequests = async (userIds?: number[]) => {
    try {
      let url = "/api/export";
      if (userIds && userIds.length > 0) {
        url += `?userIds=${userIds.join(",")}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        const urlObj = URL.createObjectURL(blob);
        link.setAttribute("href", urlObj);
        link.setAttribute(
          "download",
          `urlopy_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlObj);
      } else {
        alert("Wystąpił błąd podczas eksportu urlopów");
      }
    } catch (error) {
      console.error("Error exporting leave requests:", error);
      alert("Wystąpił błąd podczas eksportu urlopów");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleResetDate = () => {
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 2),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Walidacja
    if (!dateRange?.from || !dateRange?.to) {
      setSubmitMessage({
        type: "error",
        text: "Proszę wybrać datę rozpoczęcia i zakończenia urlopu",
      });
      setIsSubmitting(false);
      return;
    }

    if (!user?.email) {
      setSubmitMessage({
        type: "error",
        text: "Musisz być zalogowany, aby utworzyć wniosek",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Formatuj daty w lokalnej strefie czasowej (YYYY-MM-DD)
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_email: user?.email || "",
          start_date: formatDate(dateRange.from),
          end_date: formatDate(dateRange.to),
          description: type || undefined,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || "Nie udało się utworzyć wniosku");
        } else {
          const text = await response.text();
          throw new Error(
            `Błąd serwera: ${response.status} ${response.statusText}`
          );
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Otrzymano nieprawidłową odpowiedź z serwera");
      }

      const newRequest = await response.json();
      setSubmitMessage({
        type: "success",
        text: "Wniosek urlopowy został pomyślnie utworzony!",
      });

      // Reset formularza
      setType("");
      setDateRange({
        from: new Date(),
        to: addDays(new Date(), 2),
      });

      // Odśwież listę wniosków
      setRefreshKey((prev) => prev + 1);
      // Odśwież licznik pending requests (jeśli jesteś liderem)
      // Użyj setTimeout, aby dać czas na zapisanie do bazy
      if (isLeader) {
        setTimeout(() => {
          fetchPendingCount();
        }, 1000);
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas tworzenia wniosku",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="absolute inset-0 z-0">
        <img
          src="/app-background.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 w-full max-w-7xl px-4">
        <div className="flex justify-between items-center bg-white rounded-lg p-4 relative z-10">
          <div>
            <h1 className="text-2xl font-bold">
              Witaj, {user?.name || user?.email}!
            </h1>
            {!isLeader && availableDays !== null && (
              <p className="text-sm text-muted-foreground mt-1">
                Dostępne dni urlopu: {availableDays - usedDays} /{" "}
                {availableDays} (wykorzystane: {usedDays})
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isLeader && (
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                onClick={() => setActiveTab("users")}
                size="sm"
              >
                Zarządzanie użytkownikami
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} size="sm">
              Wyloguj się
            </Button>
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <Card className="relative z-10 w-1/2">
            <CardHeader>
              <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                  <CardTitle>Wybierz datę urlopu</CardTitle>
                  <CardDescription>
                    Zaznacz datę urlopu w kalendarzu
                  </CardDescription>
                </div>
                <Button onClick={handleResetDate}>Zresetuj datę</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center">
                <Calendar
                  locale={pl}
                  weekStartsOn={1}
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="rounded-lg border shadow-sm"
                />
              </div>
            </CardContent>
            <form onSubmit={handleSubmit}>
              <CardFooter className="flex-col gap-2">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Wybierz typ urlopu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urlop wypoczynkowy">
                      Urlop wypoczynkowy
                    </SelectItem>
                    <SelectItem value="Urlop szkoleniowy">
                      Urlop szkoleniowy
                    </SelectItem>
                    <SelectItem value="Urlop okolicznościowy">
                      Urlop okolicznościowy
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Wysyłanie..." : "Wyślij wniosek o urlop"}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card className="relative z-10 w-1/2">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={
                      activeTab === "my-requests" ? "default" : "outline"
                    }
                    onClick={() => setActiveTab("my-requests")}
                    size="sm"
                  >
                    Moje wnioski
                  </Button>
                  {isLeader && (
                    <Button
                      variant={activeTab === "pending" ? "default" : "outline"}
                      onClick={() => setActiveTab("pending")}
                      size="sm"
                      className="relative"
                    >
                      Wnioski do zaakceptowania
                      {pendingCount > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white">
                          {pendingCount}
                        </Badge>
                      )}
                    </Button>
                  )}
                  <Button
                    variant={activeTab === "archive" ? "default" : "outline"}
                    onClick={() => setActiveTab("archive")}
                    size="sm"
                  >
                    Archiwum
                  </Button>
                  {!isLeader && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportLeaveRequests()}
                    >
                      Eksportuj
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {activeTab === "pending"
                    ? "Zarządzaj wnioskami urlopowymi do zaakceptowania"
                    : activeTab === "archive"
                    ? "Zobacz zarchiwizowane wnioski urlopowe"
                    : activeTab === "users"
                    ? "Zarządzaj użytkownikami, dodawaj dni urlopu"
                    : "Zobacz swoje wnioski urlopowe"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {activeTab === "pending" && isLeader ? (
                  <PendingLeaveRequests onUpdate={fetchPendingCount} />
                ) : activeTab === "archive" ? (
                  <ArchiveLeaveRequests />
                ) : activeTab === "users" && isLeader ? (
                  <UserManagement onExport={exportLeaveRequests} />
                ) : (
                  <LeaveRequests
                    key={refreshKey}
                    onRequestUpdated={fetchPendingCount}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {submitMessage?.type === "success" ? "Sukces" : "Błąd"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {submitMessage?.text}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsDialogOpen(false);
                setSubmitMessage(null);
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
