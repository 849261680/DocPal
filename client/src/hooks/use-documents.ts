import { useQuery } from "@tanstack/react-query";
import { Document, ProcessingStatus } from "@shared/schema";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/queryClient";

export function useDocuments() {
  // 获取向量库大小
  const { 
    data: vectorData = { size: 0, status: "success" },
    isLoading: isLoadingVectorSize,
    isError: isErrorVectorSize,
    refetch: refetchVectorSize
  } = useQuery({
    queryKey: [`${getApiBaseUrl()}/api/vector_store_size`],
    refetchInterval: 3000, // Poll every 3 seconds to update processing status
  });
  
  // 获取文档列表
  const {
    data: documentData = { documents: [], status: "success", last_updated: null },
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: [`${getApiBaseUrl()}/api/documents`],
    refetchInterval: 3000, // Poll every 3 seconds
  });
  
  // 将文档数据转换为Document类型数组
  const documents: Document[] = documentData.documents.map((doc) => ({
    id: 0, // 这里应该有一个真实的ID
    filename: doc.filename,
    filesize: doc.file_size,
    filetype: doc.filename.split('.').pop() || '',
    status: ProcessingStatus.COMPLETED,
    progress: 100,
    uploadedAt: doc.upload_time,
    chunkCount: doc.chunks_count,
    error: null
  }));
  
  // 正在处理的文档（这里实际上没有，所以返回空数组）
  const processingDocuments: Document[] = [];
  
  // 对文档按上传时间排序，最新的在前面
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  
  console.log("Vector store data:", vectorData);
  console.log("Documents data:", documentData);
  
  // 合并refetch函数
  const refetch = async () => {
    await Promise.all([refetchVectorSize(), refetchDocuments()]);
  };
  
  return {
    documents: sortedDocuments,
    processingDocuments,
    isLoading: isLoadingVectorSize || isLoadingDocuments,
    isError: isErrorVectorSize || isErrorDocuments,
    refetch,
    totalDocuments: vectorData.size || 0,
    lastUpdated: documentData.last_updated
  };
}
