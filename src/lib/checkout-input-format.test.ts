import { describe, expect, it } from "vitest";
import {
  formatCheckoutDocumentInput,
  formatCheckoutPhoneInput,
  formatCheckoutZipInput,
} from "./checkout-input-format";

describe("checkout input formatting", () => {
  it("formats phone input with readable groups", () => {
    expect(formatCheckoutPhoneInput("3001234567")).toBe("300 123 4567");
    expect(formatCheckoutPhoneInput("573001234567890")).toBe(
      "573 001 2345 67890",
    );
  });

  it("formats document input with dot groups", () => {
    expect(formatCheckoutDocumentInput("1234567890")).toBe("1.234.567.890");
    expect(formatCheckoutDocumentInput("abc1234")).toBe("1.234");
  });

  it("keeps zip input numeric and capped", () => {
    expect(formatCheckoutZipInput("11a01-118")).toBe("110111");
  });
});
