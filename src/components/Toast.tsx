"use client";

import { CheckCircle, XCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | null;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message || !type) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 duration-300 ${
        isSuccess
          ? "bg-green-500/10 border-green-500/50 text-green-400"
          : "bg-red-500/10 border-red-500/50 text-red-400"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-8 h-8" />
      ) : (
        <XCircle className="w-8 h-8" />
      )}
      <p className="text-sm font-medium whitespace-nowrap">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
