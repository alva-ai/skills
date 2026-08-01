import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = resolve("skills/alva/scripts/version_check.sh");

function runCheck(body, { curlExit = 0 } = {}) {
  const root = mkdtempSync(join(tmpdir(), "alva-slim-version-check-"));
  const fakeCurl = join(root, "curl");
  const argsPath = join(root, "curl-args.txt");
  writeFileSync(
    fakeCurl,
    "#!/usr/bin/env bash\nprintf '%s\\n' \"$@\" > \"$MOCK_CURL_ARGS\"\nprintf '%s' \"$MOCK_CURL_BODY\"\nexit \"$MOCK_CURL_EXIT\"\n",
  );
  chmodSync(fakeCurl, 0o755);
  try {
    const result = spawnSync("bash", [script], {
      encoding: "utf8",
      env: {
        PATH: `${root}:${process.env.PATH}`,
        MOCK_CURL_ARGS: argsPath,
        MOCK_CURL_BODY: body,
        MOCK_CURL_EXIT: String(curlExit),
        ALVA_SLIM_REGISTRY_ENDPOINT: "https://registry.invalid",
      },
    });
    return {
      ...result,
      curlArgs: readFileSync(argsPath, "utf8"),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function releases(...versions) {
  return JSON.stringify({ entries: versions.map((name) => ({ name, is_dir: true })) });
}

test("version checker contains no official updater target", () => {
  const source = readFileSync(script, "utf8");
  for (const forbidden of ["alva-ai/skills", "@alva/skill", "npx skills", "clawhub", "git clone"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("version checker requests the exact anonymous Slim releases directory and stays silent when current", () => {
  const result = runCheck(releases("v0.0.1", "v0.0.4", "v0.0.5"));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
  assert.deepEqual(result.curlArgs.trimEnd().split("\n"), [
    "-fsS",
    "--max-time",
    "5",
    "--get",
    "--data-urlencode",
    "path=/alva/registry/skill/alva/alva-slim/releases",
    "https://registry.invalid/api/v1/fs/readdir",
  ]);
});

test("version checker reports only the newer Slim coordinate", () => {
  const result = runCheck(releases("v0.0.6", "v0.0.2", "v0.0.5"));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Installed: v0\.0\.5/u);
  assert.match(result.stdout, /Latest:\s+v0\.0\.6/u);
  assert.match(result.stdout, /@alva\/alva-slim@v0\.0\.6/u);
  assert.doesNotMatch(result.stdout, /alva-ai\/skills|@alva\/skill(?:\s|@|$)|npx skills|clawhub|git clone/u);
});

test("version checker diagnoses registry failures", () => {
  const unavailable = runCheck("", { curlExit: 22 });
  assert.notEqual(unavailable.status, 0);
  assert.match(unavailable.stderr, /Alva Slim version check failed: registry request failed/u);
});

for (const [name, body] of [
  ["malformed prefix", `garbage${releases("v0.0.5")}`],
  ["trailing garbage", `${releases("v0.0.5")}garbage`],
  ["wrong root type", JSON.stringify([])],
  ["missing entries", JSON.stringify({})],
  ["wrong entries type", JSON.stringify({ entries: {} })],
  ["empty entries", JSON.stringify({ entries: [] })],
  ["invalid entry type", JSON.stringify({ entries: ["v0.0.5"] })],
  ["invalid version name", releases("v0.0.5", "latest")],
  ["noncanonical leading zero", releases("v0.00.5")],
  ["duplicate version", releases("v0.0.5", "v0.0.5")],
  ["wrong directory flag", JSON.stringify({ entries: [{ name: "v0.0.5", is_dir: false }] })],
]) {
  test(`version checker rejects ${name}`, () => {
    const result = runCheck(body);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Alva Slim version check failed: registry response is invalid/u);
    assert.equal(result.stdout, "");
  });
}

test("version checker orders arbitrary-length minor components without overflow", () => {
  const newest = "v0.18446744073709551616.0";
  const result = runCheck(releases("v0.0.5", "v0.7.0", newest));
  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`Latest:\\s+${newest.replaceAll(".", "\\.")}`, "u"));
  assert.match(result.stdout, new RegExp(`@alva/alva-slim@${newest.replaceAll(".", "\\.")}`, "u"));
});

test("version checker orders arbitrary-length patch components without overflow", () => {
  const newest = "v0.0.18446744073709551616";
  const result = runCheck(releases("v0.0.5", "v0.0.7", newest));
  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`Latest:\\s+${newest.replaceAll(".", "\\.")}`, "u"));
});

test("version checker respects a newer minor over an arbitrary-length older patch", () => {
  const hugePatch = "v0.7.999999999999999999999999999999999999999999999999";
  const result = runCheck(releases("v0.0.5", hugePatch, "v0.8.0"));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Latest:\s+v0\.8\.0/u);
  assert.doesNotMatch(result.stdout, new RegExp(`Latest:\\s+${hugePatch.replaceAll(".", "\\.")}`, "u"));
});

test("version checker stays silent for equal and older arbitrary-precision candidates", () => {
  const result = runCheck(releases("v0.0.5", "v0.0.4", "v0.0.0"));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});
