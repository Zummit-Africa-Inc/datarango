import { getApi } from "./configure";

/**
 * The gateway WebSocket transport.
 *
 * It lives in `@datarango/api` because §3 makes this the only package allowed to
 * talk to the gateway, and a socket is talking to the gateway. Feature packages
 * consume the connection; they do not open one.
 *
 * **Authentication is a ticket, not the token.** A browser cannot set an
 * `Authorization` header on a WebSocket handshake, which leaves the token in the
 * query string — logged by every proxy in the path, kept in browser history, and
 * leaked through `Referer`. So an ordinary authenticated POST mints a
 * short-lived single-use ticket and only that appears in the URL.
 */

export interface GatewaySocketOptions {
  /** Gateway path to connect to, e.g. `/ws/notifications`. */
  path: string;
  /** Path of the authenticated endpoint that mints the handshake ticket. */
  ticketPath: string;
  /** Called for every application message. Ping frames are filtered out first. */
  onMessage: (data: unknown) => void;
  /** Called when the connection opens or closes, for UI that reflects liveness. */
  onStatusChange?: (connected: boolean) => void;
}

interface Ticket {
  ticket: string;
}

/** Backoff schedule, in ms. Caps rather than growing without bound. */
const RETRY_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * Opens a reconnecting gateway socket.
 *
 * @returns A disposer. Calling it stops reconnection as well as closing the
 *   socket — without that distinction a component unmounting mid-backoff leaves
 *   a timer that reconnects into nothing.
 */
export const connectGatewaySocket = ({
  path,
  ticketPath,
  onMessage,
  onStatusChange,
}: GatewaySocketOptions): (() => void) => {
  let socket: WebSocket | null = null;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const wsUrl = (ticket: string): string => {
    const base = getApi().baseUrl.replace(/^http/, "ws").replace(/\/$/, "");
    return `${base}${path}?ticket=${encodeURIComponent(ticket)}`;
  };

  const scheduleRetry = () => {
    if (disposed) return;
    const delay = RETRY_DELAYS[Math.min(retry, RETRY_DELAYS.length - 1)];
    retry += 1;
    timer = setTimeout(open, delay);
  };

  const open = async () => {
    if (disposed) return;

    let ticket: string;
    try {
      // The token travels here, in a normal POST body-less request with an
      // Authorization header — never in the socket URL.
      ({ ticket } = await getApi().post<Ticket>(ticketPath));
    } catch {
      // Signed out, offline, or the gateway is down. Backoff and try again;
      // the inbox row is still the source of truth meanwhile.
      scheduleRetry();
      return;
    }

    if (disposed) return;

    const next = new WebSocket(wsUrl(ticket));
    socket = next;

    next.onopen = () => {
      retry = 0;
      onStatusChange?.(true);
    };

    next.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as { type?: string };
        // The server pings to keep intermediaries from reaping an idle
        // connection. It is transport noise, not an event.
        if (payload?.type === "ping") return;
        onMessage(payload);
      } catch {
        // A frame we cannot parse is not worth tearing the connection down for.
      }
    };

    next.onclose = () => {
      onStatusChange?.(false);
      if (socket === next) socket = null;
      scheduleRetry();
    };

    // `onerror` is always followed by `onclose`, so reconnection is handled in
    // one place rather than racing two handlers into two sockets.
    next.onerror = () => next.close();
  };

  void open();

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    if (socket) {
      // Drop the handler first: closing deliberately must not look like a
      // dropped connection and schedule a reconnect.
      socket.onclose = null;
      socket.close();
    }
  };
};
