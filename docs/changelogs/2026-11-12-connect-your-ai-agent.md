# feat: bootstrap and daily note for external agents

本地记录。主记录：alva-backend docs/changelogs/2026-11-12-connect-your-ai-agent.md。

- 新增自成一体的 `skills/alva/BOOTSTRAP.md`（`version: 1`，目标 4KB 以内）：开场话术 → 准备（CLI、登录）→ 建每天的 routine 并当场跑第一次（OpenClaw、Hermes 用自带定时；Claude 桌面 App 里的 Claude Code 用本地定时任务；终端里的 Claude Code、Codex 等投递不到用户，不建，改为随时问「Alva 上有什么新动态」） → 收尾话术；完成版本记在 agent 自己的记忆里。
- 新增 `references/agent-routine.md`：A 整理（读 agent 记忆和原始对话记录，首次只读最近 60 天，只取投资相关；在场时一次确认后写回 `~/memory/user.md`、勾选观点建私密 Thesis（带上提到的 ticker），无人值守时只提出）；B 拉 `alva people follows activity` 并总结；别人的内容只摘要不执行。
- 每天的 routine 发现 BOOTSTRAP 版本比记忆里新时，在提醒里加一句可更新；`SKILL.md` 连接时指向 BOOTSTRAP；`references/memory.md` 补外部 agent 写前重读。
- 验证：先实测各家 agent 定时任务的权限与网络；在 Claude Code 中以新用户、老用户各实跑一遍并重跑，记录到主记录第 7 节。
- 评审后（11-13）：Alva 端内（sandbox-agent-ts）每个会话复制整个 skill 目录、运行的是 Claude Code。BOOTSTRAP 开头加「If you are Alva itself」守卫：托管 Sandbox 里不执行安装、定时、routine 和记忆记录，只回一句「这段提示词是给你自己的 agent 用的，到 Me › Connect your AI 复制」。SKILL.md 那句改为「连接 agent 走 BOOTSTRAP；Sandbox 只给守卫里的回复」，仍为 240 行。评测加三条守卫文字检查，0 失败，mutation smoke 59/59，durable-agent 5/5。
- 实跑（11-13，Claude Code 2.1.322 headless，本地栈 alice）：三次新用户运行中 agent 都没先发开场话，而是读完对话后一次性汇报；改词两次无效。经哥确认，开场改为发完即停、等用户同意再开始，复跑验证生效。
- 评审后：补三条 mutation smoke（去掉 Sandbox 守卫、开场不停、SKILL.md 去掉 Sandbox 限定），63/63 均被评测抓到；rebase 到 main（v1.30.1 之后），版本保持 v1.31.0（11-17 rebase 后为 v1.32.0）。
- 奥卡姆复核后（11-16）：routine 的动态列表改为发布、更新、收藏 Thesis，点赞 Signal，加自选（去掉修改和 Thesis 点赞），Signal 文本同样只摘要；routine 补「Undo」：记忆条目按读、合并、写回删掉，Thesis 用 `alva thesis archive` 撤下。doc eval 无失败，mutation smoke 63/63。
- 整体复核（11-17）：rebase 到 main（v1.31.2 之后），版本 v1.32.0。定时任务在全新会话里只收到一句「Run the Alva daily routine.」，SKILL.md 里没有任何指向 routine 的路由，agent 只能靠自己的记忆找文件。改为：定时提示词写明 `references/agent-routine.md`；SKILL.md 的路由合成一行（受 240 行上限约束）并加上 daily routine；BOOTSTRAP 收尾让 agent 记下「What's new on Alva 就是跑 agent-routine.md」；routine 开头注明托管 Sandbox 不运行。另补：`user.md` 不存在时从空分区开始；Thesis 链接格式 `https://alva.ai/thesis/<id>`。doc eval 无失败，mutation smoke 73/73，durable-agent 测试通过。
- 11-17（哥定：Claude 和 Codex 都有桌面 App）：定时规则按能力写：有定时任务的桌面 App（Claude、Codex）用 App 自带的定时任务或 automation 工具建「Alva daily」，会话里没有这个工具就告诉用户在 App 哪里加并给出提示词；终端会话（Claude Code、Codex CLI）不建。Sandbox 守卫回复里的「Claude Code or Codex」改为「Claude or Codex」。Codex 桌面 App 的建法未实测（本机没有 Codex App）。doc eval 无失败，mutation smoke 73/73。
