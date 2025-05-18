import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Message } from "@shared/schema";

export function useChat() {
  // 本地消息存储
  const [messages, setMessages] = useState<Message[]>([]);
  // 随机数用于模拟token使用
  const [tokensUsed, setTokensUsed] = useState(0);
  
  // 发送消息的mutation
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
  
  // 发送消息函数
  const sendMessage = async (content: string) => {
    await sendMessageMutation(content);
  };
  
  // 清空聊天函数
  const clearChat = async () => {
    await clearChatMutation();
  };
  
  return {
    messages,
    isLoading: isSending || isClearing,
    isError: false,
    sendMessage,
    clearChat,
    tokensUsed
  };
}
