"use client";

import { useEffect, useRef, useState } from "react";
import { Package, Star, MapPin, Clock } from "lucide-react";

interface StatItem {
  icon: typeof Package;
  value: string;
  numericValue: number;
  suffix: string;
  label: string;
  color: string;
  bgColor: string;
}

const STATS: StatItem[] = [
  {
    icon: Package,
    value: "100",
    numericValue: 100,
    suffix: "+",
    label: "Pedidos entregados",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Star,
    value: "4.6",
    numericValue: 4.6,
    suffix: "/5",
    label: "Satisfacción",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: MapPin,
    value: "Colombia",
    numericValue: 0,
    suffix: "",
    label: "Cobertura nacional",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    icon: Clock,
    value: "< 2h",
    numericValue: 0,
    suffix: "",
    label: "Tiempo de respuesta",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

function useCountUp(target: number, isVisible: boolean, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isVisible || target === 0) return;

    let start = 0;
    const isDecimal = target % 1 !== 0;
    const increment = target / (duration / 16);
    let raf: number;

    const step = () => {
      start += increment;
      if (start >= target) {
        setValue(target);
        return;
      }
      setValue(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, target, duration]);

  return value;
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="group flex items-center gap-3.5 rounded-2xl border border-[var(--border-subtle)] bg-white/80 backdrop-blur-sm px-4 py-3.5 transition-all duration-300 hover:border-[var(--border)] hover:shadow-[var(--shadow-card)]"
          >
            <div
              className={`shrink-0 w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}
            >
              <Icon className={`w-[18px] h-[18px] ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-[var(--foreground)] stat-number leading-tight">
                <StatValue stat={stat} isVisible={isVisible} />
              </p>
              <p className="text-[11px] text-[var(--muted-soft)] font-medium truncate">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatValue({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const count = useCountUp(stat.numericValue, isVisible);

  if (stat.numericValue === 0) {
    return <>{stat.value}</>;
  }

  const isDecimal = stat.numericValue % 1 !== 0;
  const display = isDecimal ? count.toFixed(1) : count;

  return (
    <>
      {display}
      {stat.suffix}
    </>
  );
}
