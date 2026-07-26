import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = ["app", "components", "lib", "types"];
const extensions = /\.(?:ts|tsx|css|md|json)$/;
const mojibake = /[\u00e2\u00c3\u00c2\ufffd]/;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    return entry.isDirectory() ? files(target) : extensions.test(entry.name) ? [target] : [];
  });
}

describe("family-facing text encoding", () => {
  it("contains no common UTF-8 mojibake markers", () => {
    const corrupted = roots.flatMap(files).filter((file) => mojibake.test(readFileSync(file, "utf8")));
    expect(corrupted).toEqual([]);
  });
});
