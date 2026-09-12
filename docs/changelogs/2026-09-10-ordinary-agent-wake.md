# ALPI #130 普通入口与 home 路径简化

## 1. 问题
旧实现跨 Backend/Jagent/ALPI 维护 Agent admission、cwd ownership 和 exact-message ack，超出所需生命周期。

## 2. 已批准行为
保留持久 Inbox、稳定 ID、严格 Session restore、Session 单写者；普通 entry 每次加载 live agent.js。
不同 Session 可并发；dispatch 后 busy/error/unknown 不重发；成功表示程序完成，不认证 exact ack。

## 3. 范围
统一 native ALFS 与 ALPI 的 ~；示例目录名不作平台约束。无新增公共 API、schema 或队列协议。

## 4. 实现
完整设计与接口记录在 ALPI changelogs/2026-09-10-ordinary-agent-wake.md。
本仓修改以当前未提交 diff 为准；旧 admission 完成记录是历史证据。
SDK 从 registry 分发 Pi，依赖 gitlink 在获准提交 ALPI 后更新，不恢复 Jagent embedded bundle。

## 5. 验证
E2E Required: yes。目标 TestAgentScheduleSessionInbox，使用任务专属 disposable Forge VM，真实 Linux JuiceFS/ALFS 和本地 faux relay。
本轮编译、单测、lint 与 E2E 结果区分记录；不复用旧语义通过结论。

## 6. 执行顺序
provider 源码与本地构建 → 消费者/文档/测试 → code checks → review → E2E → 清理与证据。

## 7. 当前状态
代码及相关本地检查完成。真实 Linux JuiceFS/ALFS、Hatchet、Backend、Gateway、Jagent 与本地 registry 的 8 项 TestAgentScheduleSessionInbox 全通过（284.939s）。
验收采用本次未提交源码构建的 Pi 产物，SHA-256 为 40efe38015d65aaeaeec328e495c81191232ca07c0fa0ab9d464626b04662acc。
日志、镜像 digest 和源码 manifest 已导出至 /private/tmp/alpi-130-acceptance/evidence；未提交、推送、合并、发布或部署。

## 8. 待完成
源码提交与 SDK gitlink 更新留待 commit 授权，不伪造来源版本；提交阶段需核对实际 source pins 和当时远端基线。历史 PR CI 不证明本轮未提交代码。

## 提交阶段（2026-09-10）

用户已明确授权提交、推送并更新现有 PR，同时允许同步 Notion。上文未提交状态为验收完成时的历史记录。
提交阶段更新 SDK 的真实 ALPI gitlink 并校验官方构建；运行时未变时复用 8/8 E2E 的源码与产物证据。
不合并 PR，不发布 SDK/Skill，不执行线上迁移或部署。测试 VM 已销毁并确认 HTTP 404。
