"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Share2, Check, Send, Link2, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface SharePopoverProps {
  productName: string;
  productPrice: string;
}

export function SharePopover({ productName, productPrice }: SharePopoverProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag prevents navigator/share hydration drift
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!shareOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setShareOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [shareOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${productName} - ${productPrice}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (typeof window === "undefined" || !navigator.share) return;
    await navigator.share({
      title: productName,
      text: `${productName} - ${productPrice}`,
      url: window.location.href,
    });
    setShareOpen(false);
  };

  const handleCopyLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setLinkCopied(false);
      setShareOpen(false);
    }, 1500);
  }, []);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setShareOpen(!shareOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-emerald-300 hover:text-gray-900 hover:shadow-sm"
        aria-label={
          t("product.share") !== "product.share"
            ? t("product.share")
            : "Compartir"
        }
        aria-expanded={shareOpen}
      >
        <Share2 className="h-4 w-4" />
      </button>
      {shareOpen && (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)] animate-fade-in-up">
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Compartir producto
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {productName}
            </p>
          </div>
          {mounted && typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-slate-100"
            >
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
              Compartir nativo
            </button>
          )}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-emerald-50"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100"
          >
            {linkCopied ? (
              <>
                <Check className="ml-1 h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Link2 className="ml-1 h-4 w-4 text-gray-500" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
