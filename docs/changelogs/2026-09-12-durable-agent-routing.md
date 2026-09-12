# #130 顶层 durable Agent 教学收尾

## 1. 问题
alva-bot01 最终代码 review 指出：reference 已只教 runAlvaAgent，顶层 SKILL.md 仍列出 runAlpiAgent。

## 2. 行为
用户路径只教授 runAlvaAgent；确定性流水线的 Agent.ask 保留。runtime 内部导出不在此修改范围。

## 3. 范围
skills/alva/SKILL.md 与 evals/alva-skill-docs/durable-agent.test.mjs。
主计划：https://github.com/alva-ai/alpi/blob/handson/session-inbox-schedule/changelogs/2026-09-12-final-review-closeout.md 。

## 4. 实现
移除顶层替代入口；回归直接读取顶层并检查 durable reference、runAlvaAgent 和 Agent.ask 路由。

## 5. 验证
E2E Required: no。无运行时修改。Node20.20.2，按 alva-skill-doc-evals.yml 执行。

## 6. 顺序
复现遗漏 → 修正文案 → doc eval/mutation/durable tests → review → 更新 #633。

## 7. 结果
新回归在旧文案下失败，修正后 `node --test evals/alva-skill-docs/durable-agent.test.mjs` 5/5 通过。
`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva` 91/91 cases、944/944 checks。
`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva` 21/21。结构和示例测试不是模型理解能力证据。

## 8. 后续
未发布 Skill。PR CI 与审批独立核验。
