import { connectGatewayChannel, getApi, type GatewayChannel } from "@datarango/api";

import { kernelBase } from "./contents";
import { type KernelStatus, type MimeBundle, type Output } from "./types";

/**
 * A client for one Jupyter kernel behind the gateway's kernel proxy, speaking
 * the Jupyter messaging protocol (v5) as JSON over the `channels` WebSocket.
 *
 * The browser never sees the kernel's token: REST calls carry the usual
 * bearer, and the socket opens with a single-use ticket from
 * `/notebook/sessions/{id}/ticket`. The gateway swaps either for the token.
 */

interface KernelModel {
  id: string;
  name: string;
  execution_state?: string;
}

interface Header {
  msg_id: string;
  msg_type: string;
  session: string;
  username: string;
  date: string;
  version: string;
}

interface Message {
  header: Header;
  parent_header: Partial<Header>;
  metadata: Record<string, unknown>;
  content: Record<string, unknown>;
  channel: "shell" | "iopub" | "stdin" | "control";
}

export interface ExecuteHandlers {
  /** A new output for this cell. */
  onOutput: (output: Output) => void;
  /** `clear_output`: drop the cell's outputs (now, or before the next one when `wait`). */
  onClear: (wait: boolean) => void;
  /** The execution count, as soon as the kernel assigns it. */
  onExecutionCount: (count: number) => void;
}

export interface ExecuteResult {
  status: "ok" | "error" | "aborted";
}

interface Pending {
  handlers: ExecuteHandlers;
  replied: boolean;
  idle: boolean;
  status: ExecuteResult["status"];
  resolve: (result: ExecuteResult) => void;
}

const PROTOCOL_VERSION = "5.3";

const newId = () => crypto.randomUUID();

export class KernelClient {
  readonly sessionId: string;
  private kernelId: string | null = null;
  private channel: GatewayChannel | null = null;
  private readonly clientSession = newId();
  private readonly pending = new Map<string, Pending>();
  private readonly listeners = new Set<(status: KernelStatus) => void>();
  private current: KernelStatus = "connecting";

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  get status(): KernelStatus {
    return this.current;
  }

  /** Subscribes to status changes. Returns an unsubscriber. */
  onStatus(listener: (status: KernelStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  /**
   * Attaches to the session's kernel, starting one if none is running.
   *
   * Reusing the running kernel is deliberate: leaving the page and coming back
   * keeps your variables, the way a Jupyter tab does.
   */
  async connect(): Promise<void> {
    const api = getApi();
    const base = kernelBase(this.sessionId);
    const running = await api.get<KernelModel[]>(`${base}/api/kernels`);
    const kernel =
      running[0] ?? (await api.post<KernelModel>(`${base}/api/kernels`, { name: "python3" }));
    this.kernelId = kernel.id;

    this.channel = connectGatewayChannel({
      path: `${base}/api/kernels/${kernel.id}/channels`,
      ticketPath: `/notebook/sessions/${this.sessionId}/ticket`,
      onMessage: (data) => this.handle(data as Message),
      onStatusChange: (connected) => {
        if (connected) {
          this.setStatus("idle");
          // Ask rather than assume: a kernel we reattach to may be mid-run.
          this.request("kernel_info_request", {});
        } else {
          this.setStatus("disconnected");
          // Replies to anything in flight went with the old socket.
          this.finishAll("aborted");
        }
      },
    });
  }

  /** Runs code. Resolves once the kernel has replied and gone idle for it. */
  execute(code: string, handlers: ExecuteHandlers): Promise<ExecuteResult> {
    return new Promise((resolve) => {
      const msgId = this.request("execute_request", {
        code,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
        stop_on_error: true,
      });
      if (!msgId) {
        resolve({ status: "aborted" });
        return;
      }
      this.pending.set(msgId, { handlers, replied: false, idle: false, status: "ok", resolve });
    });
  }

  async interrupt(): Promise<void> {
    if (!this.kernelId) return;
    await getApi().post(`${kernelBase(this.sessionId)}/api/kernels/${this.kernelId}/interrupt`);
  }

  /** Restarts the kernel: variables are lost, files are not. */
  async restart(): Promise<void> {
    if (!this.kernelId) return;
    this.setStatus("restarting");
    this.finishAll("aborted");
    await getApi().post(`${kernelBase(this.sessionId)}/api/kernels/${this.kernelId}/restart`);
  }

  /** Closes the socket. The kernel keeps running until the session ends. */
  dispose(): void {
    this.channel?.close();
    this.channel = null;
    this.finishAll("aborted");
    this.listeners.clear();
  }

  private request(msgType: string, content: Record<string, unknown>): string | null {
    const msgId = newId();
    const message: Message = {
      header: {
        msg_id: msgId,
        msg_type: msgType,
        session: this.clientSession,
        username: "",
        date: new Date().toISOString(),
        version: PROTOCOL_VERSION,
      },
      parent_header: {},
      metadata: {},
      content,
      channel: "shell",
    };
    return this.channel?.send({ ...message, buffers: [] }) ? msgId : null;
  }

  private handle(message: Message): void {
    const type = message.header?.msg_type;
    const content = message.content ?? {};

    if (type === "status") {
      const state = content.execution_state as KernelStatus;
      if (["idle", "busy", "starting", "restarting", "dead"].includes(state)) this.setStatus(state);
    }

    const parentId = message.parent_header?.msg_id;
    const run = parentId ? this.pending.get(parentId) : undefined;
    if (!run) return;

    switch (type) {
      case "execute_input":
        if (typeof content.execution_count === "number") {
          run.handlers.onExecutionCount(content.execution_count);
        }
        break;
      case "stream":
        run.handlers.onOutput({
          output_type: "stream",
          name: content.name as "stdout" | "stderr",
          text: content.text as string,
        });
        break;
      case "display_data":
      case "update_display_data":
        run.handlers.onOutput({
          output_type: "display_data",
          data: content.data as MimeBundle,
          metadata: (content.metadata as Record<string, unknown>) ?? {},
        });
        break;
      case "execute_result":
        run.handlers.onOutput({
          output_type: "execute_result",
          data: content.data as MimeBundle,
          metadata: (content.metadata as Record<string, unknown>) ?? {},
          execution_count: content.execution_count as number,
        });
        break;
      case "error":
        run.handlers.onOutput({
          output_type: "error",
          ename: content.ename as string,
          evalue: content.evalue as string,
          traceback: content.traceback as string[],
        });
        break;
      case "clear_output":
        run.handlers.onClear(Boolean(content.wait));
        break;
      case "execute_reply":
        run.replied = true;
        run.status = content.status as ExecuteResult["status"];
        break;
      case "status":
        if (content.execution_state === "idle") run.idle = true;
        break;
    }

    // Outputs travel on iopub and the reply on shell, so they can arrive in
    // either order: done means both the reply and the idle status are in.
    if (run.replied && run.idle) {
      this.pending.delete(parentId!);
      run.resolve({ status: run.status });
    }
  }

  private finishAll(status: ExecuteResult["status"]): void {
    for (const run of this.pending.values()) run.resolve({ status });
    this.pending.clear();
  }

  private setStatus(status: KernelStatus): void {
    if (status === this.current) return;
    this.current = status;
    for (const listener of this.listeners) listener(status);
  }
}
