import { apiRequest } from "./queryClient";
import { Document, Message } from "@shared/schema";

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

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export const api = {
  // Document endpoints
  async getDocuments(): Promise<Document[]> {
    const response = await apiRequest("GET", "/api/documents", undefined);
    return response.json();
  },
  
  async deleteDocument(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/documents/${id}`, undefined);
  },
  
  async refreshIndex(): Promise<void> {
    await apiRequest("POST", "/api/documents/refresh", {});
  },
  
  async clearKnowledgeBase(): Promise<void> {
    await apiRequest("DELETE", "/api/documents", undefined);
  },
  
  // Message endpoints
  async getMessages(): Promise<Message[]> {
    const response = await apiRequest("GET", "/api/messages", undefined);
    return response.json();
  },
  
  async sendMessage(content: string): Promise<SendMessageResponse> {
    const response = await apiRequest("POST", "/api/messages", { content });
    return response.json();
  },
  
  async clearMessages(): Promise<void> {
    await apiRequest("DELETE", "/api/messages", undefined);
  }
};
