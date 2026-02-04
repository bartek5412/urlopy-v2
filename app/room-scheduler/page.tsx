"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogDescription } from "@radix-ui/react-dialog";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { useState, useEffect } from "react";

interface Room {
  id: string;
  name: string;
  startSchedule: string;
  endSchedule: string;
  status: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function RoomSchedulerPage() {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [bookedRooms, setBookedRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!selectedRoom || !selectedDay) return;
      const dateParam = encodeURIComponent(selectedDay.toISOString());
      const response = await fetch(
        `/api/rooms?roomId=${selectedRoom}&date=${dateParam}`
      );
      const data = await response.json();
      setBookedRooms(data);
    };
    fetchRooms();
  }, [selectedRoom, selectedDay]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (selectedRoom || selectedDay) return;
      const response = await fetch("/api/rooms")
      const data = await response.json();
      setBookedRooms(data);
    };
    fetchRooms();
  }, [selectedRoom, selectedDay]);

  const handleRoomSelect = (room: string) => {
    setSelectedRoom(room);
  };
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };
  const handleShowDialog = () => {
    setShowDialog(true);
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
      <div className="flex flex-col gap-6 w-full max-w-8/12 z-10">
        <div className="h-fit p-4 w-full rounded-md bg-white backdrop-blur shadow-md">
          <h1 className="text-2xl font-bold">Rezerwacja sali konferencyjnej</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <Card className="flex-1 shadow-lg">
            <CardHeader>
              <CardTitle>Rezerwacja sali konferencyjnej</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                selected={selectedDay}
                onDayClick={(day) => handleDayClick(day)}
                weekStartsOn={1}
                numberOfMonths={2}
                startMonth={new Date()}
                locale={pl}
                mode="single"
              />
            </CardContent>
          </Card>
          <Card className="flex-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Dostępne terminy{" "}
                <div className="flex gap-2">
                  <Button onClick={handleShowDialog}>Dodaj termin</Button>
                  <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                      <DialogDescription>Dodaj rezerwację dla wybranego pokoju</DialogDescription>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="flex flex-col gap-2">
                          <Label>Godzina rozpoczęcia</Label>
                          <Input type="time" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Godzina zakończenia</Label>
                          <Input type="time" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Nazwa salki</Label>
                          <Select >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Wybierz pokój" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Salka 1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Opis</Label>
                          <Input type="text" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Godzina rozpoczęcia</Label>
                          <Input type="time" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Godzina zakończenia</Label>
                          <Input type="time" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Dodaj</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Select onValueChange={handleRoomSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz pokój" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Salka 1</SelectItem>
                      <SelectItem value="2">Salka 2</SelectItem>
                      <SelectItem value="3">Salka 3</SelectItem>
                    </SelectContent>
                  </Select></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookedRooms.map((room) => {
                const startDate = new Date(room.startSchedule);
                const endDate = new Date(room.endSchedule);
                return (
                  <div className="flex justify-between items-center" key={room.id}>
                    <div>{room.name}</div>
                    <span>{format(startDate, "yyyy-MM-dd HH:mm")}</span>
                    <span>{format(endDate, "yyyy-MM-dd HH:mm")}</span>
                    <span>{room.startSchedule}</span>
                  </div>
                );
              })}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
