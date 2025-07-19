import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocuments } from "@/hooks/use-documents";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, Upload, Search, Database, FileText, FolderOpen, ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getApiBaseUrl } from "@/lib/queryClient";
import { DocumentMetadata } from "@/lib/api";

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  documents: DocumentMetadata[];
  expanded?: boolean;
}

interface DocumentPanelProps {
  onFileSelect?: (file: DocumentMetadata) => void;
  selectedFile?: DocumentMetadata | null;
}

export default function DocumentPanel({ onFileSelect, selectedFile }: DocumentPanelProps) {
  const { toast } = useToast();
  const { documents, isLoading, refetch, totalDocuments, lastUpdated } = useDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
  
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
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
          toast({
            title: "文件太大",
            description: `${file.name} 超过100MB限制`,
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

  // Categorize documents
  const categorizeDocuments = (): DocumentCategory[] => {
    const categories: DocumentCategory[] = [
      {
        id: 'all',
        name: '文档库',
        icon: <Database className="h-4 w-4" />,
        documents: documents.filter(doc => doc.filename.toLowerCase().includes(searchQuery.toLowerCase())),
        expanded: true
      },
      {
        id: 'reports',
        name: '技术文档',
        icon: <FileText className="h-4 w-4" />,
        documents: documents.filter(doc => 
          (doc.filename.includes('报告') || doc.filename.includes('.md')) && 
          doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },
      {
        id: 'operations',
        name: '运营资料',
        icon: <Folder className="h-4 w-4" />,
        documents: documents.filter(doc => 
          (doc.filename.includes('运营') || doc.filename.includes('策略')) && 
          doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },
      {
        id: 'meetings',
        name: '会议纪要',
        icon: <FolderOpen className="h-4 w-4" />,
        documents: documents.filter(doc => 
          doc.filename.includes('会议') && 
          doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
    ];
    
    return categories.filter(cat => cat.documents.length > 0 || cat.id === 'all');
  };

  const categories = categorizeDocuments();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`确定要删除 "${filename}" 吗？`)) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/documents/${filename}`, {});
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/documents`] });
      queryClient.invalidateQueries({ queryKey: [`${getApiBaseUrl()}/api/vector_store_size`] });
      toast({
        title: "文档已删除",
        description: `${filename} 已从知识库中移除。`
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "无法删除文档。请重试。",
        variant: "destructive"
      });
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="mb-4">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                上传文档
              </>
            )}
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Document categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {categories.map((category) => (
            <div key={category.id} className="">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                {category.icon}
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                {category.documents.length > 0 && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {category.documents.length}
                  </span>
                )}
              </button>
              
              {expandedCategories.has(category.id) && (
                <div className="ml-6 space-y-1">
                  {category.documents.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500">
                        {searchQuery ? "没有找到匹配的文档" : "暂无文档"}
                      </p>
                    </div>
                  ) : (
                    category.documents.map((doc) => (
                      <div 
                        key={doc.filename} 
                        className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-md group cursor-pointer transition-colors ${
                          selectedFile?.filename === doc.filename ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => onFileSelect?.(doc)}
                      >
                        <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            selectedFile?.filename === doc.filename ? 'text-blue-700 font-medium' : 'text-gray-700'
                          }`}>
                            {doc.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(doc.file_size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.filename);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshIndex}
            disabled={isRefreshing}
            className="flex-1"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearKnowledgeBase}
            disabled={isClearing || totalDocuments === 0}
            className="flex-1"
          >
            {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}