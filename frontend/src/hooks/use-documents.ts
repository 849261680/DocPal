import { useQuery } from "@tanstack/react-query";
import { Document, ProcessingStatus } from "@shared/schema";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/queryClient";

// 使用CORS代理服务，解决CORS问题
const useCorsProxy = (url: string) => {
  // 文件上传不使用代理 (虽然此hook中不太可能包含upload_doc, 但保持一致性)
  if (url.includes('upload_doc')) {
    return url; 
  }
  // 生产环境 (onrender.com) 或其他非本地开发环境，通常应该由后端正确处理CORS，不再需要代理
  if (url.includes('onrender.com') || (import.meta.env.PROD && !window.location.hostname.includes('localhost'))) {
    return url; // 直接返回原始URL，不使用代理
  }
  return url; // 默认情况下，我们相信后端能处理CORS
};

export function useDocuments() {
  // 使用getApiBaseUrl获取API基础URL
  const baseApiUrl = getApiBaseUrl();
  const vectorSizeUrl = `${baseApiUrl}/api/vector_store_size`;
  const documentsUrl = `${baseApiUrl}/api/documents`;
  
  console.log(`API基础URL: ${baseApiUrl}`);
  console.log(`向量存储大小URL: ${vectorSizeUrl}`);
  console.log(`文档列表URL: ${documentsUrl}`);
  
  // 不使用代理URL
  const proxiedVectorSizeUrl = vectorSizeUrl;
  const proxiedDocumentsUrl = documentsUrl;
  
  // 获取向量库大小
  const { 
    data: vectorData = { size: 0, status: "success" },
    isLoading: isLoadingVectorSize,
    isError: isErrorVectorSize,
    refetch: refetchVectorSize
  } = useQuery({
    queryKey: [proxiedVectorSizeUrl]
  });
  
  // 获取文档列表
  const {
    data: documentData = { documents: [], status: "success", last_updated: null },
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: [proxiedDocumentsUrl]
  });
  
  // 生成一个简单的哈希函数来将字符串转为整数
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // 将文档数据转换为Document类型数组
  const documents: Document[] = ((documentData as { documents: Array<{ filename: string; file_size: number; upload_time: string; chunks_count: number }> }).documents || []).map((doc) => ({
    id: simpleHash(doc.filename), // 将文件名转换为哈希数字作为唯一ID
    filename: doc.filename,
    filesize: doc.file_size,
    filetype: doc.filename.split('.').pop() || '',
    status: ProcessingStatus.COMPLETED, // 实际状态应由后端提供或在前端管理
    progress: 100, // 实际进度应由后端提供或在前端管理
    uploadedAt: new Date(doc.upload_time), // 将字符串转换为Date对象
    chunkCount: doc.chunks_count,
    error: null // 实际错误信息应由后端提供
  }));
  
  // 正在处理的文档（这里实际上没有，所以返回空数组）
  const processingDocuments: Document[] = [];
  
  // 对文档按上传时间排序，最新的在前面
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  
  console.log("Vector store data:", vectorData);
  console.log("Documents data:", documentData);
  
  // 合并refetch函数，并更新查询键
  const refetch = async () => {
    await Promise.all([
      refetchVectorSize(), 
      refetchDocuments()
    ]);
  };
  
  return {
    documents: sortedDocuments,
    processingDocuments,
    isLoading: isLoadingVectorSize || isLoadingDocuments,
    isError: isErrorVectorSize || isErrorDocuments,
    refetch,
    totalDocuments: (vectorData as { size: number }).size || 0,
    lastUpdated: (documentData as { last_updated: string | null }).last_updated
  };
}
