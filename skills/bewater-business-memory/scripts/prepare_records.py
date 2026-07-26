#!/usr/bin/env python3
"""Prepare text-like business records with stable refs for BeWater analysis."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Any

SUPPORTED = {".txt", ".md", ".json", ".csv"}


def read_record(path: Path) -> str:
    if path.suffix.lower() == ".json":
        value: Any = json.loads(path.read_text(encoding="utf-8"))
        return json.dumps(value, ensure_ascii=False, indent=2)
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.reader(handle))
        return "\n".join(" | ".join(cell.strip() for cell in row) for row in rows)
    return path.read_text(encoding="utf-8")


def source_type(path: Path, text: str) -> str:
    sample = f"{path.stem} {text[:800]}".lower()
    if any(token in sample for token in ("会议", "meeting", "transcript", "发言人")):
        return "meeting_transcript"
    if any(token in sample for token in ("反馈", "feedback", "好评", "收获")):
        return "customer_feedback"
    if any(token in sample for token in ("交付", "delivery", "deliverable")):
        return "delivery_note"
    if any(token in sample for token in ("客户", "微信", "chat", "咨询")):
        return "client_chat"
    return "manual_note"


def collect(target: Path, output: Path | None) -> list[dict[str, Any]]:
    candidates = [target] if target.is_file() else sorted(target.rglob("*"))
    records: list[dict[str, Any]] = []
    for path in candidates:
        if not path.is_file() or path.suffix.lower() not in SUPPORTED:
            continue
        if output and path.resolve() == output.resolve():
            continue
        text = read_record(path).strip()
        if not text:
            continue
        relative = path.name if target.is_file() else path.relative_to(target).as_posix()
        digest = hashlib.sha256(f"{relative}\0{text}".encode()).hexdigest()[:12]
        records.append(
            {
                "source_ref": f"record:{digest}",
                "source_type": source_type(path, text),
                "path": relative,
                "raw_text": text,
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="A record file or directory")
    parser.add_argument("--output", type=Path, help="Write JSON to this path")
    args = parser.parse_args()
    if not args.target.exists():
        parser.error(f"target does not exist: {args.target}")
    payload = {"format": "bewater-business-memory-v1", "records": collect(args.target, args.output)}
    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
