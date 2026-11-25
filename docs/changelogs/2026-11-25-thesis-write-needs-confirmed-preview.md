# fix(alva): a Thesis is written only after the user confirms a full preview (v1.36.1)

主记录。配套改动：alva-ai/sandbox-agent-ts、alva-ai/alva-backend、
alva-ai/sdk-monorepo 各自的
`docs/changelogs/2026-11-25-thesis-write-needs-confirmed-preview.md`。

## 1. Background and Current State

- 用户反馈：只是随口问了一句，Alva 就在自己名下发了一条 Thesis Update。
- 11-23 的三个修复（alva-ai/alva-backend#3854、alva-ai/skills#695、
  alva-ai/sandbox-agent-ts#471）只覆盖一条路径：Alva Today 上不带 `thesisId`
  的回复不再被当成确认。三者于 11-25 进入 PRD 配置（backend `c1e8229`、
  skill v1.36.0、agent v0.31.0）。
- 仍然放行的路径，对照 v1.36.0 / v0.31.0 的原文：
  - 带 `thesisId` 的 Today 回复：“publish that scoped Update directly: the
    user's selection is confirmation”。用户发布前看不到正文，Update 发出后不能删除。
  - 主对话：`CHANNEL.md` 没有任何写 Thesis 的规则；`thesis.md` 的 Thesis
    tracking 没说检查之后不改 Thesis；“already seen and selected that exact
    version” 没限定为完整预览，而 Thesis discussion 要求提议时附一个简短版本；
    “however they word it” 会把闲聊里的换仓、改观点路由成 Update；
    “A natural confirmation” 没有排除追问和评论。
  - 后台 task：brief 由主对话 agent 自己写，`TASK.md` 依赖 brief 判断用户是否
    批准；主对话转述 task 建议时没有“不发布”的规则。

## 2. Problem Model and End-to-End Behavior

- B1：创建或更新 Thesis 只发生在这样一轮：用户这条消息确认了之前展示过的完整
  预览（正文、标的方向、可见性）。首次展示正文的那一轮不发布。
- B2：只有明确确认算数：发布回复、对预览问题回答“是”、点击发布按钮。追问、
  评论、认同分析都不算，预览保持未发布。
- B3：问自己的 Thesis、聊新证据、说看法变了、提到自己的交易，都是讨论；
  回答后最多提议一次起草 Update。接受提议是要预览，不是发布。
- B4：检查一条 Thesis 的结果是结论，Thesis 保持原样。
- B5：Today 回复不论带不带 `thesisId` 都不发布。带 `thesisId` 的回复是请
  Alva 起草这处修改，草稿带回主对话走正常 Update 预览。
- B6：后台 task 不写 Thesis，发布只在主对话进行。研究类 requirement 返回
  结论；起草类 requirement（含带 `thesisId` 的 Today 回复）返回标明的草稿，
  附 Thesis 链接和所依据的版本。task 结果不能确认它自己带回的草稿。
- B7：接受提议、选中改写候选、回复无人值守 routine 的提示，都只是打开预览。
- 保持不变：明确的归档请求、可见性切换、Signal 设置仍按各自小节执行。

## 3. Research, Findings, and Architecture Decision

- D1（Leo，11-25）：只在提示词层面解决，Backend 不加硬约束，不记录写入来源。
- D2（Leo，11-25）：Today 编辑回复也改为先预览后发布，取代 11-20 “选择带
  `thesisId` 的编辑回复即直接发布”的产品决定。
- D3：同一条规则写在 `thesis.md` 开头和 `CHANNEL.md`。`thesis.md` 只在模型
  路由到 Thesis 流程时才被读到，`CHANNEL.md` 每轮都在上下文里。
- D4（review 后，11-25）：原方案允许 brief 携带用户确认过的原文让 task 发布。
  review 指出这样会丢掉用户同时确认的目标、方向和可见性，改为 task 一律不
  发布。发布本身只是几次 CLI 调用，放在主对话没有代价。
- R1：约束力取决于模型是否遵守。本次没有跑真实模型，见第 8 节。

## 4. Implementation Design

