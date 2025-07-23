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
  
  // 优化的重试逻辑的文件上传函数
  const uploadFileWithRetry = async (file: File, baseApiUrl: string, maxRetries = 2) => { // 减少重试次数从3减到2
    // 加强的文件大小检查
    const maxSize = 5 * 1024 * 1024; // 减少到 5MB
    if (file.size > maxSize) {
      throw new Error(`文件过大，请将文件大小控制在5MB以内`);
    }
    
    // 添加请求ID来标识这个特定上传 - 避免重复处理
    const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("request_id", requestId); // 添加请求ID
    
    const uploadUrl = `${baseApiUrl}/api/upload_doc/`;
    console.log(`正在上传文件到: ${uploadUrl}`);
    
    let lastError: Error | null = null;
    
    // 重试循环
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 使用更长的超时但减少重试次数
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟超时
        
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: 'omit', // 始终不发送凭据
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        // 显示等待提示消息，通知用户正在处理
        if (attempt === 0) {
          toast({
            title: "正在处理文件",
            description: `请耐心等待，文件处理可能需要一些时间...`
          });
        }

        // 专门处理503错误（服务不可用，可能是Render休眠导致）
        if (response.status === 503) {
          if (attempt < maxRetries) {
            // 显示服务唯渐通知
            toast({
              title: "服务正在启动",
              description: `首次访问可能需要一点时间，请稍候...`,
              duration: 5000 // 显示5秒
            });
            
            console.warn(`服务不可用(503)，正在第${attempt + 1}次重试文件上传(共${maxRetries}次)...`);
            // 大幅延长等待时间
            const waitTime = 8000 * (attempt + 1); // 第一次等8秒，第二次16秒
            console.log(`等待 ${waitTime/1000} 秒后重试...`);
            await sleep(waitTime);
            continue; // 继续下一次重试
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`上传失败: ${response.status} ${response.statusText}`, errorText);
          throw new Error(errorText || `上传失败: ${response.status}`);
        }

        // 检查响应体是否为空
        const responseText = await response.text();
        if (!responseText) {
          console.log(`文件 ${file.name} 上传成功，响应体为空`);
          return { success: true }; // 返回一个表示成功的对象
        }

        // 如果响应体不为空，则解析为JSON
        const result = JSON.parse(responseText);
        console.log(`文件 ${file.name} 上传成功:`, result);
        return result;
      } catch (err) {
        lastError = err as Error;
        
        // 处理AbortError（超时错误）
        if (err instanceof DOMException && err.name === 'AbortError') {
          toast({
            title: "文件上传超时",
            description: `服务器响应过慢，可能是文件过大或网络问题`,
            variant: "destructive"
          });
          console.warn(`文件上传超时，正在第${attempt + 1}次重试(共${maxRetries}次)...`);
        } else {
          console.warn(`文件上传失败，正在第${attempt + 1}次重试(共${maxRetries}次)...错误：${lastError?.message}`);
        }
        
        // 如果已经是最后一次尝试，则抛出错误
        if (attempt >= maxRetries) {
          throw lastError;
        }
        
        // 大幅修改等待时间 - 使用更长的固定间隔而不是指数退避
        const waitTime = 10000 * (attempt + 1); // 第一次等10秒，第二次20秒 - 比之前长得多
        console.log(`等待 ${waitTime/1000} 秒后重试...`);
        
        // 显示重试提示
        toast({
          title: `文件上传失败，正在重试`,
          description: `将在${waitTime/1000}秒后再尝试上传...请耐心等待`,
          duration: 5000
        });
        
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
          if (result.error) {
            throw new Error(result.error);
          }
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
      <input 
        ref={inputRef}
        type="file" 
        multiple 
        className="hidden"
        accept=".pdf,.docx,.doc,.txt"
        onChange={(e) => handleFileChange(e.target.files)}
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="上传文件"
        onClick={handleSelectFile}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
      
      {selectedFiles && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-200 rounded-lg shadow-lg min-w-48 z-10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-600">
              {selectedFiles.length === 1 
                ? `已选择: ${selectedFiles[0].name}`
                : `已选择 ${selectedFiles.length} 个文件`}
            </span>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={isUploading}
              className="text-xs h-6"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  上传中...
                </>
              ) : "上传"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
