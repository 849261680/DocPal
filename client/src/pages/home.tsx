import { useState } from "react";
import DocumentPanel from "@/components/document-panel";
import ChatPanel from "@/components/chat-panel";
import FilePreview from "@/components/file-preview";
import ProcessingModal from "@/components/processing-modal";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentMetadata } from "@/lib/api";
import { Brain } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

export default function Home() {
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentMetadata | null>(null);
  const { processingDocuments } = useDocuments();
  
  // Show processing modal if there are documents being processed
  const hasProcessingDocs = processingDocuments.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8" />
            <h1 className="text-2xl font-bold">DocPal</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        <DocumentPanel onFileSelect={setSelectedFile} selectedFile={selectedFile} />
        <FilePreview selectedFile={selectedFile} />
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
