import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("production response security", () => {
  it("denies framing, MIME sniffing, and unused device permissions", async () => {
    const rules = await nextConfig.headers?.();
    const headers = Object.fromEntries((rules?.[0].headers ?? []).map((header) => [header.key, header.value]));
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });
});