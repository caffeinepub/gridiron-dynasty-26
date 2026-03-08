// Stub backend type declarations - no Motoko canister deployed.

import type { Identity } from "@dfinity/agent";

export interface backendInterface {
  _initializeAccessControlWithSecret: (token: string) => Promise<void>;
  [key: string]: unknown;
}

export interface CreateActorOptions {
  agentOptions?: {
    identity?: Identity | Promise<Identity>;
    host?: string;
    [key: string]: unknown;
  };
  agent?: unknown;
  processError?: (e: unknown) => never;
  [key: string]: unknown;
}

export declare class ExternalBlob {
  static fromURL(url: string): ExternalBlob;
  static fromBytes(bytes: Uint8Array): ExternalBlob;
  get url(): string;
  getBytes(): Promise<Uint8Array>;
  onProgress(progress: number): void;
}

export declare function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): Promise<backendInterface>;
