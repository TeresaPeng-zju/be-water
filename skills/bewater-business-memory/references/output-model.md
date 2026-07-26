# Structured output model

Use this model when the user requests JSON or a persistent workspace.

## Source

```json
{
  "source_ref": "record:001",
  "source_type": "client_chat",
  "path": "records/client-a-chat.md",
  "raw_text": "..."
}
```

## Fact and event

```json
{
  "facts": [
    {
      "type": "quoted_price",
      "value": "1200 CNY",
      "evidence": "这次费用是 1200",
      "source_ref": "record:001",
      "confidence": 0.98
    }
  ],
  "business_events": [
    {
      "type": "booking_confirmed",
      "summary": "双方确认周三进行服务",
      "occurred_at": null,
      "scheduled_start_at": "2026-07-29T20:00:00+08:00",
      "evidence": ["那就周三晚上八点"],
      "source_refs": ["record:001"],
      "next_actions": []
    }
  ]
}
```

## State proposal

```json
{
  "dimension": "commercial",
  "from": "lead",
  "to": "booked",
  "reason": "双方确认了服务时间",
  "source_refs": ["record:001"],
  "confidence": 0.91,
  "requires_confirmation": true
}
```

## Observation

```json
{
  "kind": "observation",
  "title": "客户在报价前反复确认交付范围",
  "body": "当前材料显示范围确认可能影响成交，但只有一个案例，尚不能形成模式。",
  "confidence": "gathering",
  "source_refs": ["record:001"]
}
```

Use `kind: pattern` only with at least two independent case refs. Limit each observation to 1–6 real source refs. Never invent a ref.
