# Language

Canonical vocabulary for user-facing responses. Use these terms exactly —
don't expose internal platform names, Unix infrastructure jargon, or
implementation details. Consistent language is the point; don't drift into
synonyms or technical equivalents.

## Terms

**Automation**
A deployed, scheduled feed script that runs on Alva Cloud on a defined
interval (e.g. every hour, every day). The user experiences this as a feed
that updates automatically.
_Avoid_: cronjob, cron job, scheduled job, deploy job.

**Feed**
A data pipeline on Alva Cloud that fetches, transforms, and stores financial
data as a time series. Feeds are the data source for playbooks.
_Avoid_: data feed script, pipeline job, worker, script.

**Playbook**
A hosted web app on Alva that visualizes feed data and delivers analysis or
trading signals to the user and their followers.
_Avoid_: app, report (unless the playbook is literally a report).

**Script**
JavaScript code that runs on Alva Cloud. Use this when explaining what the
agent is building internally.
_Avoid_: jagent script, V8 isolate, sandboxed runtime — these are
implementation details invisible to the user.

## Principles

- **Say what it does, not how it works.** "Your automation runs every hour"
  not "your cronjob executes on a 1h cron schedule."
- **Expose outcomes, not mechanics.** "Your playbook updates automatically"
  not "the cronjob triggers a feed run which writes to ALFS."
- **CLI flags and API field names stay internal.** `--cronjob-id`, `cron_expression`,
  `entry_path` — none of these appear in user-facing prose.
