import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/file-uploader";
import DocumentList from "@/components/document-list";
import { useDocuments } from "@/hooks/use-documents";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getApiBaseUrl } from "@/lib/queryClient";

export default function DocumentPanel() {
  const { toast } = useToast();
  const { documents, isLoading, refetch, totalDocuments, lastUpdated } = useDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadFiles = async (files: FileList) => {
    setIsUploading(true);
    
    try {
      const baseApiUrl = getApiBaseUrl();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查文件类型
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "文件类型无效",
            description: `${file.name} 不是支持的文件类型，仅支持PDF、DOCX和TXT文件`,
            variant: "destructive"
          });
          continue;
        }
        
        // 检查文件大小
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({
            title: "文件太大",
            description: `${file.name} 超过10MB限制`,
            variant: "destructive"
          });
          continue;
        }
        
        // 显示上传进度
        toast({
          title: `上传中 (${i + 1}/${files.length})`,
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        });
        
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadUrl = `${baseApiUrl}/api/upload_doc/`;
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`上传 ${file.name} 失败`);
        }
        
        console.log(`文件 ${file.name} 上传成功`);
      }
      
      // 刷新文档列表
      queryClient.invalidateQueries({ queryKey: [`${baseApiUrl}/api/documents`] });
      queryClient.invalidateQueries({ queryKey: [`${baseApiUrl}/api/vector_store_size`] });
      
      toast({
        title: "上传成功",
        description: "文档已上传并正在处理中"
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "无法上传文档",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.docx,.doc,.txt';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        uploadFiles(target.files);
      }
    };
    input.click();
  };

  const refreshIndex = async () => {
    try {
      setIsRefreshing(true);
      await apiRequest("POST", "/api/reset_vector_store", {});
      await refetch();
      toast({
        title: "索引已刷新",
        description: "知识库已成功刷新。"
      });
    } catch (error) {
      toast({
        title: "刷新失败",
        description: "无法刷新知识库。请重试。",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearKnowledgeBase = async () => {
    if (!confirm("确定要清空知识库吗？此操作将删除所有文档且无法撤销。")) {
      return;
    }

    try {
      setIsClearing(true);
      await apiRequest("DELETE", "/api/reset_vector_store", {});
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/vector_store_size`] });
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/documents`] });
      toast({
        title: "知识库已清空",
        description: "所有文档已从知识库中移除。"
      });
    } catch (error) {
      toast({
        title: "清空失败",
        description: "无法清空知识库。请重试。",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <aside className="bg-white border-r border-neutral-200 w-full md:w-96 flex flex-col h-full overflow-hidden transition-all duration-300">
      
      
      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 flex justify-between items-center border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-base font-bold text-neutral-700">知识库</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              title="上传文件"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  上传文件
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="刷新索引"
              onClick={refreshIndex}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="清空知识库"
              onClick={clearKnowledgeBase}
              disabled={isClearing || totalDocuments === 0}
            >
              {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* 文档列表 */}
        <div className="px-4 pt-4 pb-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">已上传文档</h4>
          <DocumentList documents={documents} isLoading={isLoading} />
        </div>
      </div>
      
      {/* 最后更新时间信息 */}
      {lastUpdated && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2">
          <div className="flex justify-end">
            <span className="text-xs text-neutral-500">最后更新: {lastUpdated}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
