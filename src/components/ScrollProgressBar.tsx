"use client";

import { useEffect, useState } from "react";

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        setProgress((scrollTop / scrollHeight) * 100);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (progress < 1) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-700 via-indigo-500 to-emerald-500 transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: `0 0 ${Math.min(progress / 10, 8)}px rgba(16,185,129,0.3)`,
        }}
      />
    </div>
  );
}
