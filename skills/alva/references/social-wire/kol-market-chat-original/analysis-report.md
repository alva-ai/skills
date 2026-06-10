# snarketh / kol-market-chat 代码结构研究

日期：2026-06-10 UTC

## 结论

这个 playbook 的核心不在 HTML，而在一个单文件 feed producer：

- ALFS feed source：`/alva/home/snarketh/feeds/kol-market-chat/v1/src/index.js`
- ALFS playbook UI：`/alva/home/snarketh/playbooks/kol-market-chat/index.html`
- ALFS UDF：`/alva/home/snarketh/playbooks/kol-market-chat/udf/post_message.js`
- 本地拷贝：`artifacts/snarketh-kol-market-chat/`

Feed 负责抓 leaderboard、扫 KOL 最近 X posts、去重、调用 AlvaAsk 生成多语言 bot 消息、写 chat/notify 输出；HTML 只是 Slack-style 读 feed 数据并展示，viewer 发言通过 UDF append 到同一个 `chat/messages`。

## 线上对象

- Playbook：`Algostonk KOL Chat`
- Playbook id：`7918`
- Playbook created_at：`2026-06-08T09:38:09Z`
- Playbook updated_at：`2026-06-10T07:41:08Z`
- Latest observed release：`v1.3.5`，`2026-06-10T06:27:19Z`
- Feed id：`13151`
- Feed name：`kol-market-chat`
- Feed major：`1`
- Feed status：`active`
- Producer cronjob id：`15915`
- Feed v1 updated_at：`2026-06-10T07:40:24Z`

最近 100 次 producer run：87 成功，13 失败；最近一次成功在 `2026-06-10T07:40:24Z`。`alva deploy get --id 15915` 对当前身份返回 404，但 `alva deploy runs --id 15915` 可读，所以看得到运行历史，看不到 cron 参数明细。

当前数据量：

- `chat/messages`：133
- `agent/posts`：6154
- `agent/tickers`：968
- `agent/kols`：520
- `notify/message`：126

## Feed Schema

`index.js` 里定义了 5 个主要输出面：

- `config/channels`：5 个预设频道：`market-wire`、`ai-infra`、`crypto`、`macro`、`semis`
- `agent/kols`：leaderboard top KOL 快照，包含榜单、rank、tickers、spotlight、snapshot
- `agent/posts`：本轮扫到的 KOL posts，含 `source_status=new/already_pushed`
- `agent/tickers`：ticker-first context，含 EN/CN/KR reason、source handles/urls、basis
- `chat/messages`：真正给 UI 展示的 owner/viewer/agent 消息
- `notify/message`：push-ready 通知；无新内容时写 `<|SKIP_NOTIFICATION|>`

## Feed 执行链路

1. 从 `zet/alva-kol-leaderboard` 读取 3 个 leaderboard：
   - `win_all_all_s10`
   - `roi_all_all_s10`
   - `bestcall_all_all_s10`
2. 每个榜单取 top 50，合成最多 150 个 KOL watchlist，写 KV：
   - `kol_watchlist_v2`
   - `kol_leaderboard_boards_v2`
   - `kol_watchlist_refreshed_at`
3. Watchlist 每 24h 刷新一次；每个 producer run 通过 cursor 分批扫 KOL：
   - KV cursor：`kol_watchlist_cursor`
   - 代码默认 batch size 是 `16`
   - 实际输出 meta 里看到过 24 个 `batch_handles`，说明 cron 很可能传了 `batch_size=24`，但因 `deploy get` 404 无法直接确认。
4. 对每个 handle 调 Arrays：
   - `GET https://data-tools.prd.space.id/api/v1/social-feeds/x/by-handle`
   - `since = now - 36h`
   - `content_type=original`
   - `limit=6`
   - 每个 handle 最多取 4 条，整体按 `postScore` 排序后取 top 32。
5. 用 KV `pushed_post_ids_v1` 做 post-level dedup，保留 14 天，最多 5000 个 id。
6. 每次都写：
   - `config/channels`
   - 如果 watchlist 刚刷新，写完整 `agent/kols`
   - 如果有 posts，写 top 20 到 `agent/posts`
7. 如果没有未推送的新 post：
   - 写一条 `notify/message`，body 为 `<|SKIP_NOTIFICATION|>`
   - 不调用 AlvaAsk
   - 更新/保存 pushed map 后退出
8. 如果有新 post：
   - 读取最近 80 条 `chat/messages`
   - 用 leaderboard + new posts + previous agent messages + ticker candidates 调 `AlvaAsk`
   - AlvaAsk 失败时走 deterministic fallback
   - 拉 ticker prices（best effort）
   - 写 `agent/tickers`
   - 写一条 agent `chat/messages`
   - 写一条 `notify/message`
   - 将本条消息引用的 post ids 标记为已推送

## UI 和 UDF

HTML 使用 `@alva-ai/toolkit`，每 20 秒刷新一次。前端实际只读 3 类数据：

- `${BASE}/config/channels/@last/20`
- `${BASE}/chat/messages/@last/220`
- `${BASE}/agent/tickers/@last/60`

它不直接读 `agent/kols` 和 `agent/posts`。这两类更像审计/可追溯数据，真正展示依赖 `chat/messages` 里的 i18n、source、ticker 和 meta。

Viewer 发言路径是 UDF：

- UDF：`post_message`
- 必须 signed-in
- channel 必须是 5 个预设频道之一
- text 必填，最长 600 chars
- owner uid `1961440700109172736` 发言标成 `owner`，其他用户是 `viewer`
- 直接 append 到同一个 `chat/messages`

## 值得注意的问题

1. `agent/posts` 增长很快。当前约两天已有 6154 行；它对审计有用，但如果长期运行，可能需要更明确的保留/聚合策略。

2. Feed 对 `ARRAYS_JWT` 强依赖。单个 handle 失败会被容忍，但所有 recent-post lookup 都失败会 throw；如果 secret 缺失，feed 会失败。

3. Watchlist 刷新频率是 24h。KOL universe 可能一天内不变；freshness 主要依赖 Arrays X indexing 和 cursor batch sweep，而不是每次重新算榜单。

4. batch size 有文档/运行差异。代码默认 `16`，README/实际 meta 显示接近 `24`；如果要严格评估全量扫描周期，需要能读 cron args。

5. UI 会过滤没有可追溯 X/Twitter source 的 agent message。代码已经尽量从 `post_ids` 反解 source URLs，但如果最后只落到 leaderboard URL，前端可能不展示这条 bot message。

6. 这不是事实校验系统。prompt 限制模型只能用 INPUT，并要求 no trade recommendations，但它仍是在总结 KOL claim；没有二次来源验证。

7. Price line 是 best effort。最新版本加入了 ticker price/24h change，但它是 alert-time fetch 的辅助上下文，不等价于完整可审计 market data as-of 体系。

## 本地文件

- `feed-index.js`：feed producer 源码拷贝
- `index.html`：playbook UI 拷贝
- `udf-post_message.js`：viewer 发言 UDF 拷贝
- `playbook.json` / `feed-root.json` / `feed-v1.json`：元数据
- `*-last*.json`：线上输出样本
