"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  description?: string;
}

interface ToastContextValue {
  toast: (
    message: string,
    variant?: ToastVariant,
    description?: string,
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "border-emerald-200 bg-gradient-to-r from-emerald-50/95 to-emerald-50/85 text-emerald-900 shadow-lg",
  error:
    "border-red-200 bg-gradient-to-r from-red-50/95 to-red-50/85 text-red-900 shadow-lg",
  info: "border-blue-200 bg-gradient-to-r from-blue-50/95 to-blue-50/85 text-blue-900 shadow-lg",
  warning:
    "border-amber-200 bg-gradient-to-r from-amber-50/95 to-amber-50/85 text-amber-900 shadow-lg",
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const Icon = VARIANT_ICONS[toast.variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      layout
      className={cn(
        "relative pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium backdrop-blur-xl",
        VARIANT_STYLES[toast.variant],
      )}
      role="alert"
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div
        className={cn(
          "w-5 h-5 shrink-0 mt-0.5",
          VARIANT_ICON_COLORS[toast.variant],
        )}
      >
        <Icon className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{toast.message}</p>
        {toast.description && (
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-full p-1 opacity-50 hover:opacity-100 hover:bg-black/5 transition-all"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-2xl">
        <div
          className={cn(
            "h-full origin-left",
            toast.variant === "success" ? "bg-emerald-400" :
            toast.variant === "error" ? "bg-red-400" :
            toast.variant === "warning" ? "bg-amber-400" : "bg-blue-400",
          )}
          style={{ animation: "toast-progress 4s linear forwards" }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timer) => clearTimeout(timer));
      timeouts.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "success",
      description?: string,
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, message, variant, description }]);
      const timer = setTimeout(() => {
        timeoutsRef.current.delete(id);
        dismiss(id);
      }, 4500);
      timeoutsRef.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <AnimatePresence mode="popLayout">
        <div
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col-reverse gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none sm:left-auto sm:right-6 sm:translate-x-0 sm:w-auto sm:max-w-md"
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
