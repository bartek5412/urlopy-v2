const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const users = require("./seed-data");

const prisma = new PrismaClient();

async function main() {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email.toLowerCase().trim() },
      update: {
        name: user.name,
        role: user.role || "employee",
        daysAvailable: user.daysAvailable ?? 26,
        daysPerYear: user.daysPerYear ?? 26,
        password: hashedPassword,
      },
      create: {
        email: user.email.toLowerCase().trim(),
        password: hashedPassword,
        name: user.name,
        role: user.role || "employee",
        daysAvailable: user.daysAvailable ?? 26,
        daysPerYear: user.daysPerYear ?? 26,
      },
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
