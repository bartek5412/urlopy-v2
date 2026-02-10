import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function LeaveRequestTypeDialog({
  open,
  setOpen,
  userId,
}: {
  userId: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [payload, setPayload] = useState({
    name: "",
    description: "",
    userId: "",
  });
  const handleSubmit = async () => {
    const response = await fetch("/api/request-type", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      setOpen(false);
      alert("Typ urlopy poprawnie dodany");
    } else {
      alert(
        `Wystąpił błąd podczas dodawanie typu urlopu: ${response.statusText}`,
      );
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild></DialogTrigger>

        <DialogTitle className="sr-only">Test</DialogTitle>
        <DialogContent>
          <Card className="m-4">
            <CardHeader>
              <CardTitle>Dodaj nowy typ urlopu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Label className="col-span-2">Nazwa typu urlopu</Label>
                <Input
                  value={payload.name}
                  onChange={(e) =>
                    setPayload({ ...payload, name: e.target.value })
                  }
                  className="col-span-2"
                  placeholder="Nazwa typu urlopu (nazwa wyświetlana w aplikacji)"
                />
                <Label className="col-span-2">Opis urlopu</Label>
                <Input
                  value={payload.description}
                  onChange={(e) =>
                    setPayload({ ...payload, description: e.target.value })
                  }
                  className="col-span-2"
                  placeholder="Opis typu urlopu"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full mt-6">
                Dodaj typ urlopu
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
