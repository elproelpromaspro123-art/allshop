"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({ open, onClose, title, children, side = "right", className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <div
        ref={drawerRef}
        className={cn(
          "fixed top-0 bottom-0 z-50 w-80 bg-white shadow-2xl transition-transform duration-300",
          side === "right" ? "right-0 translate-x-full" : "left-0 -translate-x-full",
          open && "translate-x-0",
          className,
        )}
      >
        <div className="flex justify-between items-center p-4 border-b">
          {title && <h2 className="font-semibold">{title}</h2>}
          <button onClick={onClose} aria-label="Cerrar" className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">{children}</div>
      </div>
    </>
  );
}
