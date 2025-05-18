import { useState } from "react";
import DocumentPanel from "@/components/document-panel";
import ChatPanel from "@/components/chat-panel";
import ProcessingModal from "@/components/processing-modal";
import { useDocuments } from "@/hooks/use-documents";
import { BrainCog } from "lucide-react";

export default function Home() {
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const { processingDocuments } = useDocuments();
  
  // Show processing modal if there are documents being processed
  const hasProcessingDocs = processingDocuments.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BrainCog className="text-primary h-6 w-6" />
            <h1 className="text-xl font-semibold text-neutral-800">RAG 企业知识库问答系统</h1>
          </div>
          <div className="mr-14">
            <a 
              href="https://psx1.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base font-medium text-neutral-600 hover:text-primary transition-colors"
            >
              关于我
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        <DocumentPanel />
        <ChatPanel />
      </main>

      {/* Processing Modal */}
      {processingModalOpen && (
        <ProcessingModal 
          isOpen={processingModalOpen} 
          onClose={() => setProcessingModalOpen(false)} 
        />
      )}
    </div>
  );
}
