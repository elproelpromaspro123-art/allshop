import { describe, it, expect } from "vitest";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateDocument,
  validateAddress,
  validateCity,
  validateDepartment,
  validateField,
  validateAllFields,
} from "./validation";

describe("validateName", () => {
  it("rejects empty", () => {
    expect(validateName("")).not.toBeNull();
  });
  it("rejects too short", () => {
    expect(validateName("Ana")).not.toBeNull();
  });
  it("accepts valid name", () => {
    expect(validateName("Carlos García")).toBeNull();
  });
  it("rejects too long", () => {
    expect(validateName("A".repeat(121))).not.toBeNull();
  });
});

describe("validateEmail", () => {
  it("rejects empty", () => {
    expect(validateEmail("")).not.toBeNull();
  });
  it("rejects invalid format", () => {
    expect(validateEmail("noarroba")).not.toBeNull();
  });
  it("accepts valid email", () => {
    expect(validateEmail("test@example.com")).toBeNull();
  });
});

describe("validatePhone", () => {
  it("rejects empty", () => {
    expect(validatePhone("")).not.toBeNull();
  });
  it("rejects too short", () => {
    expect(validatePhone("123")).not.toBeNull();
  });
  it("accepts valid phone with formatting", () => {
    expect(validatePhone("310-555-7890")).toBeNull();
  });
  it("strips non-digits for validation", () => {
    expect(validatePhone("+57 310 555 7890")).toBeNull();
  });
});

describe("validateDocument", () => {
  it("rejects empty", () => {
    expect(validateDocument("")).not.toBeNull();
  });
  it("rejects too short", () => {
    expect(validateDocument("123")).not.toBeNull();
  });
  it("accepts valid document", () => {
    expect(validateDocument("1234567890")).toBeNull();
  });
});

describe("validateAddress", () => {
  it("rejects empty", () => {
    expect(validateAddress("")).not.toBeNull();
  });
  it("rejects too short", () => {
    expect(validateAddress("Calle 1")).not.toBeNull();
  });
  it("accepts valid address", () => {
    expect(validateAddress("Calle 45 #12-34, Barrio Centro")).toBeNull();
  });
});

describe("validateCity", () => {
  it("rejects empty", () => {
    expect(validateCity("")).not.toBeNull();
  });
  it("rejects too short", () => {
    expect(validateCity("BC")).not.toBeNull();
  });
  it("accepts valid city", () => {
    expect(validateCity("Bogotá")).toBeNull();
  });
});

describe("validateDepartment", () => {
  it("rejects empty", () => {
    expect(validateDepartment("")).not.toBeNull();
  });
  it("accepts valid department", () => {
    expect(validateDepartment("Cundinamarca")).toBeNull();
  });
});

describe("validateField", () => {
  it("returns null for optional fields", () => {
    expect(validateField("zip", "")).toBeNull();
    expect(validateField("reference", "")).toBeNull();
  });
  it("validates known fields", () => {
    expect(validateField("name", "")).not.toBeNull();
    expect(validateField("email", "valid@test.com")).toBeNull();
  });
});

describe("validateAllFields", () => {
  it("returns errors for all invalid fields", () => {
    const errors = validateAllFields({
      name: "",
      email: "",
      phone: "",
      document: "",
      address: "",
      reference: "",
      city: "",
      department: "",
      zip: "",
    });
    expect(Object.keys(errors)).toContain("name");
    expect(Object.keys(errors)).toContain("email");
    expect(Object.keys(errors)).toContain("phone");
    expect(Object.keys(errors)).toContain("document");
    expect(Object.keys(errors)).toContain("address");
    expect(Object.keys(errors)).toContain("city");
    expect(Object.keys(errors)).toContain("department");
    expect(Object.keys(errors)).not.toContain("zip");
    expect(Object.keys(errors)).not.toContain("reference");
  });

  it("returns empty for valid data", () => {
    const errors = validateAllFields({
      name: "Carlos García López",
      email: "carlos@example.com",
      phone: "3105557890",
      document: "1234567890",
      address: "Calle 45 #12-34, Barrio Centro",
      reference: "Edificio azul",
      city: "Bogotá",
      department: "Cundinamarca",
      zip: "110111",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
