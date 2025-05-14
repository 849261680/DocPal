import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Message } from "@shared/schema";

export function useChat() {
  // Random number for token usage (just for UI, in a real app this would come from the API)
  const [tokensUsed, setTokensUsed] = useState(0);
  
  // Fetch messages
  const { 
    data: messages = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/messages"],
    refetchOnWindowFocus: false,
  });
  
  // Send message mutation
  const { 
    mutate: sendMessageMutation,
    isPending: isSending
  } = useMutation({
    mutationFn: (content: string) => api.sendMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Update tokens used (random number for demo)
      setTokensUsed(prev => prev + Math.floor(Math.random() * 100) + 50);
    }
  });
  
  // Clear chat mutation
  const {
    mutate: clearChatMutation,
    isPending: isClearing
  } = useMutation({
    mutationFn: () => api.clearMessages(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setTokensUsed(0);
    }
  });
  
  // Send message function
  const sendMessage = async (content: string) => {
    await sendMessageMutation(content);
  };
  
  // Clear chat function
  const clearChat = async () => {
    await clearChatMutation();
  };
  
  return {
    messages: messages as Message[],
    isLoading: isLoading || isSending || isClearing,
    isError,
    sendMessage,
    clearChat,
    tokensUsed
  };
}
