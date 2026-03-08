"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
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
    if (!pathname || pathname.startsWith("/panel-privado/")) return;

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
    <div className="fixed bottom-4 left-1/2 z-[100] w-[min(95vw,780px)] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-amber-900">
          El stock de los productos se ha actualizado. Por favor reinicia la
          pagina o presiona el boton para hacerlo ahora.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("_rt", String(Date.now()));
              window.location.replace(url.toString());
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar pagina
          </Button>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
