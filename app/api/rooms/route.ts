import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");
    if (roomId && date) {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date" },
          { status: 400 }
        );
      }
      const dayStart = new Date(parsedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(parsedDate);
      dayEnd.setHours(23, 59, 59, 999);
      const room = await prisma.room.findMany({
        where: {
          id: Number.parseInt(roomId, 10),
          startSchedule: { lte: dayEnd },
          endSchedule: { gte: dayStart },
        },
      });
      return NextResponse.json(room);
    }
    const rooms = await prisma.room.findMany();
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { roomId, date, startSchedule, endSchedule } = body;
  console.log(body, 'body')
}