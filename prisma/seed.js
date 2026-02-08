const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const users = require("./seed-data");

const prisma = new PrismaClient();

function generateRandomPassword(length = 12) {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function main() {
  const generatedPasswords = [];

  for (const user of users) {
    const shouldGeneratePassword =
      !user.password || user.password === "RANDOM";
    const plainPassword = shouldGeneratePassword
      ? generateRandomPassword()
      : user.password;
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existingUser) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.user.create({
      data: {
        email: user.email.toLowerCase().trim(),
        password: hashedPassword,
        name: user.name,
        role: user.role || "employee",
        daysAvailable: user.daysAvailable ?? 26,
        daysPerYear: user.daysPerYear ?? 26,
        mustChangePassword: shouldGeneratePassword ? true : false,
      },
    });

    if (shouldGeneratePassword) {
      generatedPasswords.push({
        email: user.email,
        password: plainPassword,
      });
    }
  }

  const normalizedSeedEmails = users.map((user) =>
    user.email.toLowerCase().trim()
  );
  const seededUsers = await prisma.user.findMany({
    where: {
      email: {
        in: normalizedSeedEmails,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });
  const idByEmail = new Map(
    seededUsers.map((user) => [user.email.toLowerCase(), user.id])
  );

  for (const user of users) {
    if (!user.leaderEmail) continue;
    const employeeEmail = user.email.toLowerCase().trim();
    const leaderEmail = user.leaderEmail.toLowerCase().trim();
    const employeeId = idByEmail.get(employeeEmail);
    const leaderId = idByEmail.get(leaderEmail);

    if (!employeeId || !leaderId) continue;

    await prisma.user.update({
      where: { id: employeeId },
      data: { leaderId },
    });
  }

  const demoLeaveRequests = [
    {
      employeeEmail: "jan.nowak@example.com",
      startDate: "2026-01-13",
      endDate: "2026-01-17",
      status: "approved",
      description: "Urlop zimowy",
      createdAt: "2026-01-05T08:30:00.000Z",
      acceptedAt: "2026-01-06T10:15:00.000Z",
      acceptedByEmail: "bartek5412@gmail.com",
    },
    {
      employeeEmail: "jan.nowak@example.com",
      startDate: "2026-03-10",
      endDate: "2026-03-12",
      status: "rejected",
      description: "Sprawy rodzinne",
      createdAt: "2026-03-01T09:00:00.000Z",
    },
    {
      employeeEmail: "anna.kowalska@example.com",
      startDate: "2026-02-18",
      endDate: "2026-02-20",
      status: "pending",
      description: "Wyjazd planowany",
      createdAt: "2026-02-08T12:45:00.000Z",
    },
    {
      employeeEmail: "anna.kowalska@example.com",
      startDate: "2026-04-07",
      endDate: "2026-04-11",
      status: "approved",
      description: "Wyjazd rodzinny",
      createdAt: "2026-03-20T14:00:00.000Z",
      acceptedAt: "2026-03-22T09:10:00.000Z",
      acceptedByEmail: "bartek5412@gmail.com",
    },
    {
      employeeEmail: "piotr.mazur@example.com",
      startDate: "2026-02-24",
      endDate: "2026-02-28",
      status: "pending",
      description: "Urlop wypoczynkowy",
      createdAt: "2026-02-07T16:20:00.000Z",
    },
    {
      employeeEmail: "piotr.mazur@example.com",
      startDate: "2026-01-27",
      endDate: "2026-01-31",
      status: "rejected",
      description: "Wyjazd prywatny",
      createdAt: "2026-01-12T10:00:00.000Z",
    },
    {
      employeeEmail: "demo.user@example.com",
      startDate: "2026-05-05",
      endDate: "2026-05-09",
      status: "approved",
      description: "Demo: urlop majowy",
      createdAt: "2026-04-20T11:15:00.000Z",
      acceptedAt: "2026-04-22T08:40:00.000Z",
      acceptedByEmail: "ewa.lider@example.com",
    },
    {
      employeeEmail: "demo.user@example.com",
      startDate: "2026-06-16",
      endDate: "2026-06-18",
      status: "pending",
      description: "Demo: wniosek w trakcie",
      createdAt: "2026-06-01T09:30:00.000Z",
    },
  ];

  for (const request of demoLeaveRequests) {
    const employeeEmail = request.employeeEmail.toLowerCase().trim();
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employeeEmail,
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
      },
      select: { id: true },
    });

    if (existing) continue;

    const acceptedById = request.acceptedByEmail
      ? idByEmail.get(request.acceptedByEmail.toLowerCase().trim())
      : undefined;

    await prisma.leaveRequest.create({
      data: {
        employeeEmail,
        startDate: request.startDate,
        endDate: request.endDate,
        description: request.description || null,
        status: request.status,
        createdAt: request.createdAt
          ? new Date(request.createdAt)
          : new Date(),
        ...(request.status === "approved"
          ? {
              acceptedAt: request.acceptedAt
                ? new Date(request.acceptedAt)
                : new Date(),
              acceptedById: acceptedById ?? null,
            }
          : {}),
      },
    });
  }

  if (generatedPasswords.length > 0) {
    console.log("Wygenerowane hasla:");
    generatedPasswords.forEach((entry) => {
      console.log(`${entry.email}: ${entry.password}`);
    });

    const outputPath = path.join(__dirname, "seed-output.txt");
    const fileContent = generatedPasswords
      .map((entry) => `${entry.email}: ${entry.password}`)
      .join("\n");
    fs.writeFileSync(outputPath, fileContent, "utf8");
    console.log(`Zapisano hasla do pliku: ${outputPath}`);
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
