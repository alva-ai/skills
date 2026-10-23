# Thesis 查询与引用追问衔接

## 1. 背景

卡片引用带 Thesis/version ID，但人物作者的 slug 在 Gateway 和 Toolkit 丢失。Full 已有读取契约，Slim 缺少同等入口。

## 2. 批准行为

B1：按用户实际问题选择作者、标的、相关观点或 Signals。B2：使用返回的真实身份，不猜 ID，不把当前正文替换旧引用。B3：读操作不进入发布、更新或资产抽取流程。

## 3. 设计

Full 只补引用后的读取分流与身份衔接，保留原文版本；不动发布和更新。

新增字段为可选，兼容未返回 slug 的旧服务。Person 使用 slug，PublicUser 使用 username；名称歧义沿用现有 CLI 候选澄清。跨仓库同名 changelog：skills、toolkit-ts、alva-gateway、sdk-monorepo。

## 4. 实现范围

只修改 Thesis 读取契约、必要路由指针、GET 字段透传及嵌入依赖。Toolkit 先本地提交，再更新 Dispatch gitlink，以真实构建产物验证字段不丢失。

## 5. 验证

Gateway：`go test ./pkg/handler -run TestThesis -count=1`、`make lint-fix`。Toolkit：Thesis resource/CLI 测试和 typecheck。SDK：Dispatch 构建、产物测试、typecheck；Slim 中英文文档检查。Full：doc、mutation、durable 检查。各仓库 git diff --check，比较发布/更新段落未变。

E2E Required: no。稳定边界为只读 GET→SDK/Dispatch→现有 list 的元数据契约；用 handler 与真实打包产物测试覆盖。真实 Full/Slim 对话需要非空 fixture，由后续定向 Eval 验证，不以文档断言代替行为效果。Gateway 之外无 make lint-fix 目标时不另造 lint 命令。

## 6. 用户决定与顺序

2026-10-23 用户批准三项最小改动，Full/Slim 中英文同步，不碰发布和更新。

- [x] 透传并验证作者 slug。
- [x] 补读取规则及中英文路由。
- [x] 构建直接消费者，完成整体 review 和 Eval 交接。

## 7. 结果

Full 文档 110/110、1277/1277 检查；mutation 48/48；durable-agent 5/5。命令：`node evals/alva-skill-docs/skill-doc-eval.mjs`、`node evals/alva-skill-docs/mutation-smoke.mjs`、`node --test evals/alva-skill-docs/durable-agent.test.mjs`。git diff --check 通过。

B1/B2：只增加 12 行读取衔接；B3：Authorship 至 Quoted Thesis context 之间的正文与本批前逐字一致，发布和更新流程未动。更广场景的真实对话效果待 Eval，文档检查不证明模型表现。

## 8. 后续

Gateway、Toolkit、Dispatch 需依次合入/发布后再验收新字段。使用真实非空作者/标的/相关推荐/Signals 数据；没有数据不能证明查询准确性。当前不发布、不改变线上配置。


2026-10-23 定向 Eval：Full/Sandbox 与 Slim/ALPI 各两条真实对话均正确读取注册用户正文和作者，卡片追问接续 get→list；四条均缺用户要求的链接，故为部分完成。无 Person/ticker/Related/Signals/分页覆盖，免责声明未复测，未验证双方 fast，不作提速结论。报告：`/Users/leozhou/.codex/visualizations/2026/10/13/01a13424-d249-7ba1-accc-0bbc67c5a422/thesis-repair-eval-20261023/Repair-and-Targeted-Eval.md`。链接契约与尾部重复查找作为后续独立事项，不夹入本次提交。
