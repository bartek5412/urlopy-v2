"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onClose, duration = 5000 }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    info: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    error: "bg-red-500 text-white",
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top-5",
        typeStyles[type]
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded-md p-1 hover:bg-black/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "info" | "success" | "warning" | "error" }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
