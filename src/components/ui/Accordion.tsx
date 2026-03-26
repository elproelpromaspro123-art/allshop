"use client";

import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenId?: string | null;
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenId = null,
  className,
}: AccordionProps) {
  const openIdSet = useState(() => {
    return defaultOpenId ? new Set([defaultOpenId]) : new Set<string>();
  })[0];
  const [, setOpenIds] = useState(0);

  const toggle = useCallback((id: string) => {
    openIdSet.clear();
    if (!allowMultiple) {
      openIdSet.add(id);
    } else {
      openIdSet.add(id);
    }
    setOpenIds((n) => n + 1);
  }, [allowMultiple, openIdSet]);

  return (
    <div className={cn("divide-y divide-gray-200", className)}>
      {items.map((item) => (
        <AccordionSection
          key={item.id}
          item={item}
          isOpen={openIdSet.has(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

interface AccordionSectionProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionSection({
  item,
  isOpen,
  onToggle,
}: AccordionSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left font-medium text-gray-900 hover:text-emerald-600 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{item.title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="pb-4 text-gray-600">{item.content}</div>
      </div>
    </div>
  );
}