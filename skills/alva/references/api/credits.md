# Credits — self-scoped usage history

Run `alva credits --help` first; it is the command contract. Use this surface
when the user asks how many credits they have, how many credits they used, or
which recent operations consumed credits.

## Scope

`alva credits` is viewer-scoped. It queries only the authenticated user's wallet
and consumption records. Do not invent or request a `--user-id` flag, and do not
use raw GraphQL for normal self-service credit lookups.

## Commands

Show current wallet balance and UTC-today aggregate:

```bash
alva credits wallet
```

List item-level consumption rows for a time window. Choose exactly one window:

```bash
alva credits items --today --first 20
alva credits items --last 7d --first 50
alva credits items --start 2026-06-23 --end 2026-06-24
```

Filter to a single chat/session when the user asks what one conversation cost:

```bash
alva credits items --last 7d --session-id <session_id> --first 50
```

For pagination, pass the previous response's `items.pageInfo.endCursor`:

```bash
alva credits items --last 30d --first 50 --after '<cursor>'
```

## Interpreting results

- `balance` / `totalRemaining`: current spendable credit balance.
- `todayUsed`: UTC-today aggregate usage.
- `items.edges[].node.amount`: credits consumed by that row.
- `source`: where the usage came from, such as `ask` or `playbook`.
- `sessionId`, `playbookId`, and `feedId`: attribution fields when available.
- `createdAtMs`: Unix milliseconds.

When summarizing usage, state the time window and whether pagination indicates
more rows (`items.pageInfo.hasNextPage`). If `hasNextPage` is true, do not call
the subtotal a complete period total unless you paginate through all rows.
