"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        router.push("/leave-request");
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Błąd rejestracji");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      setErrorMessage("Wystąpił błąd podczas rejestracji");
      setIsErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="absolute inset-0 z-0">
        <img
          src="/header.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle>Zarejestruj się</CardTitle>
          <CardDescription>Utwórz nowe konto, aby kontynuować</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Imię i nazwisko</Label>
                <Input
                  required
                  id="name"
                  type="text"
                  placeholder="Wprowadź imię i nazwisko"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Wprowadź adres email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  placeholder="Wprowadź hasło"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Masz już konto? Zaloguj się
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Błąd rejestracji</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
