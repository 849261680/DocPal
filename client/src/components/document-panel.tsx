import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/file-uploader";
import DocumentList from "@/components/document-list";
import { useDocuments } from "@/hooks/use-documents";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getApiBaseUrl } from "@/lib/queryClient";

export default function DocumentPanel() {
  const { toast } = useToast();
  const { documents, isLoading, refetch, totalDocuments, lastUpdated } = useDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="font-semibold text-neutral-800">知识库</h2>
      </div>
      
      {/* Upload section */}
      <div className="px-4 py-5 border-b border-neutral-200">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-1">上传文档</h3>
          <p className="text-xs text-neutral-500">上传PDF、DOCX或TXT文件以构建您的知识库</p>
        </div>
        
        <FileUploader />
      </div>
      
      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 flex justify-between items-center border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-medium text-neutral-700">知识库管理</h3>
          <div className="flex gap-2">
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
