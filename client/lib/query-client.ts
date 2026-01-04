import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server.
 * 
 * For deployed backends (Heroku, Render, etc.), set EXPO_PUBLIC_DOMAIN to your backend URL
 * (e.g., "myapp.herokuapp.com" or "myapp.onrender.com"). The protocol (http/https) is
 * automatically determined.
 * 
 * For local development, if EXPO_PUBLIC_DOMAIN is not set, it defaults to:
 * - iOS devices: http://192.168.4.22:5000 (update IP as needed)
 * - Simulator/web: http://localhost:5000
 * 
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Use deployed backend on Render
  const host = process.env.EXPO_PUBLIC_DOMAIN || "seventeenweeks-app.onrender.com";

  // Use http for localhost/local IP, https for everything else (deployed backends)
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") ? "http" : "https";
  let url = new URL(`${protocol}://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || data.message || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Body already consumed or other error
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

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
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
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
