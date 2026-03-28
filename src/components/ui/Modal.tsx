"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "m-auto p-6 rounded-xl max-w-lg w-full bg-white shadow-2xl backdrop:bg-black/50",
        "open:animate-in open:fade-in open:zoom-in-95",
        className,
      )}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="flex justify-between items-center mb-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <button onClick={onClose} aria-label="Cerrar" className="p-1 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
