import DocumentItem from "@/components/document-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder } from "lucide-react";
import { Document } from "@shared/schema";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
}

export default function DocumentList({ documents, isLoading }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-neutral-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <Folder className="text-neutral-300 h-10 w-10 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">尚未上传任何文档</p>
        <p className="text-xs text-neutral-400 mt-1">上传文档开始构建您的知识库</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-neutral-200">
      {documents.map((document) => (
        <DocumentItem key={document.id} document={document} />
      ))}
    </div>
  );
}
