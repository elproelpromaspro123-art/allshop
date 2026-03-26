import { describe, it, expect } from "vitest";

// Test VPN detection utilities
function _isKnownVpnIp(ip: string): boolean {
  const vpnRanges = [
    { start: "10.0.0.0", end: "10.255.255.255" },
    { start: "172.16.0.0", end: "172.31.255.255" },
    { start: "192.168.0.0", end: "192.168.255.255" },
  ];

  const ipNum = ipToNumber(ip);
  return vpnRanges.some(range => {
    const start = ipToNumber(range.start);
    const end = ipToNumber(range.end);
    return ipNum >= start && ipNum <= end;
  });
}

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (parts[0] * 256 ** 3) + (parts[1] * 256 ** 2) + (parts[2] * 256) + parts[3];
}

function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

describe("isPrivateIp", () => {
  it("detects 10.x.x.x range", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
  });

  it("detects 172.16-31 range", () => {
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("172.15.0.1")).toBe(false);
  });

  it("detects 192.168.x.x range", () => {
    expect(isPrivateIp("192.168.1.1")).toBe(true);
  });

  it("detects localhost", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
  });

  it("accepts public IPs", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });
});

describe("ipToNumber", () => {
  it("converts IP to number correctly", () => {
    expect(ipToNumber("0.0.0.0")).toBe(0);
    expect(ipToNumber("255.255.255.255")).toBe(4294967295);
  });

  it("converts common IPs", () => {
    expect(ipToNumber("192.168.1.1")).toBe(3232235777);
  });
});
