import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { DocumentMetadata } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/queryClient";

interface FilePreviewProps {
  selectedFile: DocumentMetadata | null;
  onClose?: () => void;
}

export default function FilePreview({ selectedFile, onClose }: FilePreviewProps) {
  const [previewError, setPreviewError] = useState(false);

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="h-16 w-16 text-[#bbbbbb] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#202020] mb-2">选择文档预览</h3>
          <p className="text-[#8d8d8d]">点击左侧文档库中的文件进行预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 overflow-hidden bg-white">
        {selectedFile.filename.toLowerCase().endsWith('.pdf') ? (
          <div className="h-full bg-white">
            {previewError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-[#bbbbbb] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#202020] mb-2">无法预览文件</h3>
                  <p className="text-[#8d8d8d]">此文件类型暂不支持在线预览</p>
                </div>
              </div>
            ) : (
              <iframe
                src={`${getApiBaseUrl()}/api/preview/${encodeURIComponent(selectedFile.filename)}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-0"
                title={`预览 ${selectedFile.filename}`}
                onError={() => setPreviewError(true)}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-[#bbbbbb] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#202020] mb-2">文件预览</h3>
              <p className="text-[#8d8d8d]">此文件类型暂不支持在线预览</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
