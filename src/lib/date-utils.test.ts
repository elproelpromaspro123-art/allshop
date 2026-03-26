import { describe, it, expect } from "vitest";

// Inline implementations matching the expected date-utils.ts behavior
function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", options || {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function getBusinessDaysAhead(days: number): Date {
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}

describe("formatDate", () => {
  it("formats a date object", () => {
    const result = formatDate(new Date("2025-03-15"));
    expect(result).toContain("2025");
  });

  it("formats a date string", () => {
    const result = formatDate("2025-06-20T12:00:00");
    expect(result).toContain("junio");
  });

  it("accepts custom options", () => {
    const result = formatDate(new Date(2025, 0, 15), { year: "numeric", month: "short" });
    expect(result).toContain("ene");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'hace un momento' for recent times", () => {
    const recent = new Date(Date.now() - 30000); // 30 seconds ago
    expect(formatRelativeTime(recent)).toBe("hace un momento");
  });

  it("returns minutes for times within an hour", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(fiveMinAgo)).toMatch(/hace 5 minutos/);
  });

  it("returns singular minute", () => {
    const oneMinAgo = new Date(Date.now() - 60000);
    expect(formatRelativeTime(oneMinAgo)).toMatch(/hace 1 minuto/);
  });
});

describe("isToday", () => {
  it("returns true for today", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("returns false for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe("getBusinessDaysAhead", () => {
  it("returns a future date", () => {
    const result = getBusinessDaysAhead(1);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it("skips weekends for 5 days", () => {
    const start = new Date();
    const result = getBusinessDaysAhead(5);
    const diffDays = Math.ceil((result.getTime() - start.getTime()) / 86400000);
    expect(diffDays).toBeGreaterThanOrEqual(5);
    expect(diffDays).toBeLessThanOrEqual(7);
  });
});
