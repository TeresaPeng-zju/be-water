---
name: bewater-business-memory
description: Turn raw client conversations, meeting transcripts, delivery notes, feedback, and business records into an evidence-backed business memory for solo service providers and small professional teams. Use when Codex needs to organize real operating material, extract verifiable facts and business events, update a client case across commercial/delivery/payment/outcome dimensions, compare cases for recurring signals, diagnose acquisition or delivery friction, or identify reusable templates and SOP opportunities. Trigger for requests such as整理客户聊天、记录一次交付、复盘经营、比较案例、寻找重复问题、沉淀服务经验、生成经营观察, even when the user does not name BeWater.
---

# BeWater Business Memory

Treat business memory as an evidence system, not a generic summary or advice generator.

## Core workflow

1. Locate the user's raw records. Accept pasted text or files such as Markdown, text, JSON, and CSV.
2. For a directory of files, run `python3 scripts/prepare_records.py <path> --output <workspace.json>` to create stable source references. Do not run it for a single short pasted record.
3. Classify each source as client chat, meeting transcript, delivery note, customer feedback, manual note, or other.
4. Extract only claims supported by the source. Separate facts, business events, outcome claims, and unknowns.
5. Propose case-state changes independently across commercial, delivery, payment, and outcome. Never apply an ambiguous proposal as confirmed.
6. When two or more independent cases exist, compare them for recurring signals. Call a single occurrence an observation, not a pattern.
7. Return a concise business-memory update with source references beside every observation or pattern.
8. Suggest a reusable asset only when repeated work or validated material exists. Preserve its source cases.

Read [references/evidence-rules.md](references/evidence-rules.md) before interpreting records. Read [references/output-model.md](references/output-model.md) when producing structured JSON or updating a persistent workspace.

## Evidence discipline

- Preserve the raw material and give each source a stable `source_ref`.
- Quote only the shortest evidence fragment needed to verify a claim.
- Treat known context as background, never as new evidence.
- Do not infer causation from correlation, silence, or missing fields.
- Distinguish customer self-report, observable change, and independently verified outcome.
- Ask only questions that would materially change identity resolution, event type, or case state.
- Match the user's language.

## Response shape

For a single record, return:

1. `发生了什么` — a short operating update.
2. `可核对事实` — facts with evidence and source refs.
3. `经营事件` — what changed, event time if known, and direct next actions.
4. `状态建议` — dimension, from/to, evidence, confidence, and whether confirmation is required.
5. `仍需确认` — only material ambiguities.

For multi-case analysis, return:

1. `当前最重要的信号`.
2. Observations and patterns, each labeled `gathering`, `emerging`, or `supported` and citing 1–6 source refs.
3. Evidence gaps that prevent a stronger conclusion.
4. One or two small experiments tied to the cited evidence.
5. Reusable asset candidates with their source cases.

Never present generic growth advice as a BeWater observation.
