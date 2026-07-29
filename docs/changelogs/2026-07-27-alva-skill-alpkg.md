# feat: package the official Alva Skill for ALPKG

Primary design: `code/backend/jagent/alpi/ext/adapters/jagent/docs/changelogs/2026-07-27-alva-agent-layer3.md`

## 1. Background

Layer 3 needs the public Alva Skill through ALPKG's first-class `skill` kind.
The reviewed `v1.19.4` source contains the complete agent instructions,
but the repository did not declare a package coordinate or enforce that its
recursive release tree matched the registry contract.

This companion change packages the existing bytes; it does not turn the Skill
into JavaScript. The 44 tracked artifacts at source commit
`fdf43250da716a7ff6faf85ac03b444591151d54` are published unchanged.

## 2. End-to-End Behavior

- `@alva/skill@1.19.4` is a public, data-only npm and ALPKG package with ALPKG
  kind `skill` and no Node or ALPKG entrypoints.
- Explicit roots `SKILL.md`, `references`, and `scripts` recursively produce 44
  artifact files totaling 593,719 bytes. `package.json` and repository/runtime
  files are not artifacts.
- A reusable Node validator rejects identity, kind, version, entrypoint, root,
  path, link, file-count, and total-byte violations before a release command.
- Pull requests and pushes run validator tests, real-tree validation, existing
  documentation regression evaluation, and mutation smoke. No workflow can
  publish or publicize a package.
- Production release remains a deliberate maintainer operation from the exact
  detached source commit, with explicit roots, dry-run inspection, immutable
  exact-version readback, `latest` comparison, full byte/hash comparison, and
  a separate `set-public` step.

## 3. Findings

- ALFS and `alpkg` already enforce a maximum of 64 files and 32 MiB per
  artifact. The official Skill is below both limits.
- ALPKG recursively follows declared file roots but rejects symlinks, hidden or
  reserved segments, backslashes, traversal, and non-regular filesystem nodes.
  The repository validator mirrors those producer-side safety boundaries.
- Skill packages require a non-empty root `SKILL.md` and omit entrypoints.
- `package.json` is useful as reviewed release metadata but must stay outside
  the explicit artifact roots so the runtime receives only Skill data.
- ALPKG releases are immutable. An existing coordinate can be reused only when
  its complete authoritative bundle matches; corrections require a higher
  version.

## 4. Change Specification

- Add `skills/alva/package.json` with exact name/version/kind, public npm publish
  configuration, the three explicit roots, and no executable or typed entrypoint fields.
- Add `tools/alva-skill-package/validate.mjs` as both an importable validator
  and a CLI. Permit a separate `--package-json` so a detached artifact commit
  can be checked against reviewed tooling without adding metadata to the
  release bytes.
- Validate the package contract before walking the real roots; recursively
  reject unsafe paths, symlinks and special files; sort the resulting file
  list; enforce registry limits; and verify `SKILL.md` metadata version
  `v1.19.4` against package version `1.19.4`.
- Add the focused validator suite and run it plus real-tree validation in the
  existing Skill workflow ahead of documentation evaluations.
- Document the manual production procedure and immutable recovery rules in the
  repository README. Do not add an automated publish job.

## 5. Testability Design & Test Plan

- Focused command:
  `node --test tools/alva-skill-package/validate.test.mjs`.
- Direct real-tree command:
  `node tools/alva-skill-package/validate.mjs --skill-dir skills/alva`.
- The valid case asserts the exact package identity, root order, 44 paths, and
  593,719-byte total while confirming `package.json` is excluded from ALPKG.
- An npm dry-run asserts that npm includes `package.json` and the same three
  data roots without requiring a Node entrypoint.
- Fixture mutations cover wrong identity/kind/version, representative
  prohibited entrypoint forms, root drift, hidden/reserved/backslash/traversal paths,
  symlinks, more than 64 files, and more than 32 MiB.
- Existing workflow-equivalent checks remain
  `skill-doc-eval.mjs` and `mutation-smoke.mjs` against `skills/alva`.
- No database golden files, generated files, backend changes, or migrations are
  involved. The downstream full-stack consumer E2E belongs to the Layer 3
  implementation plan, not this package-only change.

## 6. Human Interaction

The user requested first-class ALPKG publication and approved using the
resolved immutable ALFS path directly. Publication remains manual; no workflow
was given release credentials or permission to publish automatically.

## 7. Outcome

### Changes made

- `skills/alva/package.json` declares public, data-only `@alva/skill@1.19.4`
  for npm and ALPKG, with the exact three artifact roots and no executable entrypoint.
- `tools/alva-skill-package/validate.mjs` validates identity, metadata, paths,
  node types, registry limits, and the complete recursive artifact set;
  `validate.test.mjs` supplies the mutation fixtures.
- `.github/workflows/alva-skill-doc-evals.yml` runs package tests and real-tree
  validation before the existing documentation checks.
- `README.md` documents the explicit dry-run, publish, publicize, immutable
  readback, and recovery procedure. This changelog records the contract.

### Tests added and verification

- Validator unit suite: 24/24 PASS.
- Real ALPKG validation: 44 files and 593,719 bytes, with `package.json`
  excluded.
- Documentation regression: 64/64 cases and 646/646 checks PASS.
- Mutation smoke: 12/12 PASS.
- Production read-only verification of
  `/alva/registry/skill/alva/skill/releases/v1.19.4/SKILL.md` succeeds through
  the logged-in Alva CLI: the manifest reports a 69,008-byte regular file and readback
  contained the expected name/version metadata.
- `git diff --check`: PASS.

### Migration

Not applicable. There are no database changes.

## 8. Remaining Tasks

- No package-source work remains. Future Skill edits require a new immutable
  version and the documented manual publication/readback procedure.
- Jagent's local Gateway-backed ALFS transport is separate from publication;
  production bytes are already readable through Gateway.
