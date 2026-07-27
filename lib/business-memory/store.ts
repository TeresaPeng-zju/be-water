/**
 * Public business-memory API.
 *
 * UI code imports this facade; persistence and domain operations live in focused
 * modules so a future SQLite or encrypted-cloud adapter does not leak upward.
 */
export * from "./model";
export * from "./repository";
export * from "./workspace";
export * from "./services";
export * from "./growth";
export * from "./demo-seed";
export * from "./record-ingestion";
