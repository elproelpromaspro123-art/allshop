import { describe, it, expect } from "vitest";

// Test address utilities
function normalizeAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, " ")
    .replace(/#/g, "No.")
    .replace(/\bCll\b/gi, "Calle")
    .replace(/\bCra\b/gi, "Carrera")
    .replace(/\bAv\b/gi, "Avenida");
}

function extractDepartmentFromCity(city: string): string | null {
  const cityToDepartment: Record<string, string> = {
    "bogotá": "Bogotá D.C.",
    "medellín": "Antioquía",
    "cali": "Valle del Cauca",
    "barranquilla": "Atlántico",
    "cartagena": "Bolívar",
    "bucaramanga": "Santander",
    "cúcuta": "Norte de Santander",
    "pereira": "Risaralda",
    "manizales": "Caldas",
    "ibagué": "Tolima",
  };
  return cityToDepartment[city.toLowerCase()] || null;
}

function formatFullAddress(parts: {
  address: string;
  city: string;
  department: string;
  zip?: string;
}): string {
  const zipPart = parts.zip ? ` (${parts.zip})` : "";
  return `${parts.address}, ${parts.city}, ${parts.department}${zipPart}`;
}

function isValidPostalCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

describe("normalizeAddress", () => {
  it("trims and normalizes spaces", () => {
    expect(normalizeAddress("  Calle  10  ")).toBe("Calle 10");
  });

  it("expands abbreviations", () => {
    expect(normalizeAddress("Cll 10 #5-30")).toBe("Calle 10 No.5-30");
  });

  it("expands Cra to Carrera", () => {
    expect(normalizeAddress("Cra 7 #45-20")).toBe("Carrera 7 No.45-20");
  });
});

describe("extractDepartmentFromCity", () => {
  it("maps Bogotá to Bogotá D.C.", () => {
    expect(extractDepartmentFromCity("Bogotá")).toBe("Bogotá D.C.");
  });

  it("maps Medellín to Antioquía", () => {
    expect(extractDepartmentFromCity("Medellín")).toBe("Antioquía");
  });

  it("returns null for unknown cities", () => {
    expect(extractDepartmentFromCity("Ciudad Desconocida")).toBeNull();
  });

  it("is case insensitive", () => {
    expect(extractDepartmentFromCity("bogotá")).toBe("Bogotá D.C.");
  });
});

describe("formatFullAddress", () => {
  it("formats complete address", () => {
    const result = formatFullAddress({
      address: "Calle 10 #5-30",
      city: "Bogotá",
      department: "Bogotá D.C.",
    });
    expect(result).toContain("Calle 10 #5-30");
    expect(result).toContain("Bogotá");
  });

  it("includes zip when provided", () => {
    const result = formatFullAddress({
      address: "Calle 10",
      city: "Bogotá",
      department: "Bogotá D.C.",
      zip: "110111",
    });
    expect(result).toContain("110111");
  });
});

describe("isValidPostalCode", () => {
  it("validates 6-digit codes", () => {
    expect(isValidPostalCode("110111")).toBe(true);
  });

  it("rejects 5-digit codes", () => {
    expect(isValidPostalCode("11011")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(isValidPostalCode("110abc")).toBe(false);
  });
});
