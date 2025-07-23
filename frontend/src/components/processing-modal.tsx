import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Cog, Loader2 } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { ProcessingStatus } from "@shared/schema";

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProcessingModal({ isOpen, onClose }: ProcessingModalProps) {
  const { processingDocuments, isLoading } = useDocuments();
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Allow closing when all documents are processed
    if (processingDocuments.length === 0 && !isLoading) {
      setCanClose(true);
    } else {
      setCanClose(false);
    }
  }, [processingDocuments, isLoading]);

  const getStepStatus = (step: string, document: typeof processingDocuments[0]) => {
    switch (step) {
      case "extracting":
        if (document.status === ProcessingStatus.EXTRACTING) {
          return { status: "processing", progress: document.progress };
        }
        if (document.status === ProcessingStatus.CHUNKING || 
            document.status === ProcessingStatus.EMBEDDING || 
            document.status === ProcessingStatus.INDEXING || 
            document.status === ProcessingStatus.COMPLETED) {
          return { status: "completed", progress: 100 };
        }
        return { status: "pending", progress: 0 };
        
      case "chunking":
        if (document.status === ProcessingStatus.CHUNKING) {
          return { status: "processing", progress: document.progress };
        }
        if (document.status === ProcessingStatus.EMBEDDING || 
            document.status === ProcessingStatus.INDEXING || 
            document.status === ProcessingStatus.COMPLETED) {
          return { status: "completed", progress: 100 };
        }
        return { status: "pending", progress: 0 };
        
      case "embedding":
        if (document.status === ProcessingStatus.EMBEDDING) {
          return { status: "processing", progress: document.progress };
        }
        if (document.status === ProcessingStatus.INDEXING || 
            document.status === ProcessingStatus.COMPLETED) {
          return { status: "completed", progress: 100 };
        }
        return { status: "pending", progress: 0 };
        
      case "indexing":
        if (document.status === ProcessingStatus.INDEXING) {
          return { status: "processing", progress: document.progress };
        }
        if (document.status === ProcessingStatus.COMPLETED) {
          return { status: "completed", progress: 100 };
        }
        return { status: "pending", progress: 0 };
        
      default:
        return { status: "pending", progress: 0 };
    }
  };

  const renderProcessingSteps = () => {
    if (processingDocuments.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-neutral-600">当前没有正在处理的文档。</p>
        </div>
      );
    }

    // Just show the most recent document being processed
    const document = processingDocuments[0];
    
    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-neutral-700">文本提取</span>
            <StatusLabel status={getStepStatus("extracting", document)} />
          </div>
          <Progress value={getStepStatus("extracting", document).progress} className="h-1.5" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-neutral-700">文本分块与清洗</span>
            <StatusLabel status={getStepStatus("chunking", document)} />
          </div>
          <Progress value={getStepStatus("chunking", document).progress} className="h-1.5" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-neutral-700">向量嵌入</span>
            <StatusLabel status={getStepStatus("embedding", document)} />
          </div>
          <Progress value={getStepStatus("embedding", document).progress} className="h-1.5" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-neutral-700">建立索引</span>
            <StatusLabel status={getStepStatus("indexing", document)} />
          </div>
          <Progress value={getStepStatus("indexing", document).progress} className="h-1.5" />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Cog className="text-primary h-8 w-8 animate-pulse" />
          </div>
          <DialogTitle className="text-center">文档处理中</DialogTitle>
          <p className="text-center text-neutral-600 text-sm mt-1">
            根据文档大小，这可能需要几分钟时间
          </p>
        </DialogHeader>
        
        {renderProcessingSteps()}
        
        <DialogFooter className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={!canClose}
          >
            取消
          </Button>
          <Button
            onClick={onClose}
            disabled={!canClose}
          >
            {canClose ? "关闭" : "处理中..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusLabelProps {
  status: {
    status: string;
    progress: number;
  };
}

function StatusLabel({ status }: StatusLabelProps) {
  if (status.status === "completed") {
    return (
      <span className="text-success flex items-center">
        <CheckCircle className="h-3 w-3 mr-1" /> 完成
      </span>
    );
  }
  
  if (status.status === "processing") {
    return <span className="text-neutral-700">{status.progress}%</span>;
  }
  
  return <span className="text-neutral-500">等待中...</span>;
}
