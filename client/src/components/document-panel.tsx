import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/file-uploader";
import DocumentList from "@/components/document-list";
import { useDocuments } from "@/hooks/use-documents";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function DocumentPanel() {
  const { toast } = useToast();
  const { documents, isLoading, refetch } = useDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const refreshIndex = async () => {
    try {
      setIsRefreshing(true);
      await apiRequest("POST", "/api/documents/refresh", {});
      await refetch();
      toast({
        title: "Index refreshed",
        description: "The knowledge base has been refreshed successfully."
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh the knowledge base. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearKnowledgeBase = async () => {
    if (!confirm("Are you sure you want to clear the knowledge base? This will delete all documents and cannot be undone.")) {
      return;
    }

    try {
      setIsClearing(true);
      await apiRequest("DELETE", "/api/documents", {});
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Knowledge base cleared",
        description: "All documents have been removed from the knowledge base."
      });
    } catch (error) {
      toast({
        title: "Clear failed",
        description: "Failed to clear the knowledge base. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const countChunks = () => {
    return documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
  };

  const getLastUpdated = () => {
    if (documents.length === 0) return "Never";
    
    const mostRecent = new Date(Math.max(...documents.map(d => new Date(d.uploadedAt).getTime())));
    const now = new Date();
    const diffMs = now.getTime() - mostRecent.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <aside className="bg-white border-r border-neutral-200 w-full md:w-96 flex flex-col h-full overflow-hidden transition-all duration-300">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="font-semibold text-neutral-800">Knowledge Base</h2>
      </div>
      
      {/* Upload section */}
      <div className="px-4 py-5 border-b border-neutral-200">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-1">Upload Documents</h3>
          <p className="text-xs text-neutral-500">Upload PDF or DOCX files to build your knowledge base</p>
        </div>
        
        <FileUploader />
      </div>
      
      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 flex justify-between items-center border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-medium text-neutral-700">Uploaded Documents</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Refresh Index"
              onClick={refreshIndex}
              disabled={isRefreshing || documents.length === 0}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Clear Knowledge Base"
              onClick={clearKnowledgeBase}
              disabled={isClearing || documents.length === 0}
            >
              {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <DocumentList documents={documents} isLoading={isLoading} />
      </div>
      
      {/* Knowledge base stats */}
      <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-3">
            <div>
              <span className="font-medium">{documents.length}</span> Documents
            </div>
            <div>
              <span className="font-medium">{countChunks()}</span> Chunks
            </div>
          </div>
          <span className="text-xs text-neutral-500">Last updated: {getLastUpdated()}</span>
        </div>
      </div>
    </aside>
  );
}
