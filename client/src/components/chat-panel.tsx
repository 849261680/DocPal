import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat-message";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/hooks/use-chat";

export default function ChatPanel() {
  const { toast } = useToast();
  const { messages, sendMessage, isLoading, isStreaming, tokensUsed, clearChat } = useChat();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      await sendMessage(input);
      setInput("");
    } catch (error) {
      toast({
        title: "消息发送失败",
        description: "发送消息时出现错误，请重试。",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    
    if (confirm("确定要清空聊天记录吗？")) {
      await clearChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(mockEvent);
    }
  };

  return (
    <section className="w-[700px] flex flex-col h-full overflow-hidden bg-white border-l border-gray-200 flex-shrink-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">智能问答</h2>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-gray-500 hover:text-gray-700"
            >
              清空
            </Button>
          )}
        </div>
      </div>

      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto p-4 chat-container" ref={chatContainerRef}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800 mb-2">智能问答助手</h3>
              <p className="text-gray-500 text-sm text-center">
                选择文档后，在下方输入问题开始对话
              </p>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        <div className="space-y-4">
          {messages.map((message, index) => {
            // Check if this is the last message and it's being streamed
            const isLastMessage = index === messages.length - 1;
            const isMessageStreaming = isStreaming && !message.isUser && isLastMessage;
            
            return (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isStreaming={isMessageStreaming}
              />
            );
          })}
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form className="flex items-end gap-2" onSubmit={handleSubmit}>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 px-3 py-2 text-gray-800 placeholder-gray-400 text-sm resize-none"
              placeholder="输入您的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shrink-0"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}