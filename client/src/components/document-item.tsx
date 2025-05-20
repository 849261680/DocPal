import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { X, FileText, FileIcon, File } from "lucide-react";
import { ProcessingStatus, Document } from "@shared/schema";
import { getApiBaseUrl } from "@/lib/queryClient";

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
      await apiRequest("DELETE", `documents/${document.filename}`, {});
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/vector_store_size`] });
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/documents`] });
      toast({
        title: "文档已删除",
        description: `文档 ${document.filename} 已从知识库中删除。`,
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "无法删除文档，请重试。",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getFileIcon = () => {
    const extension = document.filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <FileText className="text-red-500" />;
    } else if (extension === 'docx' || extension === 'doc') {
      return <FileText className="text-blue-500" />;
    } else if (extension === 'txt') {
      return <File className="text-neutral-500" />;
    }
    
    return <FileIcon className="text-primary" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // 只显示日期和时间的简短版本，不显示秒
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };
  
  const isProcessing = document.status !== ProcessingStatus.COMPLETED && 
                       document.status !== ProcessingStatus.FAILED;
  
  const getStatusDisplay = () => {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success mr-1"></span>
        已索引
      </span>
    );
  };
  
  return (
    <div className="px-4 py-3 hover:bg-neutral-50 transition border-b border-neutral-100 last:border-0">
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
            {document.chunkCount && (
              <span className="text-xs text-neutral-500">{document.chunkCount} 个分块</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-neutral-400">{formatDate(document.uploadedAt.toString())}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDelete}
          disabled={isDeleting}
          title="删除文档"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
