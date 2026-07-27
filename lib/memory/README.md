# Business memory boundary

`BusinessMemoryModel` is the single source of truth for customer identities, services, cases, evidence, business events, outcomes, growth plans, and measured results.

- `repository.ts` defines the storage boundary.
- `sync.ts` defines a provider-neutral encrypted-sync contract, revision protocol, conflict result, and opt-in coordinator.
- The web demo uses the local repository backed by `bewater_business_memory_v1`.
- There is no legacy-data compatibility layer. The project has not shipped, so new schema changes should update `BusinessMemoryModel` directly.
- There is no cloud persistence adapter enabled in the current product. A future adapter can implement `BusinessMemorySyncAdapter` without changing pages or the business-memory domain model.
- Cloud payloads cross a separate `BusinessMemorySyncCodec` boundary so encryption can happen before upload. The sync protocol uses server revisions and never silently overwrites concurrent local and remote changes.
- Memory export/import serializes the complete `BusinessMemoryModel`; API keys and model preferences remain outside the bundle.
