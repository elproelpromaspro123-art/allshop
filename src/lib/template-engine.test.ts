import { describe, it, expect } from "vitest";

// Test template/string interpolation utilities
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

function buildGreeting(name: string, hour: number): string {
  if (hour < 12) return `Buenos días, ${name}`;
  if (hour < 19) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

describe("interpolate", () => {
  it("replaces template variables", () => {
    expect(interpolate("Hola {{name}}", { name: "Juan" })).toBe("Hola Juan");
  });

  it("replaces multiple variables", () => {
    expect(interpolate("{{greeting}} {{name}}", { greeting: "Hola", name: "Juan" })).toBe("Hola Juan");
  });

  it("replaces missing vars with empty string", () => {
    expect(interpolate("Hola {{name}}", {})).toBe("Hola ");
  });
});

describe("pluralize", () => {
  it("uses singular for 1", () => {
    expect(pluralize(1, "producto", "productos")).toBe("1 producto");
  });

  it("uses plural for 0", () => {
    expect(pluralize(0, "producto", "productos")).toBe("0 productos");
  });

  it("uses plural for > 1", () => {
    expect(pluralize(5, "producto", "productos")).toBe("5 productos");
  });
});

describe("buildGreeting", () => {
  it("returns morning greeting", () => {
    expect(buildGreeting("Ana", 9)).toBe("Buenos días, Ana");
  });

  it("returns afternoon greeting", () => {
    expect(buildGreeting("Ana", 15)).toBe("Buenas tardes, Ana");
  });

  it("returns evening greeting", () => {
    expect(buildGreeting("Ana", 21)).toBe("Buenas noches, Ana");
  });
});
