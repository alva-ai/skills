import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { bundleDeliversRootFontFamily } from "./design-contract-sync.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.resolve(
  here,
  "../../skills/alva/references/css/design-system.css",
);

describe("design-contract-sync — CSS freshness check", () => {
  it("exits 0 when design-system.css matches build output", () => {
    const out = execSync("tsx design-contract-sync.ts", {
      cwd: here,
      encoding: "utf8",
    });
    expect(out).toMatch(/in sync/);
  });

  it("exits 1 when design-system.css is stale", () => {
    const original = fs.readFileSync(CSS_PATH, "utf8");
    try {
      fs.writeFileSync(CSS_PATH, original + "\n/* INTENTIONAL DRIFT */\n");
      let exitCode = 0;
      try {
        execSync("tsx design-contract-sync.ts", {
          cwd: here,
          encoding: "utf8",
        });
      } catch (e: unknown) {
        exitCode = (e as { status: number }).status;
      }
      expect(exitCode).toBe(1);
    } finally {
      fs.writeFileSync(CSS_PATH, original);
    }
  });
});

describe("bundleDeliversRootFontFamily — unit", () => {
  it("returns true when body declares the required family", () => {
    const css = 'body { font-family: "Delight", -apple-system, sans-serif; }';
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(true);
  });

  it("returns true when html declares the required family", () => {
    const css = 'html { font-family: "Delight"; }';
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(true);
  });

  it("returns true when :root declares the required family", () => {
    const css = ':root { font-family: "Delight", sans-serif; }';
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(true);
  });

  it("returns false when only a component class declares it", () => {
    const css = '.btn { font-family: "Delight", sans-serif; }';
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(false);
  });

  it("returns false when body declares font-family without the required family", () => {
    const css = "body { font-family: Helvetica, Arial, sans-serif; }";
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(false);
  });

  it("returns false when body only declares anti-aliasing (no font-family)", () => {
    const css = "body { -webkit-font-smoothing: antialiased; }";
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(false);
  });

  it("match is case-insensitive", () => {
    const css = 'BODY { font-family: "delight", sans-serif; }';
    expect(bundleDeliversRootFontFamily(css, "Delight")).toBe(true);
  });
});

describe("design-contract-sync — bundle promise check", () => {
  it("exits 1 when bundle lacks the root font-family the contract promises", () => {
    const original = fs.readFileSync(CSS_PATH, "utf8");
    try {
      // Strip the body { font-family: ... } ruleset; leave everything else.
      const stripped = original.replace(
        /body\s*\{\s*font-family:[^}]+\}/,
        "body { /* stripped for test */ }",
      );
      // Sanity: replacement must have changed the file.
      expect(stripped).not.toBe(original);
      fs.writeFileSync(CSS_PATH, stripped);

      let exitCode = 0;
      let stderr = "";
      try {
        execSync("tsx design-contract-sync.ts", {
          cwd: here,
          encoding: "utf8",
        });
      } catch (e: unknown) {
        exitCode = (e as { status: number }).status;
        stderr = (e as { stderr: Buffer | string }).stderr.toString();
      }
      expect(exitCode).toBe(1);
      expect(stderr).toContain("bundle promise broken");
    } finally {
      fs.writeFileSync(CSS_PATH, original);
    }
  });
});
