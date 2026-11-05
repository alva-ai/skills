# Route watchlist and people follow requests to the Toolkit commands

A Feed App user asked Alva to add their held tickers to the watchlist and Alva
answered that it had no permission to change the App's list. Toolkit now
exposes the App's ticker watchlist (`alva markets watchlist add|remove|list`)
and people follows (`alva people search`, `alva people follows
follow|unfollow|list`). Product semantics: tickers
are added to the watchlist, people are followed, and a Thesis is bookmarked
(existing `thesis star|unstar`). This record adds the matching skill guidance:

- SKILL.md: the command index lists the ticker watchlist under `markets` and
  people follows under `people`, and a routing row points these requests to
  the new section.
- request-routing.md: `Watchlist and People Follows` states the three
  semantics and covers acting only on the user's request, one call for all
  requested tickers, reading holdings first for "my holdings", exact-match
  profile selection, and reporting changed, unchanged, and unresolved groups
  without substituting similar symbols.
- cases.json: `target.watchlist-and-people-follows` guards these pointers.

Primary implementation record:
toolkit-ts docs/changelogs/2026-11-04-agent-watchlist-and-people-follows.md

The guidance depends on a Toolkit release that includes these commands; until
that release reaches the Sandbox CLI, the commands are unavailable there.

Verification: skill-doc-eval 118/118 (1408/1408 checks; the new case fails
when the watchlist command in its guidance is changed), mutation-smoke 50/50,
durable-agent tests 5/5. No release or runtime deployment was performed.

Update after toolkit-ts 205bdc6: the commands moved to `alva markets watchlist
...` and `alva people ...` (one path in the terminal and embedded catalogs), and
an ambiguous ticker is retried with a per-symbol kind suffix such as
`BTC:crypto`. The guidance, index rows, and eval case follow those paths;
skill-doc-eval 118/118 (1408/1408 checks), mutation-smoke 50/50, durable-agent
5/5 after the change.
