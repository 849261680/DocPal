import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

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
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    
    if (!validFiles) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and DOCX files are supported",
        variant: "destructive"
      });
      return;
    }
    
    // Check file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `${oversizedFiles.length > 1 ? "Some files exceed" : "File exceeds"} the maximum size of 10MB`,
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
  
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        
        // Upload file
        await fetch("/api/documents", {
          method: "POST",
          body: formData,
          credentials: "include"
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Upload failed");
          }
          return res.json();
        });
      }
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      // Reset state
      setSelectedFiles(null);
      if (inputRef.current) inputRef.current.value = "";
      
      toast({
        title: "Upload successful",
        description: `${selectedFiles.length > 1 ? "Documents" : "Document"} uploaded and being processed.`
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document(s)",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleFileChange(e.target.files)}
        />
        <div className="text-center">
          {selectedFiles ? (
            <>
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-600 mb-1">
                {selectedFiles.length === 1 
                  ? `${selectedFiles[0].name} selected`
                  : `${selectedFiles.length} files selected`}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-600 mb-1">Drag files here or click to browse</p>
              <p className="text-xs text-neutral-500">Supported formats: PDF, DOCX</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-neutral-500">Max size: 10MB per file</span>
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
              Uploading...
            </>
          ) : "Upload Files"}
        </Button>
      </div>
    </div>
  );
}
