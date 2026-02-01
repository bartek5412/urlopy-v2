"use client";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { pl } from "date-fns/locale";
import { useEffect, useState } from "react";
import { isWithinInterval, startOfDay } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Typ dla naszych danych (dostosuj pola do swojego API)
type LeaveRequest = {
  id: number;
  start_date: string; // lub Date, jeśli przekonwertujesz wcześniej
  end_date: string;
  employee_email: string; // Przykładowe pole
  description: string; // Przykładowe pole
  status: string;
  // ... inne pola
};

export default function ListRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]); // Pełne dane o wnioskach
  const [bookedDates, setBookedDates] = useState<Date[]>([]); // Tablica samych dat do "pokolorowania"

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    undefined
  );
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<
    LeaveRequest[] | null
  >(null);

  async function fetchRequests() {
    // Symulacja danych - w Twoim przypadku to fetch()
    const response = await fetch("/api/leave-requests?status=approved");
    const data = await response.json();

    // 1. Obliczamy wszystkie zajęte dni (tak jak robiłeś wcześniej)
    const calculatedDates = data.map((request: any) => {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return Array.from({ length: diffDays }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
      });
    });

    setRequests(data); // Zapisujemy pełne dane, żeby móc je potem wyszukać
    setBookedDates(calculatedDates); // Zapisujemy daty dla stylów
  }

  useEffect(() => {
    fetchRequests();

  }, []);

  const handleResetDate = () => {
    setSelectedDate(undefined);
    setSelectedRequestDetails([]);
  };
  // Funkcja obsługująca kliknięcie w kalendarz
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);

    if (!date) {
      setSelectedRequestDetails([]);
      return;
    }

    // Szukamy, czy kliknięta data mieści się w którymś wniosku
    const foundRequest = requests.filter((req) => {
      const start = startOfDay(new Date(req.start_date));
      const end = startOfDay(new Date(req.end_date));
      const check = startOfDay(date);

      // Sprawdzamy czy data jest w przedziale (domkniętym)
      return isWithinInterval(check, { start, end });
    });

    setSelectedRequestDetails(foundRequest.length > 0 ? foundRequest : []);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="absolute inset-0 z-0">
        <img
          src="/app-background.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-6 w-full max-w-7xl z-10">
        <div className="h-fit p-4 w-full rounded-md bg-white backdrop-blur shadow-md">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">Kalendarz urlopów</h1>
            <Button
              onClick={() => {
                router.push("/leave-request");
              }}
            >
              Powrót do aplikacji
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* LEWA STRONA: KALENDARZ */}
          <Card className="flex-1 shadow-lg">
            <CardHeader>
              <CardTitle>Kalendarz urlopów</CardTitle>
              <CardDescription className="flex items-center justify-between gap-2">
                Wybierz dzień, aby zobaczyć szczegóły
                <Button variant="outline" onClick={handleResetDate}>
                  Resetuj datę
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                locale={pl}
                weekStartsOn={1}
                numberOfMonths={2} // Zmieniłem na 1 dla czytelności na mobile, daj 3 jeśli chcesz
                className="rounded-md border"
                // KLUCZOWE ZMIANY STYLI:
                modifiers={{ booked: bookedDates }} // Przekazujemy daty, które mają mieć klasę 'booked'
                modifiersClassNames={{
                  booked:
                    "text-red-900 font-bold relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-1.5 after:bg-red-500 after:rounded-full",
                }}
              />
            </CardContent>
            <div className="p-4 text-xs text-gray-500 flex gap-2 justify-center">
              <div className="flex items-center gap-1">
                <span className="w-6 h-2 rounded-full bg-red-500 block"></span>{" "}
                Dzień zajęty
              </div>
            </div>
          </Card>

          {/* PRAWA STRONA: SZCZEGÓŁY */}
          <Card className="flex-1 shadow-lg min-h-[300px]">
            <CardHeader>
              <CardTitle>Szczegóły dnia</CardTitle>
              <CardDescription>
                {selectedDate
                  ? selectedDate.toLocaleDateString("pl-PL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Wybierz datę"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {selectedRequestDetails && selectedRequestDetails.length > 0 ? (
                  selectedRequestDetails.map((request, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 my-2"
                    >
                      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <Label className="text-green-800 font-bold text-lg mb-2 block">
                          Zatwierdzony urlop
                        </Label>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-2">
                          <span className="font-semibold">Pracownik:</span>{" "}
                          {request.employee_email}
                          <span className="font-semibold">Typ:</span>{" "}
                          {request.description}
                          <span className="font-semibold">Od / Do:</span>{" "}
                          {request.start_date} / {request.end_date}
                          <span className="font-semibold">Status:</span>
                          <span className=" inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                            {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    {selectedDate ? (
                      <p>Brak urlopów w tym dniu.</p>
                    ) : (
                      <p>Kliknij w kalendarz, aby sprawdzić dostępność.</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
