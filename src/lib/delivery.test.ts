import { describe, it, expect } from "vitest";
import {
  normalizeDepartment,
  COLOMBIA_DEPARTMENTS,
} from "@/lib/delivery";

describe("normalizeDepartment", () => {
  it("normalizes accent characters and lowercases", () => {
    expect(normalizeDepartment("Bogotá D.C.")).toBe("bogota d.c.");
    expect(normalizeDepartment("Cundinamarca")).toBe("cundinamarca");
    expect(normalizeDepartment("Antioquia")).toBe("antioquia");
  });

  it("handles empty input", () => {
    expect(normalizeDepartment("")).toBe("");
    expect(normalizeDepartment(null as unknown as string)).toBe("");
    expect(normalizeDepartment(undefined as unknown as string)).toBe("");
  });

  it("trims whitespace and lowercases", () => {
    expect(normalizeDepartment("  Bogota D.C.  ")).toBe("bogota d.c.");
  });

  it("normalizes multiple spaces and lowercases", () => {
    expect(normalizeDepartment("Bogota    D.C.")).toBe("bogota d.c.");
  });
});

describe("COLOMBIA_DEPARTMENTS", () => {
  it("includes Bogota D.C.", () => {
    expect(COLOMBIA_DEPARTMENTS).toContain("Bogota D.C.");
  });

  it("includes all major departments", () => {
    expect(COLOMBIA_DEPARTMENTS).toContain("Antioquia");
    expect(COLOMBIA_DEPARTMENTS).toContain("Valle del Cauca");
    expect(COLOMBIA_DEPARTMENTS).toContain("Cundinamarca");
  });

  it("has 33 departments", () => {
    expect(COLOMBIA_DEPARTMENTS.length).toBe(33);
  });
});