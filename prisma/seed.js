const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const leaderEmail = process.env.SEED_LEADER_EMAIL?.toLowerCase().trim() || "leader@example.com";
  const leaderPassword = process.env.SEED_LEADER_PASSWORD || "Leader123!";
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

  function makeDate(y, m, d, h) {
    return new Date(y, m - 1, d, h, 0, 0);
  }

  const rooms = [
    {
      name: "Room Alpha",
      startSchedule: makeDate(2026, 2, 9, 9),
      endSchedule: makeDate(2026, 2, 9, 10),
      status: "approved",
      description: "Daily standup",
      userId: leader.id,
    },
    {
      name: "Room Beta",
      startSchedule: makeDate(2026, 2, 9, 11),
      endSchedule: makeDate(2026, 2, 9, 12),
      status: "pending",
      description: "Planning meeting",
      userId: leader.id,
    },
    {
      name: "Room Gamma",
      startSchedule: makeDate(2026, 2, 10, 9),
      endSchedule: makeDate(2026, 2, 10, 10),
      status: "approved",
      description: "1:1 sync",
      userId: leader.id,
    },
    {
      name: "Room Delta",
      startSchedule: makeDate(2026, 2, 10, 11),
      endSchedule: makeDate(2026, 2, 10, 12),
      status: "pending",
      description: "Design review",
      userId: leader.id,
    },
    {
      name: "Room Epsilon",
      startSchedule: makeDate(2026, 2, 11, 9),
      endSchedule: makeDate(2026, 2, 11, 10),
      status: "approved",
      description: "Sprint demo",
      userId: leader.id,
    },
    {
      name: "Room Zeta",
      startSchedule: makeDate(2026, 2, 11, 11),
      endSchedule: makeDate(2026, 2, 11, 12),
      status: "pending",
      description: "Roadmap sync",
      userId: leader.id,
    },
    {
      name: "Room Eta",
      startSchedule: makeDate(2026, 2, 12, 9),
      endSchedule: makeDate(2026, 2, 12, 10),
      status: "approved",
      description: "Hiring interview",
      userId: leader.id,
    },
    {
      name: "Room Theta",
      startSchedule: makeDate(2026, 2, 12, 11),
      endSchedule: makeDate(2026, 2, 12, 12),
      status: "pending",
      description: "Tech debt cleanup",
      userId: leader.id,
    },
    {
      name: "Room Iota",
      startSchedule: makeDate(2026, 2, 13, 9),
      endSchedule: makeDate(2026, 2, 13, 10),
      status: "approved",
      description: "Weekly recap",
      userId: leader.id,
    },
    {
      name: "Room Kappa",
      startSchedule: makeDate(2026, 2, 13, 11),
      endSchedule: makeDate(2026, 2, 13, 12),
      status: "pending",
      description: "Retrospective",
      userId: leader.id,
    },
  ];

  await prisma.room.deleteMany();
  await prisma.room.createMany({
    data: rooms,
  });
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
