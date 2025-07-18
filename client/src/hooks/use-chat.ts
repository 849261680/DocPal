import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, StreamChunk } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Message } from "@shared/schema";

export function useChat() {
  // 本地消息存储
  const [messages, setMessages] = useState<Message[]>([]);
  // 随机数用于模拟token使用
  const [tokensUsed, setTokensUsed] = useState(0);
  // 流式传输状态
  const [isStreaming, setIsStreaming] = useState(false);
  // 当前流式消息的引用
  const streamingMessageRef = useRef<Message | null>(null);
  
  // 发送消息的mutation（非流式）
  const { 
    mutate: sendMessageMutation,
    isPending: isSending
  } = useMutation({
    mutationFn: (content: string) => api.sendMessage(content),
    onSuccess: (data) => {
      // 将用户消息和助手消息添加到本地消息列表
      setMessages(prev => [...prev, data.userMessage, data.assistantMessage]);
      // 更新tokens使用（随机生成的演示数据）
      setTokensUsed(prev => prev + Math.floor(Math.random() * 100) + 50);
    }
  });
  
  // 清空聊天的mutation
  const {
    mutate: clearChatMutation,
    isPending: isClearing
  } = useMutation({
    mutationFn: () => Promise.resolve(), // 只需要本地清除消息，不需要实际调用API
    onSuccess: () => {
      setMessages([]);
      setTokensUsed(0);
    }
  });
  
  // 流式发送消息函数
  const sendMessageStream = async (content: string) => {
    setIsStreaming(true);
    
    // 创建用户消息
    const userMessage: Message = {
      id: Date.now(),
      content: content,
      isUser: true,
      timestamp: new Date(),
      sources: null
    };
    
    // 创建初始的助手消息
    const assistantMessage: Message = {
      id: Date.now() + 1,
      content: "",
      isUser: false,
      timestamp: new Date(),
      sources: []
    };
    
    // 添加用户消息和空的助手消息
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    streamingMessageRef.current = assistantMessage;
    
    try {
      await api.sendMessageStream(
        content,
        (chunk: StreamChunk) => {
          // 处理流式数据块
          if (chunk.type === 'content' && chunk.content) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && !lastMessage.isUser) {
                lastMessage.content += chunk.content;
              }
              return newMessages;
            });
          } else if (chunk.type === 'sources' && chunk.sources) {
            // 在答案完成后设置sources，不立即显示
            if (streamingMessageRef.current) {
              streamingMessageRef.current.sources = chunk.sources!.map((src: { filename?: string; page_content?: string; metadata?: { page?: number } }) => ({
                documentName: src.filename || "未知文档",
                text: src.page_content || "",
                page: src.metadata?.page || null
              }));
            }
          }
        },
        (userMessage: Message, assistantMessage: Message) => {
          // 流式完成，更新最终消息并显示sources
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.content = assistantMessage.content;
              // 使用存储在ref中的sources
              lastMessage.sources = streamingMessageRef.current?.sources || [];
            }
            return newMessages;
          });
          // 更新tokens使用
          setTokensUsed(prev => prev + Math.floor(Math.random() * 100) + 50);
          setIsStreaming(false);
        },
        (error: string) => {
          // 处理错误
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.content = `错误: ${error}`;
            }
            return newMessages;
          });
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error("流式发送失败:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && !lastMessage.isUser) {
          lastMessage.content = `错误: ${error instanceof Error ? error.message : "发送失败"}`;
        }
        return newMessages;
      });
      setIsStreaming(false);
    }
  };
  
  // 发送消息函数（使用流式传输）
  const sendMessage = async (content: string) => {
    await sendMessageStream(content);
  };
  
  // 清空聊天函数
  const clearChat = async () => {
    await clearChatMutation();
  };
  
  return {
    messages,
    isLoading: isSending || isClearing || isStreaming,
    isStreaming,
    isError: false,
    sendMessage,
    clearChat,
    tokensUsed
  };
}
