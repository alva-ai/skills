# 移除通用投资免责声明：Full Skill

## 1. 背景

用户已与法务确认，通用投资免责声明由 Terms of Service 覆盖，要求移除回答中重复的固定声明及非持牌分析师开场。

## 2. 批准行为

取消通用免责声明的附加要求，覆盖分析、策略、报告和推送。来源核验、假设与风险披露、交易授权及 Thesis 发布确认保持原样；作者原文中的声明保留。

## 3. 设计

直接删除旧规则和失效引用，不新增全局禁止句、不修改运行时。Full 使用统一规则，Slim 中英文同步。并行 Thesis 项目已合入的预览和标的修复保留。

## 4. 实现

SKILL.md、user-facing-prose.md、request-routing.md、api/release.md；thesis.md 只删除仍指向旧声明规则的例外说明。同步现有 cases、scenarios 和 mutation 检查。

配套仓库：sdk-monorepo 的同名 changelog。两边使用独立变更，不修改父仓库或 Sandbox。

## 5. 验证

Full：运行 skill-doc-eval.mjs、mutation-smoke.mjs 和 durable-agent.test.mjs。
Slim：运行 skills/alpi-slim-skill/test/*.test.mjs；尝试 inspect-skill 包检查。
两边运行 git diff --check，并核对交易规则及发布确认未变。
这次只改文档契约，未运行真实会话 Eval 或全栈 E2E；仓库没有 make lint-fix 目标。

## 6. 用户决定与执行顺序

2026-10-23 用户明确批准：Full 与 Slim 中英文移除声明，最小改动，不动交易授权和 Thesis 发布确认。

- [x] 删除固定声明和开场。
- [x] 清理相关引用，同步现有检查。
- [x] 完成全部可运行检查和整体 diff review。

## 7. 验证结果

文档/场景 110/110，1273/1273 检查；durable-agent 5/5。Mutation 48/48，重引入固定尾句/开场均会被拦截。

整体 review：未发现残留的通用声明附加要求。交易文档未变；Full Thesis 的确认及后续操作逐字保持，Slim Thesis 未变。两边 git diff --check 通过。

## 8. 后续

合并/发版后，用新会话定向验收中文和英文的普通行情问答、投资判断、回测及 Thesis 预览；确认不再自动附加声明，同时保留实际风险、数据缺口、交易授权和发布确认。现有会话可能保留历史文本，不能用旧回复判断新包是否生效。本批仅本地提交，未推送、发布或改变生产配置。
