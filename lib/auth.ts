import prisma from "./db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { validateEmail, validatePassword, sanitizeString } from "./validation";

export interface User {
  id: number;
  email: string;
  name?: string;
  role?: string;
  leaderId?: number | null;
  daysAvailable?: number;
  daysPerYear?: number;
}

// Utwórz nowego użytkownika
export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<{ user: User | null; error?: string }> {
  try {
    // Walidacja emaila
    if (!validateEmail(email)) {
      return { user: null, error: "Nieprawidłowy format emaila" };
    }

    // Walidacja hasła
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { user: null, error: passwordValidation.error };
    }

    // Sanityzacja emaila i nazwy
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name ? sanitizeString(name, 100) : null;

    // Sprawdź, czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return { user: null, error: "Użytkownik z tym emailem już istnieje" };
    }

    // Hashuj hasło
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: "employee", // Domyślnie employee
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || "employee",
        leaderId: user.leaderId || null,
        daysAvailable: user.daysAvailable ?? 26,
        daysPerYear: user.daysPerYear ?? 26,
      },
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Sprawdź, czy błąd wynika z duplikatu emaila (unique constraint) - backup check
    if (error?.code === "P2002") {
      return { user: null, error: "Użytkownik z tym emailem już istnieje" };
    }
    // Jeśli to inny błąd, rzuć go dalej
    throw error;
  }
}

// Zaloguj użytkownika
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  try {
    // Walidacja emaila
    if (!validateEmail(email)) {
      return { user: null, error: "Nieprawidłowy format emaila" };
    }

    // Walidacja hasła
    if (!password || password.length === 0) {
      return { user: null, error: "Hasło jest wymagane" };
    }

    const sanitizedEmail = email.toLowerCase().trim();

    console.log("Attempting login for email:", sanitizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      console.log("User not found in database:", sanitizedEmail);
      // Nie ujawniaj, czy użytkownik istnieje (security best practice)
      return { user: null, error: "Nieprawidłowy email lub hasło" };
    }

    console.log("User found:", { id: user.id, email: user.email });

    // Porównaj zahashowane hasła
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return { user: null, error: "Nieprawidłowy email lub hasło" };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || "employee",
        leaderId: user.leaderId || null,
        daysAvailable: user.daysAvailable ?? 26,
        daysPerYear: user.daysPerYear ?? 26,
      },
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return { user: null, error: "Wystąpił błąd podczas logowania" };
  }
}

// Pobierz aktualnego użytkownika z sesji
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role || "employee",
      leaderId: user.leaderId || null,
      daysAvailable: user.daysAvailable ?? 26,
      daysPerYear: user.daysPerYear ?? 26,
    };
  } catch {
    return null;
  }
}
