export interface Track {
  id: string;
  name: string;
  status: "draft" | "published";
}

const SELECTION_KEY = "curriculum:selectedTrack";
let identity: { id: number; role: string; track?: string | null } | null = null;

export function setTrackIdentity(user: typeof identity) {
  identity = user;
}

export function getSelectedTrackId(): string {
  try {
    return sessionStorage.getItem(SELECTION_KEY) || "A";
  } catch {
    return "A";
  }
}

export function setSelectedTrackId(id: string) {
  sessionStorage.setItem(SELECTION_KEY, id);
}

export function getActiveTrackId(): string {
  if (["admin", "mentor"].includes(identity?.role || "") && location.pathname.startsWith("/preview/")) {
    return new URLSearchParams(location.search).get("trackId") || "A";
  }
  if (identity?.role === "admin") return getSelectedTrackId();
  return identity?.track || "A";
}

/** Shared by the query client, apiRequest and explicit curriculum requests.
 * Participants never select their own curriculum with a request header.
 */
export function trackFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input), location.origin);
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) {
    if (identity?.role === "admin" || (identity?.role === "mentor" && location.pathname.startsWith("/preview/"))) {
      const previewId = location.pathname.startsWith("/preview/")
        ? new URLSearchParams(location.search).get("trackId")
        : null;
      headers.set("X-Track-ID", previewId || getActiveTrackId());
    } else {
      headers.delete("X-Track-ID");
    }
  }
  return globalThis.fetch(input, { credentials: "include", ...init, headers });
}

/** Keep old Track A activity values available during the scoped-key migration.
 * Only the first signed-in account on this browser can claim legacy values.
 */
export function activityKey(key: string): string {
  return `curriculum:${encodeURIComponent(getActiveTrackId())}:user:${identity?.id ?? "guest"}:${key}`;
}

function scopedStorage(storage: Storage) {
  return {
    getItem(key: string) {
      const scoped = activityKey(key);
      const value = storage.getItem(scoped);
      if (value !== null || getActiveTrackId() !== "A" || !identity) return value;
      const ownerKey = `curriculum:legacy-owner:${key}`;
      const owner = storage.getItem(ownerKey);
      if (owner && owner !== String(identity.id)) return null;
      const legacy = storage.getItem(key);
      if (legacy !== null) {
        storage.setItem(ownerKey, String(identity.id));
        storage.setItem(scoped, legacy);
      }
      return legacy;
    },
    setItem(key: string, value: string) {
      storage.setItem(activityKey(key), value);
    },
    removeItem(key: string) {
      storage.removeItem(activityKey(key));
      // Retain the original key for compatibility, but do not re-import it.
      if (getActiveTrackId() === "A" && identity) {
        storage.setItem(activityKey(key), "");
      }
    },
  };
}

export const activityLocalStorage = scopedStorage(localStorage);
export const activitySessionStorage = scopedStorage(sessionStorage);
