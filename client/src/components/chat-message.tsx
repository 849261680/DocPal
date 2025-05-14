import { Quote } from "lucide-react";
import { Message, SourceReference } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUserMessage = message.isUser;
  
  // Format message content with bullet points and paragraphs
  const formatMessageContent = (content: string) => {
    // Split content by lines
    const lines = content.split('\n');
    let formattedContent: JSX.Element[] = [];
    let bulletPoints: string[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        // If we have collected bullet points, add them as a list
        if (bulletPoints.length > 0) {
          formattedContent.push(
            <ul key={`bp-${index}`} className={`list-disc pl-5 mb-3 ${isUserMessage ? 'text-white' : 'text-neutral-700'} space-y-1`}>
              {bulletPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          );
          bulletPoints = [];
        }
        return;
      }
      
      // Check if line is a bullet point
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        bulletPoints.push(trimmedLine.substring(1).trim());
      } else {
        // If we have collected bullet points, add them as a list
        if (bulletPoints.length > 0) {
          formattedContent.push(
            <ul key={`bp-${index}`} className={`list-disc pl-5 mb-3 ${isUserMessage ? 'text-white' : 'text-neutral-700'} space-y-1`}>
              {bulletPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          );
          bulletPoints = [];
        }
        
        // Add regular paragraph
        formattedContent.push(
          <p key={index} className={`${isUserMessage ? 'text-white' : 'text-neutral-800'} ${index < lines.length - 1 ? 'mb-3' : ''}`}>
            {trimmedLine}
          </p>
        );
      }
    });
    
    // Add any remaining bullet points
    if (bulletPoints.length > 0) {
      formattedContent.push(
        <ul key="final-bp" className={`list-disc pl-5 mb-3 ${isUserMessage ? 'text-white' : 'text-neutral-700'} space-y-1`}>
          {bulletPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      );
    }
    
    return formattedContent;
  };
  
  // Render source references
  const renderSourceReferences = (sources: SourceReference[]) => {
    return sources.map((source, index) => (
      <div key={index} className="source-reference relative bg-neutral-50 p-3 rounded-md border border-neutral-200 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-neutral-700 flex items-center gap-1.5">
            <Quote className="h-3 w-3 text-accent" />
            Source Reference
          </span>
          <span className="text-xs text-neutral-500">
            {source.documentName} {source.page ? `• Page ${source.page}` : ''}
          </span>
        </div>
        <p className="text-neutral-600 text-sm">
          "{source.text}"
        </p>
      </div>
    ));
  };
  
  return (
    <div className={`flex justify-${isUserMessage ? 'end' : 'start'} slide-in animate-in fade-in-50 duration-300`}>
      <div className={`chat-message max-w-[85%] ${
        isUserMessage 
          ? 'bg-primary text-white' 
          : 'bg-white border border-neutral-200 shadow-sm'
        } px-4 py-3 rounded-2xl rounded-${isUserMessage ? 'tr' : 'tl'}-sm`}
      >
        {formatMessageContent(message.content)}
        
        {!isUserMessage && message.sources && message.sources.length > 0 && (
          <div className="mt-4">
            {renderSourceReferences(message.sources as SourceReference[])}
          </div>
        )}
      </div>
    </div>
  );
}
