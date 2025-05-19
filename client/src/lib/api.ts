import { apiRequest } from "./queryClient";
import { Document, Message } from "@shared/schema";
import { getApiBaseUrl } from "./queryClient";

export interface DocumentResponse {
  id: number;
  filename: string;
  filesize: number;
  filetype: string;
  status: string;
  progress: number;
  uploadedAt: string;
  chunkCount: number | null;
  error: string | null;
}

export interface MessageResponse {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: string;
  sources: any | null;
}

export interface VectorStoreSize {
  status: string;
  size: number;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface DocumentMetadata {
  filename: string;
  file_path: string;
  upload_time: string;
  file_size: number;
  chunks_count: number;
}

export interface DocumentListResponse {
  status: string;
  documents: DocumentMetadata[];
  last_updated: string | null;
}

export const api = {
  // Document endpoints
  async getVectorStoreSize(): Promise<VectorStoreSize> {
    const response = await apiRequest("GET", "vector_store_size", undefined);
    return response.json();
  },
  
  async getDocuments(): Promise<DocumentListResponse> {
    const response = await apiRequest("GET", "documents", undefined);
    return response.json();
  },
  
  async deleteDocument(id: number): Promise<void> {
    await apiRequest("DELETE", `documents/${id}`, undefined);
  },
  
  async refreshIndex(): Promise<void> {
    await apiRequest("POST", "reset_vector_store", {});
  },
  
  async clearKnowledgeBase(): Promise<void> {
    await apiRequest("DELETE", "reset_vector_store", undefined);
  },
  
  // Message endpoints
  async getMessages(): Promise<Message[]> {
    const response = await apiRequest("GET", "messages", undefined);
    return response.json();
  },
  
  async sendMessage(content: string): Promise<SendMessageResponse> {
    const response = await apiRequest("POST", "query", { query: content });
    const data = await response.json();
    
    // 创建并返回格式化的用户消息和助手消息
    const userMessage: Message = {
      id: Date.now(),
      content: content,
      isUser: true,
      timestamp: new Date().toISOString(),
      sources: null
    };
    
    const assistantMessage: Message = {
      id: Date.now() + 1,
      content: data.answer || "抱歉，我无法找到相关答案。",
      isUser: false,
      timestamp: new Date().toISOString(),
      sources: data.sources ? data.sources.map(src => ({
        documentName: src.filename || "未知文档",
        text: src.page_content || "",
        page: src.metadata?.page || null
      })) : []
    };
    
    return {
      userMessage,
      assistantMessage
    };
  },
  
  async clearMessages(): Promise<void> {
    await apiRequest("DELETE", "messages", undefined);
  }
};
