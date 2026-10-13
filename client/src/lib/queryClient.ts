import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { trackFetch as fetch } from "@/lib/track-context";

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const payload = JSON.parse(text);
      const details = payload.errors || payload.details;
      const message = payload.message || payload.error;
      if (message || details) {
        throw new ApiRequestError(`${message || "Request failed"}${details ? `: ${Array.isArray(details) ? details.join("; ") : JSON.stringify(details)}` : ""}`, res.status);
      }
    } catch (error) {
      if (error instanceof Error && !(error instanceof SyntaxError)) throw error;
    }
    throw new ApiRequestError(`${res.status}: ${text}`, res.status);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
   async ({ queryKey, signal }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
       signal,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
