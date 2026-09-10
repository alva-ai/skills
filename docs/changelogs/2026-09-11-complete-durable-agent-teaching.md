# 补齐 #130 的 Pi-on-Alva 教学

## 1. 问题
alva-bot01 最终交接要求的 Pi 心智模型、迁移规则、参数与 Session 方法、run callback 和 Cloud 边界未完整覆盖。

## 2. 已批准行为
仅教授 runAlvaAgent，当前 @alva/pi 类型/runtime 文档为最终权威。完整解释可迁移的高层定制和明确例外。
callback 每次 invocation 一次，先于最终 Inbox drain；不教自建 forever loop。示例区分 manual/wake，UDF 校验先于 owner work。

## 3. 范围
Full durable-agent.md、文档回归及其 CI；Slim 中英文同步。无 runtime、schema 或 SDK pin 改动。

## 4. 实现
依据 ALPI ext/adapters/jagent/alva/run-agent.ts、alva/session.ts、coding/session.ts 与 Pi AgentSession 当前类型。
参数表增加 required/default/selector/scopedModels；列出 followUp/waitForIdle 等方法用途。
Cloud 边界列明禁用基础依赖注入、必需/保留工具、官方 Skill、extension/theme 和认证默认。

## 5. 验证
E2E Required: no（本文档修改）。Node 20 的既有 doc eval/mutation smoke；新增 node --test evals/alva-skill-docs/durable-agent.test.mjs。
回归按段落核对关系和有序生命周期，故意删段/颠倒顺序必须失败；在隔离 JS context 执行 entry/UDF 示例。
这些检查证明教学契约和示例，不宣称模型理解能力。Jagent 拆分的跨服务验收单独记录。

## 6. 串行清单
核对 issue 最终条款与当前类型 → 补 Full/Slim 中英文 → 文档/示例/反例测试 → review → 更新原 PR 和图解。

## 7. 结果
Node 20.20.2：skill-doc-eval.mjs --skill-dir skills/alva 为 91/91 cases、944/944 checks；mutation-smoke.mjs --skill-dir skills/alva 为 21/21；node --test evals/alva-skill-docs/durable-agent.test.mjs 为 4/4。无独立 formatter/linter，git diff --check 通过。

## 8. 后续
未发布 Skill；不影响 SDK/上游合并引用前置。
