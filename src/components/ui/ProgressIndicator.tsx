"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (step: number) => void;
}

export function ProgressIndicator({
  steps,
  currentStep,
  className,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol role="list" className="flex items-center justify-between w-full">
        {steps.map((step, stepIndex) => {
          const isComplete = stepIndex < currentStep;
          const isCurrent = stepIndex === currentStep;
          const isClickable = onStepClick && stepIndex < currentStep;

          return (
            <li
              key={step.label}
              className={cn(
                "relative flex flex-col items-center flex-1",
                stepIndex !== steps.length - 1 && "pr-2 sm:pr-4"
              )}
            >
              {/* Connector line */}
              {stepIndex !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 -ml-px hidden sm:block",
                    isComplete
                      ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]"
                      : "bg-[var(--border)]"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(stepIndex)}
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-500 ease-out group",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2",
                  isComplete && "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] hover:scale-110",
                  isCurrent && "bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-strong)] shadow-lg shadow-[var(--secondary-glow)] scale-110",
                  !isComplete && !isCurrent && "bg-[var(--surface-muted)] border-2 border-[var(--border)]",
                  isClickable && "cursor-pointer hover:shadow-md"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.label} - ${isComplete ? "Completed" : isCurrent ? "Current" : "Upcoming"}`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-fade-in-scale" />
                ) : isCurrent ? (
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[var(--muted-faint)]" />
                )}
              </button>

              {/* Label */}
              <div className="mt-2 sm:mt-3 text-center">
                <p
                  className={cn(
                    "text-xs sm:text-sm font-semibold transition-colors duration-300",
                    isCurrent && "text-[var(--foreground)]",
                    isComplete && "text-[var(--accent-strong)]",
                    !isComplete && !isCurrent && "text-[var(--muted-faint)]"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={cn(
                      "text-[10px] sm:text-xs mt-0.5 hidden sm:block",
                      isCurrent && "text-[var(--muted-soft)]",
                      isComplete && "text-[var(--muted-soft)]",
                      !isComplete && !isCurrent && "text-[var(--muted-faint)]"
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
