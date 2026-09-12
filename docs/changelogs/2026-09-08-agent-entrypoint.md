# Durable Agent entry documentation (#130)

Teach one owner cwd and agent.js per durable Layer 2/3 Agent. First launch and scheduled wake reconstruct the same configuration through runAlpiAgent/runAlvaAgent. Document stable session selection, custom tools, secret loading, callback lifecycle, strict wake identity and migration of existing sessions. Keep Agent.ask examples for bounded application reasoning. Primary implementation plan: alpi/changelogs/2026-09-08-agent-entrypoint.md. Depends on ALPI #131, Backend #2422 and Jagent #1104. No Skill publication performed.

The top-level Skill now routes persistent coding Agents to this contract. The JavaScript example parses, relative links resolve and the Full/Slim English contract is identical. Main-agent review checked the doc against the SDK and final five-case cross-service E2E (95.835s). Local documentation only; publish alongside the matching runtime and Backend.

Publication verification: Linux Node 20.19.0, network disabled and read-only source. `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva` passed 91/91 cases and 944/944 checks; `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva` detected all 21 mutations. The new routing fits the existing 911-line top-level limit. No independent formatter/linter target; `git diff --check` passed.
