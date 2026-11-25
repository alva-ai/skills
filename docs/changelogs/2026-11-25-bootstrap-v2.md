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
- `references/thesis.md` 的发布命令显式带 `--visibility <public|private>`（预览里默认 public，按确认的传）：toolkit-ts 将要求 create 必须传 `--visibility`，本仓的 release 同步到平台（sdk-monorepo `skills/skill`）之后 toolkit 才能发版。
- README 的 Connect 一节同步「默认私密，可选公开」。

## Code review 后

- CLI 装到 `~/.npm-global` 时，定时 routine 找不到 `alva`、按兜底全局重装又因权限失败，每次都发不出提醒。现在 BOOTSTRAP 收尾在记忆里记下所用的 CLI（`alva` 或 `~/.npm-global/bin/alva`）；routine 先用记忆里的 CLI，`alva` 找不到就试 `~/.npm-global/bin/alva`，都没有才重装，没权限同样加 `--prefix ~/.npm-global`。
- 多个标的里只要有一个方向 `UNKNOWN`，整条观点就被当成「无标的、无方向」，判得出的方向也丢了（如「看多 NVDA，AMD 拿不准」）。现在只去掉方向为 `UNKNOWN` 的标的和 `UNRESOLVED` 的提及，其余保留方向，并告诉用户去掉了哪些；一个都不剩或调用失败，才按无方向提出、问用户。

## QA 反馈：没跑过 BOOTSTRAP 的不算已连接（哥定方案 B）

- STG 有 13 个老用户（15 把 key）在 BOOTSTRAP 之前用 CLI 登录过，key 叫网关默认名 `cli`，App 把他们全算成已连接。App 改为只认 scope 含 `cli`、名字不是 `cli` 的 key（frontend-monorepo#5696）。
- 第 1 步登录改为：不论 `alva whoami` 是否已有用户，都 `alva auth login --agent "<名字>"` 一次；update 时也跑，除非记得已用 `--agent` 登录过。新 key 带名字，App 据此认定已连接；原来「已登录就跳过」会让老用户跑完仍是 `cli` key、永远显示未连接，连接弹窗也等不到「已连接」。已登录时再跑 `auth login` 会直接写入新 key（toolkit 不拒绝），旧 key 不吊销。
- 环境里设了 `ALVA_API_KEY` 会盖过登录（toolkit 的优先级：`--api-key` > `ALVA_API_KEY` > 配置文件），新 key 用不上：请用户从 agent 设置里删掉它、开新会话后再继续。

- README（哥定）：Configure 改为先装 toolkit、`alva auth login --agent "<agent>"` 登录；`ALVA_API_KEY` 移到「仅无头运行」，并说明它会盖过登录、App 不算已连接。Connect 的提示词带上 `npx skills add … -g -y`。Auto-Update 的示例按 `scripts/version_check.sh` 实际输出更新（原来写的 `npx skills update` 已过时）。
- 依赖：key 按 agent 命名靠 toolkit-ts#214，只在 0.38.0 起（npm `latest` 目前仍是 0.37.0，0.38.0 还在 `next` beta）。0.37 不认 `--agent`，按兜底去掉后 key 仍叫 `cli`。所以 App 的新判断（frontend-monorepo#5696）要等 toolkit 0.38 成为 `latest` 后才能发；README 也写了旧 CLI 的兜底。

- `scripts/version_check.sh`（哥定）：更新提示里的 `npx skills add …` 原来没带 `-g`，全局安装的用户照做，会装进 agent 当前所在的项目目录，全局那份不更新。现在按安装位置决定：skill 在家目录的点目录下（`~/.agents/skills/alva`、`~/.claude/skills/alva` 等）就加 `-g`，项目内安装不加。实测：临时 HOME 下全局副本提示带 `-g`、项目副本不带；照提示的 `-g` 命令装到 `~/.agents/skills/alva`，工作目录没有写入。README 的示例同步。

## Review 修复（PR review，11-25）

