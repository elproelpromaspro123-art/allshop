import { describe, it, expect } from "vitest";

// Test IP blocking behavior
function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}

function isIpInRange(ip: string, rangeStart: string, rangeEnd: string): boolean {
  const ipNum = ipToNumber(ip);
  const start = ipToNumber(rangeStart);
  const end = ipToNumber(rangeEnd);
  return ipNum >= start && ipNum <= end;
}

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

describe("normalizeIp", () => {
  it("trims and lowercases", () => {
    expect(normalizeIp(" 192.168.1.1 ")).toBe("192.168.1.1");
  });

  it("handles IPv6", () => {
    expect(normalizeIp(" ::1")).toBe("::1");
  });
});

describe("isIpInRange", () => {
  it("detects IP within range", () => {
    expect(isIpInRange("192.168.1.50", "192.168.1.1", "192.168.1.100")).toBe(true);
  });

  it("detects IP outside range", () => {
    expect(isIpInRange("192.168.2.50", "192.168.1.1", "192.168.1.100")).toBe(false);
  });

  it("detects IP at range boundary", () => {
    expect(isIpInRange("192.168.1.1", "192.168.1.1", "192.168.1.100")).toBe(true);
  });
});
