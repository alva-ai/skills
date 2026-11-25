# feat(alva): bootstrap v2: read the whole window, current CLI, visible thesis bodies

依据两份实跑复盘（11-25）：Codex 桌面 App 在本机跑 v1，个人历史提取零结果、旧 CLI 缺 `people`；Muse（自带云电脑）跑通，但在 thesis 创建、帮助文本和时间预估上踩坑。主记录在 frontend-monorepo `docs/changelogs/2026-11-12-connect-your-ai-agent.md`。

## BOOTSTRAP.md（version 2）

- 第 1 步：不管 `alva` 能不能用，都跑 `npm install -g @alva-ai/toolkit@latest`。旧 CLI（Codex 那台是 0.37 之前）没有 routine 用到的 `people`。全局目录没权限时用 `--prefix ~/.npm-global`；安装失败但旧 CLI 能用就继续，没有 CLI 才停。
- 开场「约 3 分钟」改为「几分钟」：Muse 关注 63 人时实跑约 8 分钟。
- 定时：加一条通用写法，其他调度器能把结果送到用户那里的 agent，用同样的名字、时间和提示词。
- 收尾：说明每篇 thesis 是私密还是公开；记忆里记「Alva bootstrap v2 done」。已连上的用户下次 routine 会看到「Alva setup has an update」。

## agent-routine.md

- 开头：找不到 `alva`（云电脑被替换等）先重装 toolkit。
- A 节读法（Codex 复盘的漏提）：
  - 自己的记忆：首次全部读，之后读上次运行以来的变化。
  - 对话：首次回溯从 60 天改为 90 天（决定：拉长到 90 天）；窗口内全部读完，去掉「够填确认就停」。Codex 补归档目录 `~/.codex/archived_sessions/*.jsonl.zst`。
  - 只读当前 agent 自己的文件，不读其他 agent 的（决定：跨 agent 读取放二期，有隐私问题）。
  - 逐条读用户自己写的话并自行判断：不按关键词过滤，不跳过长消息；长消息里去掉粘贴内容、日志和工具输出。用户点名项目或更早的时间段时往回读并标日期。
  - 零结果或某来源读不到：说清读了哪些来源、覆盖哪些日期，哪些没读到、为什么。
  - 原始对话只留在本机，写入 Alva 的只有用户确认过的条目；展示候选前先去掉 Never 清单里的内容。
- Thesis（Muse 复盘）：
  - `asset-candidates` 返回 `UNRESOLVED`/`UNKNOWN` 是正常结果。方向判不了（或调用失败）也照样提出这条观点，说明方向判不了、发出去不带标的和方向，问用户要不要这样发（决定：主动提、问用户）。原规则是这次不提。
  - 确认里的「Publish as private theses?」改为「Publish as theses?」，并明确告诉用户：默认都是私密；现在就可以改成公开；发出去以后也能在 Alva App 里改，或让 agent 用 `alva thesis set-visibility` 改（决定）。
  - 硬规则：用户在本次对话里没看过逐字正文的 thesis 一律不创建，口头同意过也不行。Muse 曾在用户同意后用自己改写的正文直接创建。
  - `thesis create` 总是显式传用户确认的 `--visibility`：CLI 的 create 默认是 public。
- README 的 Connect 一节同步「默认私密，可选公开」。

## 不在本次

- 跨 agent 读取、按来源记录进度、草稿与私密 thesis 的区分：二期。
- 关注动态批量接口：另有开发在做，B 节暂不改。
- CLI：`thesis create` 改为必须显式传 `--visibility`、`asset-candidates` 进 `thesis --help` 的子命令列表，在 toolkit-ts 单独改。
- SKILL.md 自动更新提示里的 `npx skills update` 对 lock 里没登记的旧安装无效，同 App 提示词的问题，未改。

## 验证

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`（135/135 cases，1728/1728 checks）；`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`（105/105，新增 `bootstrap-skips-cli-update`、`routine-stops-early`、`routine-reads-other-agents`、`routine-keyword-filter`、`routine-shows-unredacted`、`routine-creates-unseen-body`、`routine-omits-visibility`、`routine-hides-private-default`；`routine-thesis-unknown-direction` 改锚到新句子）；`node --test evals/alva-skill-docs/durable-agent.test.mjs`（5/5）；SKILL.md 240 行，版本 v1.36.0。未在真实 agent 上重跑。
