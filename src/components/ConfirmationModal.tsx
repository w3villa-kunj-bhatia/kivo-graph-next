"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDangerous?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDangerous = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border)",
        }}
        className="border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div
          style={{ borderColor: "var(--border)" }}
          className="flex justify-between items-center p-4 border-b"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isDangerous
                  ? "bg-red-500/10 text-red-500"
                  : "bg-orange-500/10 text-orange-500"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3
              style={{ color: "var(--text-main)" }}
              className="text-lg font-bold"
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ color: "var(--text-sub)" }}
            className="hover:opacity-70 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p
            style={{ color: "var(--text-sub)" }}
            className="text-sm leading-relaxed"
          >
            {message}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "var(--card-hover)",
            borderColor: "var(--border)",
          }}
          className="flex justify-end gap-3 p-4 border-t"
        >
          <button
            onClick={onClose}
            style={{ color: "var(--text-main)" }}
            className="px-4 py-2 text-sm font-medium hover:opacity-80 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
