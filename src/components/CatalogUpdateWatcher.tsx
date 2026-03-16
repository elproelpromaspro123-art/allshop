"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Package, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATALOG_VERSION_POLL_MS } from "@/lib/polling-intervals";

interface VersionPayload {
  version?: string;
  updated_at?: string | null;
}

export function CatalogUpdateWatcher() {
  const pathname = usePathname();
  const [showNotice, setShowNotice] = useState(false);
  const isCheckingRef = useRef(false);
  const versionRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const isStorefrontRoute =
      pathname === "/" ||
      pathname.startsWith("/categoria/") ||
      pathname.startsWith("/producto/");

    if (!pathname || pathname.startsWith("/panel-privado/") || !isStorefrontRoute) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkVersion = async () => {
      if (isCheckingRef.current || !isMountedRef.current) return;
      isCheckingRef.current = true;

      try {
        const response = await fetch("/api/catalog/version", {
          cache: "no-store",
        });
        const payload = (await response.json()) as VersionPayload;
        const version = String(payload.version || "").trim();
        if (!version) return;

        if (!versionRef.current) {
          versionRef.current = version;
          return;
        }

        if (versionRef.current !== version) {
          setShowNotice(true);
          versionRef.current = version;
        }
      } catch {
        // Keep silent for storefront users.
      } finally {
        isCheckingRef.current = false;
      }
    };

    void checkVersion();
    intervalId = setInterval(() => {
      void checkVersion();
    }, CATALOG_VERSION_POLL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pathname]);

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[min(95vw,780px)] -translate-x-1/2">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/80 backdrop-blur-xl px-4 py-3.5 shadow-2xl shadow-amber-500/10 animate-fade-in-up">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-sm font-medium text-amber-900 pt-1">
              El stock de los productos se ha actualizado. Por favor reinicia la
              página o presiona el botón para hacerlo ahora.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-500/25"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("_rt", String(Date.now()));
                window.location.replace(url.toString());
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recargar página
            </Button>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
