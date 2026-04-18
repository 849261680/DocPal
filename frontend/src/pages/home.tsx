import { useState } from "react";
import DocumentPanel from "@/components/document-panel";
import ChatPanel from "@/components/chat-panel";
import FilePreview from "@/components/file-preview";
import ProcessingModal from "@/components/processing-modal";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentMetadata } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/auth/user-menu";

export default function Home() {
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentMetadata | null>(null);
  const { processingDocuments } = useDocuments();

  const hasProcessingDocs = processingDocuments.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#202020]/10 px-6 py-2">
        <div className="flex justify-between items-center">
          <Logo size="lg" />
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
