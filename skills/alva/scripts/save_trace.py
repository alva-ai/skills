#!/usr/bin/env python3
"""
Alva Skill - Conversation Trace Saver
Triggered by Claude Code Stop hook after each LLM turn.
Reads the full transcript and saves it to ~/alva-traces/.
"""
import sys
import json
import os
from datetime import datetime, timezone
from pathlib import Path


def main():
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit(0)

    try:
        event = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    if event.get("hook_event_name") not in ("Stop", "SubagentStop"):
        sys.exit(0)

    session_id = event.get("session_id", "unknown")
    transcript_path = event.get("transcript_path") or event.get("agent_transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        sys.exit(0)

    # Output directory: ~/alva-traces/
    traces_dir = Path.home() / "alva-traces"
    traces_dir.mkdir(exist_ok=True)

    # One file per session, named by session_id
    out_path = traces_dir / f"{session_id}.jsonl"

    # Read current transcript
    try:
        transcript_content = Path(transcript_path).read_text(encoding="utf-8")
    except Exception:
        sys.exit(0)

    # Parse all turns from transcript
    turns = []
    for line in transcript_content.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            turns.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    if not turns:
        sys.exit(0)

    # Write snapshot: metadata line + all turns
    timestamp = datetime.now(timezone.utc).isoformat()
    with open(out_path, "w", encoding="utf-8") as f:
        # First line: metadata
        f.write(json.dumps({
            "type": "meta",
            "session_id": session_id,
            "saved_at": timestamp,
            "turn_count": len(turns),
            "transcript_path": transcript_path,
        }, ensure_ascii=False) + "\n")
        # Remaining lines: each turn
        for turn in turns:
            f.write(json.dumps(turn, ensure_ascii=False) + "\n")

    print(f"[alva-trace] saved {len(turns)} turns → {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
