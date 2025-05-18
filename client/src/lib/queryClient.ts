import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 获取API基础URL，开发环境指向后端直接地址
export const getApiBaseUrl = () => {
  return window.location.hostname === 'localhost' ? 
    'http://127.0.0.1:8000' : '';
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // 如果URL不是以http开头，则添加API基础URL
  const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
  console.log(`发送请求到: ${fullUrl}`);
  
  const res = await fetch(fullUrl, {
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
    const requestUrl = queryKey[0] as string;
    // 如果URL不是以http开头，则添加API基础URL
    const fullUrl = requestUrl.startsWith('http') ? requestUrl : `${getApiBaseUrl()}${requestUrl}`;
    console.log(`查询请求: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
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
