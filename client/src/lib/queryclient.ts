import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface RequestOptions {
  method: string;
  body?: string;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: options?.body,
    credentials: 'include'
  };
  
  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  
  // Handle empty responses (like for DELETE operations)
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  
  return {} as T; // Return empty object for non-JSON responses
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
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
