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
