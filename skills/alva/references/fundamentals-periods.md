# Fundamentals: Fiscal vs Calendar Periods

Company fundamentals — income statement, balance sheet, cash flow — are
reported by **fiscal** period, which is not always the calendar quarter. Apply
this whenever a chart, table, metric card, or query answer displays quarterly
or annual fundamentals, and whenever you compute YoY or QoQ growth.

## The record carries its own period — derive the label, never author it

Every fundamentals record has three period fields:

| Field | Meaning |
| --- | --- |
| `calendarEndDate` | Last day of the reporting period, e.g. `2024-10-27` |
| `fiscalYear` | Fiscal year the period belongs to, e.g. `"2025"` |
| `period` | The **fiscal** quarter, e.g. `"Q3"` (or `"FY"` for annual) |

A period label shown to the user MUST be derived from these fields of the
record actually plotted. Never write a label from your own sense of the
calendar, and never shift it to a neighboring quarter to match an expectation.

## `period` is fiscal, not calendar

`fiscalYear` + `period` name the company's fiscal quarter. When a company's
fiscal year is not the calendar year, its fiscal quarters are offset from
calendar quarters:

- **NVDA** — fiscal year ends in late January. NVDA `fiscalYear="2025"`,
  `period="Q4"` has `calendarEndDate ≈ 2025-01-26` and covers **Nov 2024–Jan
  2025**. NVDA `fiscalYear="2026"`, `period="Q3"` (`calendarEndDate
  2025-10-26`) covers **Aug–Oct 2025**.
- **AMD** — fiscal year is the calendar year, so AMD `period="Q4"` covers
  calendar Oct–Dec.

Never present a fiscal `period` as a calendar quarter.

## Comparing companies in one chart or table

Two companies' records with the same `period` string can have
`calendarEndDate`s a full quarter apart. To place them under one shared label
or axis bucket:

1. **Align by `calendarEndDate`, not by the `period` string.** Pick each
   company's record whose reporting window actually overlaps the others'.
2. **If the closest records still differ by ~a month** (e.g. NVDA fiscal Q4
   ends January, AMD fiscal Q4 ends December), that is the closest honest
   comparison — keep it, but disclose the offset on the artifact: a footnote or
   axis note such as "NVDA fiscal Q4 ends Jan, ~1 month after AMD".
3. **If no records overlap acceptably**, label each company by its own fiscal
   period with `calendarEndDate` shown, or ask the user which basis they want.

A shared bucket label must hold records that actually share that period.
Bucketing one company's non-overlapping quarter (NVDA Aug–Oct) under another
company's label (AMD's Oct–Dec "Q4") is forbidden — it makes every ratio drawn
from that bucket false.

## YoY, QoQ, and other period-derived metrics

A growth metric inherits the alignment of the records it is built from. Compute
YoY from two records of the **same company** the right distance apart: same
`period`, `fiscalYear` differing by 1 (equivalently, `calendarEndDate`s
~12 months apart). QoQ uses consecutive fiscal quarters. A ratio computed
across misaligned records is wrong, and the error then propagates into every
metric card and narrative line that cites it.
