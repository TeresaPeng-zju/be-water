# Evidence and inference rules

## Memory ladder

Use this order:

```text
Raw evidence -> Fact -> Business event -> Observation -> Pattern -> Principle
```

- Raw evidence is the original chat, transcript, note, screenshot text, or record.
- A fact is directly checkable from raw evidence.
- A business event describes a real operating change such as a lead, booking, delivery, feedback, or follow-up commitment.
- An observation is a worthwhile signal from one case or limited evidence.
- A pattern requires a similar signal in at least two independent cases.
- A principle requires repeated validation across cases or experiments. Do not create one from early evidence.

## Allowed business events

Prefer these event types:

- `lead_created`
- `booking_confirmed`
- `payment_discussed`
- `preparation_requested`
- `preparation_received`
- `delivery_started`
- `delivery_completed`
- `feedback_requested`
- `feedback_received`
- `follow_up_committed`
- `other`

Keep scheduled service time, actual service start, and promised deliverable date separate.

## Four independent case dimensions

- Commercial: `lead`, `booked`, `confirmed`, `closed`, `cancelled`
- Delivery: `not_started`, `preparing`, `in_progress`, `delivered`, `accepted`
- Payment: `unknown`, `pending`, `partial`, `paid`, `refunded`, `not_applicable`
- Outcome: `unknown`, `awaiting_feedback`, `reported`, `verified`

Change only the dimension directly supported by evidence. A completed meeting can support delivery progress without proving payment or customer outcome.

## Identity and pricing

- Treat chat handles, meeting names, and marketplace names as identity candidates.
- Do not create a second customer when known context plausibly identifies the person; request confirmation when needed.
- Never label the service provider as the customer.
- Treat a service list price as a baseline, not the actual quote. Record a quote only when the source states it.

## Outcome verification

- `self_reported`: the customer says they gained or changed something.
- `observed`: a change can be observed in the supplied material.
- `verified`: independent result evidence exists.

Do not upgrade praise into a verified long-term outcome.

## Confidence

- `gathering`: evidence has just started accumulating.
- `emerging`: repetition exists, but the sample is still small.
- `supported`: at least three independent cases or several mutually supporting evidence dimensions exist.

Channels and outcomes appearing together indicate a correlation candidate, not causation. Do not judge a new or low-volume channel as ineffective.
