import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

// 使用CORS代理服务，解决CORS问题
const useCorsProxy = (url: string) => {
  // 文件上传不使用代理
  if (url.includes('upload_doc')) {
    return url; 
  }
  // 生产环境 (onrender.com) 或其他非本地开发环境，通常应该由后端正确处理CORS，不再需要代理
  if (url.includes('onrender.com') || (import.meta.env.PROD && !window.location.hostname.includes('localhost'))) {
    return url; // 直接返回原始URL，不使用代理
  }
  return url; // 默认情况下，我们相信后端能处理CORS
};

// 检查URL是否使用了代理
const isProxiedUrl = (url: string) => {
  return url.includes('allorigins.win');
};

export default function FileUploader() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check file types
    const validFiles = Array.from(files).every(file => 
      file.type === "application/pdf" || 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "text/plain" // 添加TXT支持
    );
    
    if (!validFiles) {
      toast({
        title: "文件类型无效",
        description: "仅支持PDF, DOCX和TXT文件",
        variant: "destructive"
      });
      return;
    }
    
    // Check file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "文件太大",
        description: `${oversizedFiles.length > 1 ? "部分文件超过" : "文件超过"}最大10MB限制`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(files);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };
  
  // 添加休眠函数
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 添加重试逻辑的文件上传函数
  const uploadFileWithRetry = async (file: File, baseApiUrl: string, maxRetries = 3) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const uploadUrl = `${baseApiUrl}/api/upload_doc/`;
    console.log(`正在上传文件到: ${uploadUrl}`);
    
    let lastError: Error | null = null;
    
    // 重试循环
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 添加超时处理 - 增加到90秒(1.5分钟)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 1.5分钟超时
        
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: 'omit', // 始终不发送凭据
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        // 专门处理503错误（服务不可用，可能是Render休眠导致）
        if (response.status === 503) {
          if (attempt < maxRetries) {
            console.warn(`服务不可用(503)，正在第${attempt + 1}次重试文件上传(共${maxRetries}次)...`);
            // 等待时间随重试次数增加
            await sleep(2000 * (attempt + 1)); // 第一次等2秒，第二次4秒，第三次6秒
            continue; // 继续下一次重试
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`上传失败: ${response.status} ${response.statusText}`, errorText);
          throw new Error(errorText || `上传失败: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`文件 ${file.name} 上传成功:`, result);
        return result;
      } catch (err) {
        lastError = err as Error;
        
        // 处理AbortError（超时错误）
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.warn(`文件上传超时，正在第${attempt + 1}次重试(共${maxRetries}次)...`);
        } else {
          console.warn(`文件上传失败，正在第${attempt + 1}次重试(共${maxRetries}次)...错误：${lastError?.message}`);
        }
        
        // 如果已经是最后一次尝试，则抛出错误
        if (attempt >= maxRetries) {
          throw lastError;
        }
        
        // 指数退避策略，等待时间随重试次数增加
        const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000); // 最长等待10秒
        console.log(`等待 ${waitTime/1000} 秒后重试...`);
        await sleep(waitTime);
      }
    }
    
    // 这里不应该到达，但为了类型检查，添加这个抛出
    throw new Error("重试失败");
  };
  
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    console.log("开始上传文件...");
    
    try {
      // 获取API基础URL
      const baseApiUrl = getApiBaseUrl();
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`准备上传文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
        
        // 显示正在上传哪个文件
        toast({
          title: `上传中 (${i + 1}/${selectedFiles.length})`,
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        });
        
        try {
          // 使用带重试逻辑的上传函数
          const result = await uploadFileWithRetry(file, baseApiUrl, 3);
          console.log(`文件 ${file.name} 上传成功:`, result);
        } catch (fileError) {
          // 处理单个文件上传错误
          console.error(`文件 ${file.name} 上传失败:`, fileError);
          throw fileError; // 继续向上抛出错误
        }
      }
      
      // 所有文件上传成功后，刷新文档列表和向量库大小
      try {
        const documentsUrl = `${baseApiUrl}/api/documents`;
        const vectorSizeUrl = `${baseApiUrl}/api/vector_store_size`;
        
        queryClient.invalidateQueries({ queryKey: [documentsUrl] });
        queryClient.invalidateQueries({ queryKey: [vectorSizeUrl] });
        
        console.log(`刷新文档列表: ${documentsUrl}`);
        console.log(`刷新向量库信息: ${vectorSizeUrl}`);
      } catch (refreshError) {
        console.error("刷新文档列表失败:", refreshError);
        // 不阻止上传成功的处理，只记录错误
      }
      
      // 重置状态
      setSelectedFiles(null);
      if (inputRef.current) inputRef.current.value = "";
      
      toast({
        title: "上传成功",
        description: `文档已上传并正在处理中。`
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "无法上传文档",
        variant: "destructive"
      });
    } finally {
      console.log("上传过程结束");
      setIsUploading(false);
    }
  };

  // 新增处理文件选择的函数
  const handleSelectFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    inputRef.current?.click();
  };
  
  return (
    <div>
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive ? "border-primary/70 bg-primary/5" : 
          selectedFiles ? "border-success/70 bg-success/5" : 
          "border-neutral-300 hover:border-primary/70 bg-neutral-50 hover:bg-neutral-100/60"
        } cursor-pointer`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleSelectFile}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          className="hidden" // 将绝对定位改为隐藏
          accept=".pdf,.docx,.doc,.txt"
          onChange={(e) => handleFileChange(e.target.files)}
        />
        <div className="text-center">
          {selectedFiles ? (
            <>
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-600 mb-1">
                {selectedFiles.length === 1 
                  ? `已选择: ${selectedFiles[0].name}`
                  : `已选择 ${selectedFiles.length} 个文件`}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-600 mb-1">将文件拖放到此处或点击浏览</p>
              <p className="text-xs text-neutral-500">支持格式: PDF, DOCX, TXT</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-neutral-500">最大文件: 10MB/个</span>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={!selectedFiles || isUploading}
          className="text-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              上传中...
            </>
          ) : "上传文件"}
        </Button>
      </div>
    </div>
  );
}
