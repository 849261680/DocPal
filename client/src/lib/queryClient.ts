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

// 睡眠辅助函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function apiRequest(
  method: string,
  url: string, // 这个url应该是类似 'vector_store_size' 或 'documents' 这样的相对路径
  data?: unknown | undefined,
  maxRetries: number = 3, // 最大重试次数，默认为3次
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  // 确保基础URL存在且不为空，或者URL已经是完整的HTTP(S)链接
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${baseUrl}/api/${url.startsWith('/') ? url.substring(1) : url}`;
  
  // 使用CORS代理
  const proxiedUrl = useCorsProxy(fullUrl);
  console.log(`发送请求到: ${fullUrl}`, proxiedUrl !== fullUrl ? `(通过代理: ${proxiedUrl})` : '');
  
  let lastError: Error | null = null;
  
  // 重试循环
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(proxiedUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "omit", // 始终不发送凭据
      });
      
      // 专门处理503错误（服务不可用，可能是Render休眠导致）
      if (res.status === 503) {
        if (attempt < maxRetries) {
          // 如果遇到503且还有重试机会，则等待1秒后重试
          console.warn(`服务不可用(503)，正在第${attempt + 1}次重试(共${maxRetries}次)...`);
          await sleep(1000); // 等待1秒
          continue; // 继续下一次重试
        }
      }
      
      // 对于非503错误或已达到最大重试次数的503错误，抛出错误
      await throwIfResNotOk(res);
      return res;
    } catch (err) {
      lastError = err as Error;
      
      // 如果已经是最后一次尝试，则抛出错误
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      // 否则等待1秒后重试
      console.warn(`请求失败，正在第${attempt + 1}次重试(共${maxRetries}次)...错误：${lastError.message}`);
      await sleep(1000);
    }
  }
  
  // 这里不应该到达，但为了TS类型检查，添加这个抛出
  throw new Error("重试失败");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  method?: string; // 添加method参数以支持自定义HTTP方法
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, method = "GET" }) => // 默认使用GET而不POST
  async ({ queryKey }) => {
    const fullUrl = queryKey[0] as string; // queryKey[0] 已经是完整的 URL

    console.log(`查询请求: ${fullUrl} (方法: ${method})`);
    
    try {
      // 使用apiRequest函数代替fetch，这样可以利用我们的重试机制
      const res = await apiRequest(method, fullUrl, undefined);
      
      // 401处理
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      return await res.json();
    } catch (error) {
      console.error(`查询请求失败: ${error}`);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", method: "GET" }), // 明确使用GET方法
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 3, // 启用最多3次重试
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
    },
    mutations: {
      retry: 2, // 也为编写启用重试
    },
  },
});
