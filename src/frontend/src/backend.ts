// Stub backend - no Motoko canister deployed for this project.
// This file satisfies TypeScript imports in generated platform hooks (config.ts, useActor.ts).

import type { Identity } from "@dfinity/agent";

export interface backendInterface {
  _initializeAccessControlWithSecret: (token: string) => Promise<void>;
  // biome-ignore lint: stub interface
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

export class ExternalBlob {
  private _url: string;
  private _bytes?: Uint8Array;

  constructor(url: string, bytes?: Uint8Array) {
    this._url = url;
    this._bytes = bytes;
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(url);
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    return new ExternalBlob('', bytes);
  }

  get url(): string {
    return this._url;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    const res = await fetch(this._url);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  // biome-ignore lint: stub
  onProgress(_progress: number): void {}
}

export async function createActor(
  _canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  _options?: CreateActorOptions,
): Promise<backendInterface> {
  console.warn('No backend canister deployed. Actor is a stub.');
  return {
    _initializeAccessControlWithSecret: async () => {},
  };
}
