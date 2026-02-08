"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isPolishHoliday } from "@/lib/polish-holidays";
import { Dialog, DialogDescription } from "@radix-ui/react-dialog";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { useRouter } from "next/navigation";
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

interface Payload {
  name: string;
  startSchedule: string;
  endSchedule: string;
  description: string;
  userId: number;
}

export default function RoomSchedulerPage() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [bookedRooms, setBookedRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [startSchedule, setStartSchedule] = useState<string>("");
  const [endSchedule, setEndSchedule] = useState<string>("");

  const [payload, setPayload] = useState<Payload>({
    name: "",
    startSchedule: "",
    endSchedule: "",
    description: "",
    userId: 0
  })
  const hours = ["7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const selectedFormatDate = selectedDay ? selectedDay?.getFullYear() + "-" + (selectedDay?.getMonth() + 1 < 10 ? "0" + (selectedDay?.getMonth() + 1) : (selectedDay?.getMonth() + 1)) + "-" + (selectedDay?.getDate() < 10 ? "0" + selectedDay?.getDate() : selectedDay?.getDate()) : "";
  // useEffect(() => {
  //   const fetchRooms = async () => {
  //     if (!selectedRoom || !selectedDay) return;
  //     const dateParam = encodeURIComponent(selectedDay.toISOString());
  //     const response = await fetch(
  //       `/api/rooms?roomId=${selectedRoom}&date=${dateParam}`
  //     );
  //     const data = await response.json();
  //     setBookedRooms(data);
  //   };
  //   fetchRooms();
  // }, [selectedRoom, selectedDay]);

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

  const handleSendPayload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullStartDate = new Date(selectedDay as Date);
    fullStartDate.setHours(Number(startSchedule.split(":")[0]), Number(startSchedule.split(":")[1]), 0, 0);
    const fullEndDate = new Date(selectedDay as Date);
    fullEndDate.setHours(Number(endSchedule.split(":")[0]), Number(endSchedule.split(":")[1]), 0, 0);
    const payloadData = {
      ...payload, modifiedAt: new Date(), createdAt: new Date(), startSchedule: fullStartDate, endSchedule: fullEndDate
    }
    console.log(payloadData, 'payloadData');
    await fetch("/api/auth/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then(response => response.json()).then(data => {
      setPayload({ ...payload, userId: data.user.id });
    }).catch(error => {
      console.error("Error fetching user:", error);
    });
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadData),
    });
    setShowDialog(false);
  }

  const filterRooms = bookedRooms.filter((room) => format(new Date(room.startSchedule), "yyyy-MM-dd") === selectedFormatDate && room.status === "pending" && room.name === selectedRoom)
  console.log(selectedFormatDate, filterRooms)
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
          <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">Rezerwacja sali konferencyjnej</h1>
            <Button onClick={() => router.push("/leave-request")} variant="default">Powrót do strony głównej</Button></div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <Card className="flex-1 shadow-lg">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Rezerwacja sali konferencyjnej</CardTitle>
              <Button disabled={!selectedDay} onClick={handleShowDialog}>Dodaj rezerwację</Button>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                  <DialogDescription>Dodaj rezerwację dla wybranego pokoju</DialogDescription>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-2">
                      <Label>Godzina rozpoczęcia</Label>
                      <Input step={900} value={startSchedule} onChange={(e) => setStartSchedule(e.target.value)} type="time" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Godzina zakończenia</Label>
                      <Input value={endSchedule} onChange={(e) => setEndSchedule(e.target.value)} type="time" />
                    </div>
                    <div className="flex flex-col col-span-2 gap-2">
                      <Label>Nazwa salki</Label>
                      <Select value={payload.name} onValueChange={(value) => setPayload({ ...payload, name: value })}>

                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Wybierz pokój" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Salka 1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col col-span-2 gap-2">
                      <Label>Opis</Label>
                      <Input placeholder="Spotkanie z..." value={payload.description} onChange={(e) => setPayload({ ...payload, description: e.target.value })} type="text" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSendPayload(e as unknown as React.FormEvent<HTMLFormElement>)}>Dodaj</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Calendar
                className="w-full rounded-lg border shadow-sm"
                selected={selectedDay}
                onDayClick={(day) => handleDayClick(day)}
                weekStartsOn={1}
                numberOfMonths={2}
                startMonth={new Date()}
                locale={pl}
                mode="single"
                
                disabled={(date) => {
                  const day = date.getDay();
                  const isWeekend = day === 0 || day === 6;
                  const isHoliday = isPolishHoliday(date);
                  return isWeekend || isHoliday;
                }}
                modifiers={{
                  holiday: (date) => isPolishHoliday(date),
                }}
                modifiersClassNames={{
                  holiday: "rdp-holiday",
                }}
              />
            </CardContent>
          </Card>
          <Card className="flex-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                Harmonogram
                <div className="w-full">


                  <Select onValueChange={handleRoomSelect}>
                    <SelectTrigger className="w-full ml-2">
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
              <div className="grid grid-cols-4 justify-between items-center text-sm font-bold">
                <span className="">Godzina</span>
                <span className="text-center">Start</span>
                <span className="text-center">Koniec</span>
                <span className="text-center">Status</span>
              </div>
              <ScrollArea className="h-[500px]">

                {hours.map((hour) => {
                  const hourDate = new Date(selectedDay as Date);
                  hourDate.setHours(Number(hour.split(":")[0]), Number(hour.split(":")[1]), 0, 0);
                  const filteredRooms = filterRooms.filter((room) =>
                    format(new Date(room.startSchedule), "yyyy-MM-dd HH:mm") <= format(hourDate, "yyyy-MM-dd HH:mm") && format(new Date(room.endSchedule), "yyyy-MM-dd HH:mm") > format(hourDate, "yyyy-MM-dd HH:mm"))
                  return (
                    <div className="bg-gray-100 rounded-sm ring-1 ring-gray-300 ring-offset-1 my-2 mx-1" key={hour}>
                      <span className="px-1 text-sm font-bold">{hour}</span>
                      {filteredRooms.map((room) => {
                        return (<div key={room.id} className={`grid grid-cols-4 justify-between items-center bg-green-100 rounded-md p-1 ring-1 ring-green-300 ring-offset-1 ${room.status === "pending" ? "bg-orange-100 ring-orange-300" : "bg-red-100 ring-red-300"}`}>
                          <div>{room.name}</div>
                          <span className="text-center">{format(room.startSchedule, "yyyy-MM-dd HH:mm")}</span>
                          <span className="text-center">{format(room.endSchedule, "yyyy-MM-dd HH:mm")}</span>
                          <div className="flex justify-center">
                            <Badge variant="default" className={`text-xs ${room.status === "pending" ? "bg-orange-500 text-white" : "bg-red-500 text-white"}`}>{room.status}</Badge></div>
                        </div>)
                      })}
                    </div>)
                })}
                {/* {selectedDay && selectedRoom ? filterRooms.map((room, index) => {
                const startDate = new Date(room.startSchedule);
                const endDate = new Date(room.endSchedule);
                return (
                  <div key={index} className={`grid grid-cols-4 justify-between items-center bg-green-100 rounded-md p-1 ring-1 ring-green-300 ring-offset-1 my-2 ${room.status === "pending" ? "bg-orange-100 ring-orange-300" : "bg-red-100 ring-red-300"}`}>
                    <div>{room.name}</div>
                    <span className="text-center">{format(startDate, "yyyy-MM-dd HH:mm")}</span>
                    <span className="text-center">{format(endDate, "yyyy-MM-dd HH:mm")}</span>
                    <div className="flex justify-end">
                      <Badge variant="default" className={`text-xs ${room.status === "pending" ? "bg-orange-500 text-white" : "bg-red-500 text-white"}`}>{room.status}</Badge></div>
                  </div>
                )
              }) : <div>Brak rezerwacji</div>} */}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
