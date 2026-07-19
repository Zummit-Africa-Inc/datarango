export type NotebookSessionStatus = "starting" | "idle" | "busy" | "terminating" | "terminated";

export interface NotebookSession {
  id: string;
  userId: string;
  status: NotebookSessionStatus;
  kernelId?: string;
  wsEndpoint?: string;
  idleTimeoutMinutes: number;
  maxLengthMinutes: number;
  startedAt: string;
  lastActivityAt: string;
  endsAt?: string;
}

export interface NotebookFile {
  path: string;
  name: string;
  sizeBytes: number;
  updatedAt: Date;
}