本仓库：

- `references/thesis.md`
  - 开头新增一段：B1、B3。
  - Replies from Alva Today：带 `thesisId` 的回复改为起草并带回主对话（B5）。
  - Confirmation：“A natural confirmation” 改为 “An explicit confirmation”，
    并列出什么算、什么不算（B2）。
  - Existing Thesis lifecycle：“已看过并选中”限定为完整 Update 预览（B3）。
  - What the author asks for：其中的修改操作只在作者要求改这条 Thesis 时适用，
    查询当前仓位不受限（B3）。
  - Rewrite：选中候选是打开发布预览（B7）。
  - Thesis tracking：检查以结论结束（B4）。
- `references/request-routing.md`，Useful Next Step：写 Thesis 不属于回答的
  “必要工作”。
- `references/agent-routine.md`：无人值守提示改为 “Reply 'review'”，回复后
  先展示清单并等确认（B7）。
- `SKILL.md`：v1.36.1；Thesis tracking 路由行补一句；Core Model 的 Thesis 行
  改为“发布需要用户确认预览”。
- `evals/alva-skill-docs`：新用例 `target.thesis-write-needs-confirmed-preview`
  （含三条 excludes，防止直接发布的原句回来）；两条既有 include 跟随改写；
  八条新 mutation。

其他仓库：

- sandbox-agent-ts：`CHANNEL.md` 新增 “Writing a Thesis”，下一步按钮示例由
  “Post my NVDA thesis” 改为 “Draft my NVDA thesis”；`TASK.md` 改为 task 不写
  Thesis（B1、B2、B3、B6）。
- alva-backend：`replyText` 的编辑指令改为起草并带回对话（B5）。
- sdk-monorepo：`steward_today.md` 中英两份同步（B5）；Slim skill 自己的
  `thesis.md` 中英两份写入同样的规则（B1–B4、B7），ALPI 运行的 agent 读的是
  这一套（Leo，11-25：“Slim 也一起改”）。

## 5. Verification and E2E Design

- 文档 eval、mutation smoke、durable agent 测试。
- E2E Required: no。没有改接口、schema 或分发路径。
- 行为验证需要真实模型，本次没有做，列在第 8 节。

## 6. Human Decisions and Interaction

- Leo，2026-11-25：“不用后端加硬约束，还是在纯提示词层面解决问题，包括从
  today 发起的任务，然后用户日常对话聊到的 update 的意图。”
- Leo，2026-11-25：“主对话不一定要派 task，主对话有可能自己直接就把这个事做了。”
- Leo，2026-11-25：“Today 也改，按这个方案开始做。”

## 7. Outcome and Evidence

2026-11-25，本地：

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`：exit 0。
- `node evals/alva-skill-docs/mutation-smoke.mjs`：123/123。
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`：5 pass。

只有字符串匹配，没有跑模型。

Review（11-25）：主 agent 复查一轮，GPT-6.2 Astra 独立复查一轮。采纳的修订：
“同一轮不能既回答又写入”会挡住“确认并顺带提问”的消息，改为“首次展示正文的
那一轮不发布”；D4；B7 涉及的三处原文；研究类 task 不再返回可发布的全文；
草稿带回时附所依据的版本；task 结果与用户确认同轮到达时的规则；Backend 测试
只检查指令部分并让目标与锚点使用不同 id。

## 8. Remaining Work

- 在 STG 用真实对话验证，除最后一条外都断言 Thesis 版本号不变：
  - 问“财报对我的 thesis 有什么影响”
  - 说“我今天减了点 NVDA”
  - 对起草提议只回“好”
  - 预览后回一句追问
  - 主对话派出 research task 并收到结果
  - 点 Today 上带 `thesisId` 的编辑按钮：先出预览，不发布
  - 预览后点发布按钮：正常发布
- 生效顺序：Backend 的指令随 Backend 发版生效；其余随 skill v1.36.1 和 agent
  发版生效。sdk-monorepo 的 `skills/skill` 镜像由常规同步带过去。
- Backend 修复前已接受的 Today 回复在重试时沿用已存储的旧指令。
