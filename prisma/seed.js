const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const leaderEmail =
    process.env.SEED_LEADER_EMAIL?.toLowerCase().trim() ||
    "leader@example.com";
  const leaderPassword =
    process.env.SEED_LEADER_PASSWORD || "Leader123!";
  const leaderName = process.env.SEED_LEADER_NAME || "Leader";

  const hashedPassword = await bcrypt.hash(leaderPassword, 10);

  const leader = await prisma.user.upsert({
    where: { email: leaderEmail },
    update: {
      name: leaderName,
      role: "leader",
    },
    create: {
      email: leaderEmail,
      password: hashedPassword,
      name: leaderName,
      role: "leader",
    },
  });

  const now = new Date();
  const rooms = [
    {
      name: "Room Alpha",
      startSchedule: addHours(now, 1),
      endSchedule: addHours(now, 2),
      status: "approved",
      description: "Daily standup",
      userId: leader.id,
    },
    {
      name: "Room Beta",
      startSchedule: addHours(now, 3),
      endSchedule: addHours(now, 4),
      status: "pending",
      description: "Planning meeting",
      userId: leader.id,
    },
    {
      name: "Room Gamma",
      startSchedule: addHours(now, 5),
      endSchedule: addHours(now, 6),
      status: "pending",
      description: "1:1 sync",
      userId: leader.id,
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {
        startSchedule: room.startSchedule,
        endSchedule: room.endSchedule,
        status: room.status,
        description: room.description,
        userId: room.userId,
      },
      create: room,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
