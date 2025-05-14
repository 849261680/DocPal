import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { X, FileText, FileIcon } from "lucide-react";
import { ProcessingStatus, Document } from "@shared/schema";

interface DocumentItemProps {
  document: Document;
}

export default function DocumentItem({ document }: DocumentItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/documents/${document.id}`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getFileIcon = () => {
    if (document.filetype === "application/pdf") {
      return <FileText className="text-primary" />;
    }
    return <FileIcon className="text-blue-500" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const isProcessing = document.status !== ProcessingStatus.COMPLETED && 
                       document.status !== ProcessingStatus.FAILED;
  
  const getStatusDisplay = () => {
    switch (document.status) {
      case ProcessingStatus.COMPLETED:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success mr-1"></span>
            Indexed
          </span>
        );
      case ProcessingStatus.FAILED:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive mr-1"></span>
            Failed
          </span>
        );
      default:
        return (
          <div className="relative flex-1 max-w-[120px]">
            <Progress value={document.progress} className="h-1.5" />
            <span className="text-[10px] text-neutral-500 mt-0.5 absolute -right-6 top-1/2 -translate-y-1/2">
              {document.progress}%
            </span>
          </div>
        );
    }
  };
  
  return (
    <div className="px-4 py-3 hover:bg-neutral-50 transition">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
          {getFileIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-neutral-800 truncate" title={document.filename}>
            {document.filename}
          </h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-neutral-500">{formatFileSize(document.filesize)}</span>
            {getStatusDisplay()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
