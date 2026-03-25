"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Truck,
  PackageX,
  ZoomIn,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeImage: number;
  setActiveImage: (index: number) => void;
  setIsManualImageSelection: (value: boolean) => void;
  discount: number;
  productHasFreeShipping: boolean;
  shouldShowOutOfStockImagePlaceholder: boolean;
  selectedColor: string | null;
  videoSource: string | null;
  isZoomModalOpen: boolean;
  setIsZoomModalOpen: (value: boolean) => void;
  ImageZoomModal: React.ComponentType<{
    src: string;
    alt: string;
    open: boolean;
    onClose: () => void;
  }>;
}

export function ProductGallery({
  images,
  productName,
  activeImage,
  setActiveImage,
  setIsManualImageSelection,
  discount,
  productHasFreeShipping,
  shouldShowOutOfStockImagePlaceholder,
  selectedColor,
  videoSource,
  isZoomModalOpen,
  setIsZoomModalOpen,
  ImageZoomModal,
}: ProductGalleryProps) {
  const { t } = useLanguage();
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset video state when source changes
    setVideoUnavailable(false);
  }, [videoSource]);

  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    },
    [],
  );

  return (
    <div className="z-10 flex flex-col gap-4 lg:sticky lg:top-24">
      <div
        ref={imageContainerRef}
        className="group/img relative mb-3 aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-sm cursor-zoom-in"
        onMouseMove={handleImageMouseMove}
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => {
          setIsHoveringImage(false);
          setMousePosition({ x: 50, y: 50 });
        }}
        onClick={() => setIsZoomModalOpen(true)}
      >
        {shouldShowOutOfStockImagePlaceholder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-700 bg-red-50/80">
            <PackageX className="w-24 h-24 sm:w-28 sm:h-28" />
            <p className="text-base sm:text-lg font-bold uppercase tracking-wide">
              {t("product.variantOutOfStockTitle")}
            </p>
            <p className="text-sm text-red-600">
              {selectedColor
                ? t("product.variantOutOfStockColor", { color: selectedColor })
                : t("product.variantOutOfStockGeneric")}
            </p>
          </div>
        ) : images[activeImage] ? (
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,247,250,0.36))]" />
            <Image
              src={images[activeImage]}
              alt={`${productName} - imagen ${activeImage + 1}`}
              fill
              className="object-contain p-4 transition-transform duration-200 ease-out sm:p-6 md:p-7"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
              loading="eager"
              quality={75}
              style={{
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transform: isHoveringImage ? "scale(1.8)" : "scale(1)",
              }}
            />
            <div className="absolute bottom-3 right-3 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white">
                <ZoomIn className="w-3.5 h-3.5" />
                Zoom
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {discount > 0 && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-[#071a0a] shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              -{discount}%
            </span>
          )}
        </div>

        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1.5 sm:text-xs">
          <Truck className="w-3.5 h-3.5" />
          {productHasFreeShipping
            ? t("product.freeShipping")
            : t("product.nationalShipping")}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            onClick={() => {
              setIsManualImageSelection(true);
              setActiveImage(index);
            }}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-gray-50 transition-all sm:h-20 sm:w-20",
              activeImage === index
                ? "border-emerald-500"
                : "border-gray-200 hover:border-emerald-700/40",
            )}
            type="button"
          >
            <Image
              src={image}
              alt={`${productName} miniatura ${index + 1}`}
              fill
              className="object-contain p-1.5 sm:p-2"
              sizes="80px"
              loading={index === activeImage ? "eager" : "lazy"}
              quality={75}
            />
          </button>
        ))}
      </div>

      {videoSource ? (
        <div className="overflow-hidden rounded-[1.35rem] border border-gray-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 text-white">
              <PlayCircle className="h-4 w-4 text-emerald-300" />
              <p className="text-sm font-semibold">Video del producto</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/72">
              Vista real
            </span>
          </div>
          <div className="p-3 sm:p-4">
            {!videoUnavailable ? (
              <div className="overflow-hidden rounded-[1.1rem] border border-white/10 bg-black shadow-[0_18px_42px_rgba(0,0,0,0.3)]">
                <video
                  className="aspect-[4/5] w-full bg-black object-cover sm:aspect-video"
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="none"
                  poster={images[0] || undefined}
                  onError={() => setVideoUnavailable(true)}
                  src={videoSource}
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[1.1rem] border border-dashed border-white/15 bg-white/[0.04] px-5 text-center sm:aspect-video">
                <div className="max-w-xs">
                  <PlayCircle className="mx-auto h-10 w-10 text-emerald-300" />
                  <p className="mt-3 text-sm font-semibold text-white">
                    Video temporalmente no disponible
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/70">
                    Usa la galería de imágenes mientras restauramos esta vista.
                  </p>
                </div>
              </div>
            )}
            <p className="mt-3 text-sm leading-7 text-white/72">
              Mira el acabado, el tamaño y la presencia real del producto antes de pedirlo.
            </p>
          </div>
        </div>
      ) : null}

      {images[activeImage] && (
        <ImageZoomModal
          src={images[activeImage]}
          alt={`${productName} - imagen ${activeImage + 1}`}
          open={isZoomModalOpen}
          onClose={() => setIsZoomModalOpen(false)}
        />
      )}
    </div>
  );
}
