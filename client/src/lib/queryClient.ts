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

// 使用CORS代理服务，解决CORS问题
const useCorsProxy = (url: string) => {
  // 文件上传不使用代理
  if (url.includes('upload_doc')) {
    return url; 
  }
  // 生产环境 (onrender.com) 或其他非本地开发环境，通常应该由后端正确处理CORS，不再需要代理
  if (url.includes('onrender.com') || (import.meta.env.PROD && !window.location.hostname.includes('localhost'))) {
    return url; // 直接返回原始URL，不使用代理
  }
  // 本地开发时，如果后端未配置CORS，则可以考虑使用代理 (但我们已在本地后端配置了CORS)
  // 为了以防万一或针对其他外部API，保留 allorigins 作为最后的备选，但优先直接访问
  // if (window.location.hostname.includes('localhost') && url.includes('localhost')) {
  //   return url; // 本地到本地不使用代理
  // }
  // return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return url; // 默认情况下，我们相信后端能处理CORS
};

// 检查URL是否使用了代理
const isProxiedUrl = (url: string) => {
  return url.includes('allorigins.win') || url.includes('cors-anywhere.herokuapp.com') || url.includes('cors.eu.org');
};

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
  
  // 使用CORS代理
  const proxiedUrl = useCorsProxy(fullUrl);
  console.log(`发送请求到: ${fullUrl}`, proxiedUrl !== fullUrl ? `(通过代理: ${proxiedUrl})` : '');
  
  const res = await fetch(proxiedUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit", // 始终不发送凭据
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
      method: "POST", // 使用POST方法而不是默认的GET
      credentials: "omit", // 始终不发送凭据
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
