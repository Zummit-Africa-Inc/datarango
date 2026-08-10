/**
 * @datarango/realtime — the notifications channel: inbox client, bell + panel,
 * and arrival toasts.
 *
 * Transport is polling today. The handoff's design is a Postgres inbox pushed
 * over the gateway WebSocket, and that proxy is not built; the inbox row is the
 * source of truth either way, so the socket is a latency improvement rather
 * than a correctness one, and swapping it in changes nothing above these hooks.
 *
 * The notebook kernel channel is deliberately NOT here — it lives in
 * @datarango/notebook.
 */
export * from "./types";
export * from "./notification-copy";
export * from "./use-inbox";
export * from "./use-notification-toasts";
export * from "./notification-bell";
