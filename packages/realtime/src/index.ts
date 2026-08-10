/**
 * @datarango/realtime — the notifications channel: inbox client, bell + panel,
 * and arrival toasts.
 *
 * Transport is the gateway WebSocket, with polling behind it as a
 * reconciliation heartbeat rather than the driver. The inbox row stays the
 * source of truth, so the socket is a latency improvement and never a
 * correctness dependency: if it never connects, everything still arrives — just
 * later. Swapping it in changed nothing above these hooks, exactly as the
 * polling-era note here predicted.
 *
 * The notebook kernel channel is deliberately NOT here — it lives in
 * @datarango/notebook.
 */
export * from "./types";
export * from "./notification-copy";
export * from "./use-inbox";
export * from "./use-notification-socket";
export * from "./use-notification-toasts";
export * from "./notification-bell";
