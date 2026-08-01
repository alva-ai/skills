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

test("version checker is Slim-scoped and contains no official updater target", () => {
  const source = readFileSync(script, "utf8");
  assert.match(source, /@alva\/alva-slim/u);
  assert.match(source, /\/alva\/registry\/skill\/alva\/alva-slim\/releases/u);
  for (const forbidden of ["alva-ai/skills", "@alva/skill", "npx skills", "clawhub", "git clone"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("version checker stays silent when v0.0.3 is latest", () => {
  const result = runCheck(releases("v0.0.1", "v0.0.2", "v0.0.3"));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
  assert.match(result.curlArgs, /https:\/\/registry\.invalid\/api\/v1\/fs\/readdir/u);
  assert.match(result.curlArgs, /\/alva\/registry\/skill\/alva\/alva-slim\/releases/u);
});

test("version checker reports only the newer Slim coordinate", () => {
  const result = runCheck(releases("v0.0.4", "v0.0.2", "v0.0.3"));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Installed: v0\.0\.3/u);
  assert.match(result.stdout, /Latest:\s+v0\.0\.4/u);
  assert.match(result.stdout, /@alva\/alva-slim@v0\.0\.4/u);
  assert.doesNotMatch(result.stdout, /alva-ai\/skills|@alva\/skill(?:\s|@|$)|npx skills|clawhub|git clone/u);
});

test("version checker diagnoses registry and malformed-response failures", () => {
  const unavailable = runCheck("", { curlExit: 22 });
  assert.notEqual(unavailable.status, 0);
  assert.match(unavailable.stderr, /Alva Slim version check failed: registry request failed/u);

  const malformed = runCheck(JSON.stringify({ entries: [] }));
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stderr, /Alva Slim version check failed: no stable v0 releases/u);
});
