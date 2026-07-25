import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA launch configuration", () => {
  it("provides installable standalone metadata and required icons", () => {
    const value = manifest();
    expect(value.name).toBe("Our Family Headquarters");
    expect(value.short_name).toBe("Family HQ");
    expect(value.start_url).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toBe("#626B58");
    expect(value.background_color).toBe("#F7F2EA");
    expect(value.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]));
  });

  it("keeps protected navigation network-first with an offline fallback", () => {
    const worker = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain('fetch(request).catch(() => caches.match("/offline.html"))');
    expect(worker).not.toMatch(/cache\.put\(request[\s\S]*request\.mode === "navigate"/);
  });
});
