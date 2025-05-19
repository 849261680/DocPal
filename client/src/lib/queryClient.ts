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
    const requestUrl = queryKey[0] as string; // 这个requestUrl应该是类似 '/api/vector_store_size' 这样的相对路径
    const baseUrl = getApiBaseUrl();

    // 检查requestUrl是否已经是完整的URL或者是否以/api/开头
    // 同时处理baseUrl为空的情况（比如Vercel环境变量未设置或在非localhost环境且未设置VITE_API_BASE_URL）
    let fullUrl;
    if (requestUrl.startsWith('http')) {
        fullUrl = requestUrl;
    } else if (baseUrl) {
        // 如果baseUrl存在，则拼接。移除requestUrl可能存在的前导/，确保baseUrl和路径之间只有一个/
        fullUrl = `${baseUrl}${requestUrl.startsWith('/') ? requestUrl : '/' + requestUrl}`;
    } else {
        // 如果baseUrl为空（例如，在Vercel上，VITE_API_BASE_URL未设置），
        // 并且requestUrl不是完整的URL，则假定它是相对于当前域的路径。
        // 但我们的目标是调用后端，所以这里应该已经是完整URL或至少包含/api/
        // 鉴于之前的日志，queryKey[0]已经是 'https://.../api/api/...' 或 '/api/api/...'
        // 我们需要的是 VITE_API_BASE_URL + /api/endpoint
        // 如果VITE_API_BASE_URL是 'https://abc.com'， queryKey是 'vector_store_size'
        // 那么fullUrl应该是 'https://abc.com/api/vector_store_size'
        // 这部分逻辑已移到apiRequest，queryKey应该已经是正确的完整路径或只包含endpoint
        // 这里假设queryKey[0]已经是完整的路径或者仅是endpoint
        // 我们在这里的目标是确保baseUrl和endpoint正确组合
        fullUrl = `${baseUrl}/api/${requestUrl.replace(/^\/api\//, '').replace(/^\//, '')}`;
    }

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
