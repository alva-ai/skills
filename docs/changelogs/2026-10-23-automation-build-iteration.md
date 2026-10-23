# Automation 构建中的失败重跑

## 1. 背景

10/21 的生产任务 2112879487312711681 构建耗时 35 分 53 秒；本次只读查询确认起止时间。先前原始轨迹复盘记录四次失败分析运行合计约 16 分 52 秒，部署、发布各约一秒。该样本不能证明当前版本的每次构建或定时执行同样缓慢。

## 2. 批准行为

B1：耗时 producer 失败时，先用包含失败案例的代表性输入调试受影响阶段，复用仍有效的数据和中间结果。B2：诊断重放不写正式 Feed、不发提醒。B3：修复后仍用当前输入完整执行最终源代码，通过原有交付检查。

## 3. 最小设计

在已有 feed-lifecycle 指导中补一段调试方法；Full 与 Slim 中英文同步。不新增接口、缓存层、模板或强制串并行策略。保留失败报错、幂等、首次触发、发布和通知验证要求。单条无效材料与核心覆盖失败的处理待进一步核实，不在这里放宽。

## 4. 范围与依据

Full：skills/alva/references/feed-lifecycle.md。
Slim：skills/alpi-slim-skill/references/feed-lifecycle.md 及 _cn 镜像。
两仓库均维护本同名 changelog。当前相关文档与本次 fetch 得到的 main 内容无差异，现有规则已有“首轮不重复触发”，没有分阶段排错指导。
原始复盘：/Users/leozhou/.codex/visualizations/2026/10/10/01a124ea-73ec-7172-a50f-509e64b334f3/prd-conversation-review-20261021/真实对话问题与最小改动方案.md。

## 5. 验证

Full：现有 skill-doc-eval、mutation-smoke、durable-agent 检查。
Slim：现有 test/*.test.mjs；对照中英文语义。两仓库 git diff --check，人工审查完整 diff，确认最终验证和错误处理未削弱。
E2E Required: no。本次只补排错指导，静态检查不能证明模型执行方式或提速。后续真实 Eval 用相同数据和故障比较重跑阶段、调用量、总耗时，并核验最终真实运行与通知状态。没有 make lint-fix 目标，不另造 lint 命令。

## 6. 执行顺序与授权

2026-10-23 用户授权提交前两轮，并推进第三阶段；问题不明时先研究。本轮从已有生产样本确认的失败迭代问题入手。

- [x] 复核历史样本、当前规则、首次触发与失败边界。
- [x] Full / Slim 中英文补最小调试说明。
- [x] 现有检查、整体 review、定向验证交接。

## 7. 验证结果

Full：`node evals/alva-skill-docs/skill-doc-eval.mjs` 110/110（1277 项），`node evals/alva-skill-docs/mutation-smoke.mjs` 48/48，`node --test evals/alva-skill-docs/durable-agent.test.mjs` 5/5。Slim：Node 26 下 `node --test skills/alpi-slim-skill/test/*.test.mjs` 61/61。两仓库 `git diff --check` 通过；未增加测试或固定文案断言。

整体 review：B1/B2 仅新增三份 reference 中的一段排错指导；B3 最终源代码完整运行、上游/解析失败报错、去重与首轮触发检查逐字保留。英文两处仅最后的检查名称随宿主不同，中文等义。B1/B2 的实际执行与提速均待真实 Eval，当前状态为指导已实施、行为效果未验证。

## 8. 剩余研究

本次从 production transcript 分块存储抽查原始工具记录：同一 `Unverified citation` 连续两次失败，stats.duration_ms 为 262889、270772；随后 `Missing review classification` 运行耗时 297721ms。轨迹已有 sample.js/tests.js，不能声称没有局部测试；新指导针对失败后的重跑范围，节省量待验证。

排查分类遗漏、空 JSON 与跨产品归属失败的具体实现；不将一次并发失败归因为并发本身。构建、定时运行和通知送达分别计时。尚未证明本条指导能缩短实际耗时，也未修改已启用的 Automation。
