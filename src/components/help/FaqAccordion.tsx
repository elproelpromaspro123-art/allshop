import { ChevronDown } from "lucide-react";

interface FaqAccordionItem {
  question: string;
  answer: string;
  open?: boolean;
}

interface FaqAccordionProps {
  items: FaqAccordionItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          className="group overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm open:border-emerald-300/60 open:shadow-[0_16px_36px_rgba(16,185,129,0.06)]"
          open={item.open}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5">
            <span className="text-left text-sm font-semibold leading-6 text-slate-950 sm:text-base">
              {item.question}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-700" />
          </summary>
          <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {item.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
