import { AsyncLocalStorage } from "node:async_hooks";

const context = new AsyncLocalStorage<string>();

/** Startup retains the original A context. HTTP requests set an authorized scope. */
export function currentTrackId(): string {
  return context.getStore() ?? "A";
}

export function withTrack<T>(trackId: string, work: () => T): T {
  return context.run(trackId, work);
}
