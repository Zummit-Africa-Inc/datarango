"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectGatewaySocket } from "@datarango/api";

import { inboxQueryKey, unreadQueryKey } from "./use-inbox";

/**
 * Live notifications over the gateway WebSocket.
 *
 * This is the socket the inbox client always said would replace what drives its
 * query keys — and that is all it does. It carries **no notification content**:
 * a frame arrives, the inbox and badge keys are invalidated, and the existing
 * REST reads fetch through their normal authorised path. So there is exactly one
 * shape of a notification and one place that decides who may read it, rather
 * than a second copy arriving down a channel with its own rules.
 *
 * The Postgres row remains the source of truth, which is what makes the socket
 * a latency improvement rather than a correctness dependency: if it never
 * connects, polling still shows everything, just later.
 */
export const useNotificationSocket = (options: { enabled?: boolean } = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    const disconnect = connectGatewaySocket({
      path: "/ws/notifications",
      ticketPath: "/platform/notifications/ticket",
      onMessage: () => {
        // Invalidate rather than write the payload into the cache. The frame is
        // a nudge, not data — trusting it to update the badge would put a second
        // source of truth on the client and let a dropped frame desynchronise
        // the count from the inbox.
        void queryClient.invalidateQueries({ queryKey: unreadQueryKey });
        void queryClient.invalidateQueries({ queryKey: inboxQueryKey });
      },
      onStatusChange: setConnected,
    });

    return disconnect;
  }, [enabled, queryClient]);

  return { connected };
};
