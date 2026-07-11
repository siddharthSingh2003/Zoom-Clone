"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
