import { useQuery } from "@tanstack/react-query";
import { Document, ProcessingStatus } from "@shared/schema";
import { api } from "@/lib/api";

export function useDocuments() {
  const { 
    data: documents = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/documents"],
    refetchInterval: 3000, // Poll every 3 seconds to update processing status
  });
  
  // Filter documents that are still processing
  const processingDocuments = (documents as Document[]).filter(doc => 
    doc.status !== ProcessingStatus.COMPLETED && 
    doc.status !== ProcessingStatus.FAILED
  );
  
  // Sort documents by upload date (newest first)
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  
  return {
    documents: sortedDocuments as Document[],
    processingDocuments,
    isLoading,
    isError,
    refetch
  };
}