- Codex 历史仍大多漏读（阻塞）：`~/.codex/sessions/` 里也是 zstd 压缩，不只归档目录。一台真实 Codex 机器上 `sessions/` 有 434 个 `*.jsonl.zst`、9 个 `*.jsonl`，近 90 天约 370 个是压缩的；原写法只匹配 `*.jsonl`，漏掉约 97%，很可能才是 Codex 实跑零结果的原因。现在两个目录都列 `*.jsonl` 和 `*.jsonl.zst`。
- 「全部读完」没有量的说法：一台真实 Claude Code 机器 90 天 193 个会话（2.1 GB），用户消息约 9,000 条、1,290 万字符，读不进一个上下文。现在允许用脚本按「谁写的」抽出用户自己的话（不是关键词过滤），从新往旧读，一次读不完就说读到了哪天。
- 方向与 `references/thesis.md` 对齐：`UNKNOWN` 的标的不再直接去掉，标成「方向判不了」，由用户选 Long、Short、Not tracked 或去掉，agent 不替用户选（thesis.md 的「作者可指定方向」）；调用失败先重试一次，再失败才按原决定「无标的、无方向，问用户要不要这样发」。
- 更新会跳过升级 CLI：开头「an update skips the steps already done」会让 v1 用户把第 1 步当成已做（`alva` 能用、已登录），正是缺 `people` 的那批人。改为更新时第 1 步照跑，其余已做的步骤跳过。
- 旧 CLI 每跑一次多一把 `cli` key：npm `latest` 仍是 0.37.0，不认 `--agent`，兜底去掉参数重登会再铸一把未命名的 `cli` key、旧的不吊销。改为：旧 CLI 且已登录 → 保留现有登录；未登录才不带 `--agent` 登录。收尾记忆里记下是否按名字登录，更新时据此决定要不要重登。
- `version_check.sh` 把点目录下的项目当成全局：`case` 里 `*` 会匹配 `/`，`~/.superset/worktrees/<项目>/.claude/skills/alva` 也会被判成全局、提示 `-g`。`skills` CLI 的全局目录有几十种（`~/.gemini/config/skills`、`~/.config/agents/skills`、`CLAUDE_CONFIG_DIR` 等），路径形状判断不准；改为按 `skills` 自己的定义：在 agent 当前项目目录里的副本才是项目安装，其余都加 `-g`；在家目录里运行时两种写法落到同一批目录，保留 `-g`。实测（临时 HOME）：`~/.agents/skills`、`~/.claude/skills`（在家目录运行）、`~/.config/opencode/skills` 带 `-g`；项目内副本和 `~/.superset/worktrees/<项目>` 里的副本不带；原写法对后者错给了 `-g`。

## 不在本次

- 跨 agent 读取、按来源记录进度、草稿与私密 thesis 的区分：二期。
- 关注动态批量接口：另有开发在做，B 节暂不改。
- CLI：`thesis create` 必须显式传 `--visibility`、`asset-candidates` 进 `thesis --help` 子命令列表、create 返回网页链接，在 toolkit-ts 单独的 PR。
- SKILL.md 自动更新提示里的 `npx skills update` 对 lock 里没登记的旧安装无效，同 App 提示词的问题，未改。

## 验证

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`（135/135 cases，1741/1741 checks）；`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`（115/115，新增 `bootstrap-skips-cli-update`、`routine-stops-early`、`routine-reads-other-agents`、`routine-keyword-filter`、`routine-shows-unredacted`、`routine-creates-unseen-body`、`routine-omits-visibility`、`routine-hides-private-default`、`thesis-create-omits-visibility`、`routine-drops-known-directions`、`routine-forgets-cli-path`、`bootstrap-skips-login-when-signed-in`、`routine-codex-plain-sessions-only`、`routine-picks-unknown-direction`、`routine-no-retry-before-undirected`、`routine-hides-partial-read`、`bootstrap-update-skips-install`、`bootstrap-old-cli-mints-unnamed-key`；`routine-thesis-unknown-direction`、`routine-drops-known-directions` 改锚到新句子）；`node --test evals/alva-skill-docs/durable-agent.test.mjs`（5/5）；`version_check.sh` 在临时 HOME 下按上面五种安装位置实测；SKILL.md 240 行，版本 v1.36.0。未在真实 agent 上重跑。
