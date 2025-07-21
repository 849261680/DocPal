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

export interface StreamChunk {
  type: 'sources' | 'content' | 'error' | 'done';
  content?: string;
  sources?: any[];
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
    const response = await apiRequest("GET", "vector_store_size", undefined, 3);
    return response.json();
  },
  
  async getDocuments(): Promise<DocumentListResponse> {
    const response = await apiRequest("GET", "documents", undefined, 3);
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
    // 使用getApiBaseUrl函数获取API基础URL
    const baseApiUrl = getApiBaseUrl();
    const queryUrl = `${baseApiUrl}/api/query`;
    
    console.log(`发送查询请求到: ${queryUrl}`);
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: content })
    });
    
    if (!response.ok) {
      throw new Error(`查询请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("查询响应:", data);
    
    // 创建并返回格式化的用户消息和助手消息
    const userMessage: Message = {
      id: Date.now(),
      content: content,
      isUser: true,
      timestamp: new Date(), // 直接使用Date对象
      sources: null
    };
    
    const assistantMessage: Message = {
      id: Date.now() + 1,
      content: data.answer || "抱歉，我无法找到相关答案。",
      isUser: false,
      timestamp: new Date(), // 直接使用Date对象
      sources: data.sources ? data.sources.map((src: { filename?: string; page_content?: string; metadata?: { page?: number } }) => ({
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

  async sendMessageStream(
    content: string,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (userMessage: Message, assistantMessage: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const baseApiUrl = getApiBaseUrl();
    const queryUrl = `${baseApiUrl}/api/query/stream`;
    
    
    const userMessage: Message = {
      id: Date.now(),
      content: content,
      isUser: true,
      timestamp: new Date(),
      sources: null
    };
    
    let assistantContent = "";
    let sources: any[] = [];
    
    try {
      const response = await fetch(queryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content })
      });
      
      if (!response.ok) {
        throw new Error(`流式查询请求失败: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              const assistantMessage: Message = {
                id: Date.now() + 1,
                content: assistantContent || "抱歉，我无法找到相关答案。",
                isUser: false,
                timestamp: new Date(),
                sources: sources.map((src: { filename?: string; page_content?: string; metadata?: { page?: number } }) => ({
                  documentName: src.filename || "未知文档",
                  text: src.page_content || "",
                  page: src.metadata?.page || null
                }))
              };
              onComplete(userMessage, assistantMessage);
              return;
            }
            
            try {
              const parsed: StreamChunk = JSON.parse(data);
              onChunk(parsed);
              
              if (parsed.type === 'content' && parsed.content) {
                assistantContent += parsed.content;
              } else if (parsed.type === 'sources' && parsed.sources) {
                sources = parsed.sources;
              } else if (parsed.type === 'error') {
                onError(parsed.content || "未知错误");
                return;
              }
            } catch (e) {
              console.warn("解析SSE数据失败:", e, "数据:", data);
            }
          }
        }
      }
    } catch (error) {
      console.error("流式请求失败:", error);
      onError(error instanceof Error ? error.message : "流式请求失败");
    }
  },
  
  async clearMessages(): Promise<void> {
    await apiRequest("DELETE", "messages", undefined);
  }
};
