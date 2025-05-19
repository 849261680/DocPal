import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 获取API基础URL，优先使用环境变量，否则在开发环境指向本地后端
export const getApiBaseUrl = () => {
  // 优先使用环境变量中的API基础URL
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    // 确保URL不以斜杠结尾
    return envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
  }
  
  // 如果没有环境变量，则在本地开发时使用默认值
  return window.location.hostname === 'localhost' ? 
    'http://127.0.0.1:8000' : ''; // 生产环境若无VITE_API_BASE_URL则返回空字符串，下面会拼接/api
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string, // 这个url应该是类似 'vector_store_size' 或 'documents' 这样的相对路径
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  // 确保基础URL存在且不为空，或者URL已经是完整的HTTP(S)链接
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${baseUrl}/api/${url.startsWith('/') ? url.substring(1) : url}`;
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
    const fullUrl = queryKey[0] as string; // queryKey[0] 已经是完整的 URL

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
