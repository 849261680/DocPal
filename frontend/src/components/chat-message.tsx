import { Quote, ChevronDown, ChevronUp } from "lucide-react";
import { Message, SourceReference } from "@shared/schema";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUserMessage = message.isUser;
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  const renderMarkdownContent = (content: string) => {
    return (
      <div className={`markdown-content ${isUserMessage ? 'text-white' : 'text-[#202020]'}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
          h1: ({ children, ...props }) => (
            <h1 className={`text-2xl font-bold mb-4 ${isUserMessage ? 'text-white' : 'text-[#202020]'}`} {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={`text-xl font-semibold mb-3 ${isUserMessage ? 'text-white' : 'text-[#202020]'}`} {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={`text-lg font-medium mb-2 ${isUserMessage ? 'text-white' : 'text-[#202020]'}`} {...props}>{children}</h3>
          ),
          p: ({ children, ...props }) => (
            <p className={`mb-3 leading-relaxed ${isUserMessage ? 'text-white' : 'text-[#202020]'}`} {...props}>{children}</p>
          ),
          ul: ({ children, ...props }) => (
            <ul className={`list-disc pl-5 mb-3 space-y-1 ${isUserMessage ? 'text-white' : 'text-[#4e4e4e]'}`} {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className={`list-decimal pl-5 mb-3 space-y-1 ${isUserMessage ? 'text-white' : 'text-[#4e4e4e]'}`} {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className={`${isUserMessage ? 'text-white' : 'text-[#4e4e4e]'}`} {...props}>{children}</li>
          ),
          strong: ({ children, ...props }) => (
            <strong className={`font-semibold ${isUserMessage ? 'text-white' : 'text-[#202020]'}`} {...props}>{children}</strong>
          ),
          em: ({ children, ...props }) => (
            <em className={`italic ${isUserMessage ? 'text-white' : 'text-[#4e4e4e]'}`} {...props}>{children}</em>
          ),
          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${isUserMessage ? 'bg-white/20 text-white' : 'bg-[#202020]/5 text-[#202020]'}`} {...props}>{children}</code>
              );
            }
            return (
              <code className={`block p-3 rounded-[16px] text-sm font-mono overflow-x-auto ${isUserMessage ? 'bg-white/10 text-white' : 'bg-[#24292e] text-white'}`} {...props}>{children}</code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className={`mb-3 rounded-[16px] overflow-x-auto ${isUserMessage ? 'bg-white/10' : 'bg-[#24292e]'}`} {...props}>{children}</pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className={`border-l-4 pl-4 my-3 italic ${isUserMessage ? 'border-white/30 text-white/90' : 'border-[#ea2804] text-[#646464]'}`} {...props}>{children}</blockquote>
          ),
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`underline decoration-dotted ${isUserMessage ? 'text-white' : 'text-[#ea2804] hover:text-[#202020]'}`} {...props}>{children}</a>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-3">
              <table className={`min-w-full border-collapse border ${isUserMessage ? 'border-white/30' : 'border-[#bbbbbb]'}`} {...props}>{children}</table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className={`border px-3 py-2 text-left font-semibold ${isUserMessage ? 'border-white/30 bg-white/10 text-white' : 'border-[#bbbbbb] bg-[#202020]/5 text-[#202020]'}`} {...props}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td className={`border px-3 py-2 ${isUserMessage ? 'border-white/30 text-white' : 'border-[#bbbbbb] text-[#202020]'}`} {...props}>{children}</td>
          ),
        }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const renderSourceReferences = (sources: SourceReference[]) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-4 border-t border-[#202020]/10 pt-3">
        <button
          onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
          className="flex items-center gap-2 text-sm text-[#646464] hover:text-[#202020] transition-colors w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isSourcesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium">整理来源</span>
          </div>
          <span className="text-xs text-[#8d8d8d]">
            {sources.length} 个来源
          </span>
        </button>

        {isSourcesExpanded && (
          <div className="mt-3 space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="source-reference relative bg-[#202020]/3 p-3 rounded-[16px] border border-[#202020]/10 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#202020] flex items-center gap-1.5">
                    <Quote className="h-3 w-3 text-[#ea2804]" />
                    来源引用 {index + 1}
                  </span>
                  <span className="text-xs text-[#8d8d8d]">
                    {source.documentName} {source.page ? `• 页码 ${source.page}` : ''}
                  </span>
                </div>
                <p className="text-[#646464] text-sm">"{source.text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} slide-in animate-in fade-in-50 duration-300`}>
      <div className={`chat-message max-w-[85%] ${
        isUserMessage
          ? 'bg-[#202020] text-white'
          : 'bg-white border border-[#202020]/10'
        } px-4 py-3 rounded-[32px] ${
          isUserMessage ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]'
        }`}
      >
        {!isUserMessage && isStreaming && (
          <div className="flex items-center gap-2 text-[#646464] text-sm mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[#ea2804] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#ea2804] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-[#ea2804] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <span>生成回答中</span>
          </div>
        )}

        {renderMarkdownContent(message.content)}

        {!isUserMessage && !isStreaming && message.sources && Array.isArray(message.sources) && message.sources.length > 0 && (
          renderSourceReferences(message.sources as SourceReference[])
        )}
      </div>
    </div>
  );
}
