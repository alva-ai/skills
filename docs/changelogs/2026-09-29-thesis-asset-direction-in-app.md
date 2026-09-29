# fix: Pass Thesis asset directions from the App agent

## 1. Background and Current State

The App's Codex sandbox installs the Alva Skill from this repository and
`@alva-ai/toolkit@next` from npm. In a September 29 STG App conversation,
the agent ran `alva thesis create --help`; the installed
CLI listed tickers but no entity stance flag. The agent also read this Skill's
Thesis reference, which only described ticker input. The SDK Slim Skill and
Dispatch releases use another runtime and did not update this sandbox.

## 2. Problem Model and End-to-End Behavior

- B1: Resolve asset mentions in the selected body before publication
  confirmation, using the read-only `thesis asset-candidates` command.
- B2: Show entity IDs and directions in the exact payload confirmation; preserve
  an explicitly stated user direction over a suggested one.
- B3: Create with `--entity-ids` and `--entity-stances` after confirmation.
- F1: Unresolved or ambiguous explicitly named assets and extraction failures
  must not silently become an unknown direction.
- F2: The Skill alone cannot expose an absent CLI flag; the sandbox must also
  consume a Toolkit beta containing the merged CLI changes.

## 3. Research, Findings, and Architecture Decision

The merged Toolkit source implements `asset-candidates` and
`--entity-stances`, but npm `next` is still 0.28.1-beta.1 and `latest` 0.29.0
does not contain those commands. The App Skill reference and npm package are
separate deployment inputs. Update the Skill now; publish a Toolkit beta and
rebuild the STG sandbox before claiming an App fix.

## 4. Implementation Design

Update the Thesis reference, the top-level route, and its documentation
regression case. Keep the existing user publication confirmation and GET-based
preview contract. Bump the Skill version to v1.23.1.

## 5. Verification and E2E Design

Run the three commands in `.github/workflows/alva-skill-doc-evals.yml`, check
the JSON case file and `git diff --check`. Verify the rebuilt sandbox's CLI help
and a user-authorized App creation separately after dependency deployment.

## 6. Human Decisions and Interaction

The user asked for the ticker direction creation fix and then supplied the
specific App account and conversation for diagnosis. Their App test is the final
user-flow check.

## 7. Outcome and Evidence

The exact Skill CI commands passed in a Node 20.19.5 container:
`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
(94/94 cases, 1023/1023 checks),
`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
(24/24 expected mutation failures), and
`node --test evals/alva-skill-docs/durable-agent.test.mjs` (5/5 tests).
`node -e` JSON parsing and `git diff --check` also passed. CI and App rollout
remain pending.

## 8. Remaining Work

Publish a Toolkit beta with the merged direction CLI, merge this Skill change,
rebuild the STG sandbox, and verify an App-created Thesis retains its direction.
