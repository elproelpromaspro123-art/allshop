"use client";

import { CheckCircle2, ClipboardList, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { storefrontContent } from "@/content/config/storefront-content";

export function StorefrontCheckoutIntro() {
  const { checkout } = storefrontContent;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div>
        <PageHeader
          className="mt-5"
          eyebrow={checkout.eyebrow}
          title={checkout.title}
          description={checkout.description}
        />

        <div className="mt-8 mb-2 max-w-3xl border-b border-[var(--border-subtle)] pb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[var(--shadow-button)] ring-4 ring-[var(--accent-glow)]">
                <span className="text-sm font-bold">1</span>
              </div>
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Detalles
              </span>
            </div>
            <div className="relative mx-4 h-[2px] flex-1 overflow-hidden bg-[var(--accent)]/30">
              <div className="absolute inset-0 w-1/2 rounded-full bg-[var(--accent)]" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-soft)]">
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="text-xs font-medium text-[var(--muted-soft)]">
                Confirmar
              </span>
            </div>
            <div className="mx-4 h-[2px] flex-1 bg-[var(--border-subtle)]" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-soft)]">
                <span className="text-sm font-bold">3</span>
              </div>
              <span className="text-xs font-medium text-[var(--muted-soft)]">
                Recibir
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--accent)]/18 bg-[var(--accent-surface)] px-4 py-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent-strong)]">
              <ClipboardList className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {checkout.cards[0].title}
            </p>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              {checkout.cards[0].detail}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary-surface)] text-[var(--secondary-strong)]">
              <User className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {checkout.cards[1].title}
            </p>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              {checkout.cards[1].detail}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {checkout.cards[2].title}
            </p>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              {checkout.cards[2].detail}
            </p>
          </div>
        </div>
      </div>

      <div className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 text-white sm:px-6 sm:py-7">
        <div className="relative z-[1]">
          <p className="v-kicker text-white/76">{checkout.sideKicker}</p>
          <h2 className="mt-3 text-title-lg text-white">{checkout.sideTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-white/76">
            {checkout.sideDescription}
          </p>

          <div className="mt-5 space-y-3">
            {checkout.sideBullets.map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
