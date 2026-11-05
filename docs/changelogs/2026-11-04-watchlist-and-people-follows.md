# Route watchlist and people follow requests to the Toolkit commands

A Feed App user asked Alva to add their held tickers to the watchlist and Alva
answered that it had no permission to change the App's list. Toolkit now
exposes the App's ticker watchlist (`alva markets watchlist list|add|remove`)
and people follows (`alva people search`, `alva people follows
list|follow|unfollow`), under the same paths in the terminal and embedded
CLIs. Product semantics: tickers
are added to the watchlist, people are followed, and a Thesis is bookmarked
(existing `thesis star|unstar`). This record adds the matching skill guidance:

- SKILL.md: the command-family index lists `markets` / `people` for the
  watchlist and people follows, and a routing row points these requests to the
  new section.
- request-routing.md: `Watchlist and People Follows` states the three
  semantics and covers acting only on the user's request, one call for all
  requested tickers with a per-symbol kind suffix (`BTC:crypto`) for mixed
  kinds, reading holdings with `portfolio accounts` / `portfolio summary` for
  "my holdings" across every account (adding also restores a ticker the user
  removed earlier, so the Agent reports what was added), exact-match profile
  selection by name or username, and reporting changed, unchanged, and
  unresolved groups (an ambiguous ticker fails alone) without substituting
  similar symbols. A cold-read audit (alva-skill-standard) trimmed lines that
  restated CLI help.
- cases.json: `target.watchlist-and-people-follows` guards these pointers and
  excludes the unreleased `subscriptions watchlist-add` / `search-profiles` /
  `follow-profile` / `subscriptions profiles` names.

Primary implementation record:
toolkit-ts docs/changelogs/2026-11-04-agent-watchlist-and-people-follows.md

The guidance depends on a Toolkit release that includes these commands; until
that release reaches the Sandbox CLI, the commands are unavailable there.

Verification: skill-doc-eval passes with no failing case (the new case fails
when an old command name is reintroduced), mutation-smoke 50/50,
durable-agent tests 5/5. The commands were exercised live on STG through the
Toolkit branch (alva-ai/toolkit-ts#204). No release or runtime deployment was
performed.
