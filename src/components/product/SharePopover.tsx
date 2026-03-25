"use client";

import { useState, useCallback } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface SharePopoverProps {
  productName: string;
  productPrice: string;
}

export function SharePopover({ productName, productPrice }: SharePopoverProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { t } = useLanguage();

  const handleShareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${productName} - ${productPrice}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShareOpen(false);
  };

  const handleCopyLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
      setShareOpen(false);
    }, 1500);
  }, []);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setShareOpen(!shareOpen)}
        className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-emerald-700/40 hover:shadow-sm transition-all"
        aria-label={
          t("product.share") !== "product.share"
            ? t("product.share")
            : "Compartir"
        }
      >
        <Share2 className="w-4 h-4" />
      </button>
      {shareOpen && (
        <div className="absolute right-0 top-11 z-20 rounded-xl border border-gray-100 bg-white shadow-xl p-2 w-48 animate-fade-in-up">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              W
            </span>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 ml-1" />
                <span className="text-emerald-700 font-medium">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500 ml-1" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
