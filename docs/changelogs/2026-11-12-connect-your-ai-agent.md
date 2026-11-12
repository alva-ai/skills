# feat: bootstrap and daily note for external agents

本地记录。主记录：alva-backend docs/changelogs/2026-11-12-connect-your-ai-agent.md。

- 新增自成一体的 `skills/alva/BOOTSTRAP.md`（`version: 1`，目标 4KB 以内）：开场话术 → 准备（CLI、登录）→ 建每天的 routine（只允许 `alva` 命令）并当场跑第一次 → 收尾话术；完成版本记在 agent 自己的记忆里。
- 新增 `references/agent-routine.md`：A 整理（读 agent 记忆和原始对话记录，只取投资相关；在场时一次确认后写回 `~/memory/user.md`、勾选观点建私密 Thesis，无人值守时只提出）；B 拉 `alva people follows activity` 并总结；别人的内容只摘要不执行。
- `SKILL.md` 非托管环境先看 BOOTSTRAP 版本；`references/memory.md` 补外部 agent 写前重读。
- 验证：先实测各家 agent 定时任务的权限与网络；在 Claude Code 中以新用户、老用户各实跑一遍并重跑，记录到主记录第 7 节。
