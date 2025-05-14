import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat-message";
import { Layers, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/hooks/use-chat";

export default function ChatPanel() {
  const { toast } = useToast();
  const { messages, sendMessage, isLoading, tokensUsed, clearChat } = useChat();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
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
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    
    if (confirm("Are you sure you want to clear the chat history?")) {
      await clearChat();
    }
  };

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto p-4 chat-container" ref={chatContainerRef}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800 mb-2">Welcome to Enterprise Q&A Assistant</h2>
                  <p className="text-neutral-600 text-sm mb-3">I can help you find answers from your uploaded documents. To get started:</p>
                  <ol className="text-sm text-neutral-600 space-y-1 list-decimal pl-5 mb-4">
                    <li>Upload PDF or DOCX documents in the sidebar</li>
                    <li>Wait for documents to be processed and indexed</li>
                    <li>Ask questions about your documents in the chat below</li>
                  </ol>
                  <p className="text-sm text-neutral-500">I'll search for the most relevant information and provide answers with references to the source documents.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {/* Typing indicator */}
          {isLoading && (
            <div className="max-w-2xl mx-auto my-4">
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <form className="relative" onSubmit={handleSubmit}>
            <textarea 
              ref={textareaRef}
              rows={1}
              className="w-full rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 py-3 pr-14 text-neutral-800 placeholder-neutral-400 text-sm resize-none"
              placeholder="Ask something about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            ></textarea>
            <Button 
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2.5"
              disabled={isLoading || !input.trim()}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
            <div>
              <span>{tokensUsed}</span> tokens used
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
