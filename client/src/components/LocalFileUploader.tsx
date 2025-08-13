import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface LocalFileUploaderProps {
  category?: 'profiles' | 'posts' | 'slips' | 'temp';
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onUploadComplete?: (files: Array<{ filePath: string; url: string }>) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function LocalFileUploader({
  category = 'posts',
  accept = "image/*",
  maxSizeMB = 10,
  multiple = false,
  onUploadComplete,
  onUploadError,
  disabled = false,
  children,
  className = ""
}: LocalFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSizeBytes) {
        onUploadError?.(`File ${files[i].name} is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
    }

    setSelectedFiles(files);

    // Generate previews for images
    const newPreviews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviews.push(url);
      }
    }
    setPreviews(newPreviews);
  };

  const uploadFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const uploadedFiles: Array<{ filePath: string; url: string }> = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();
        uploadedFiles.push(result);

        // Update progress
        setProgress(((i + 1) / selectedFiles.length) * 100);
      }

      onUploadComplete?.(uploadedFiles);
      
      // Clean up
      setSelectedFiles(null);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFiles(null);
    setPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
        id="file-upload"
      />
      
      <label htmlFor="file-upload">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          className="w-full cursor-pointer"
          asChild
        >
          <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            {children || (
              <>
                <Upload className="w-5 h-5" />
                <span>Choose {multiple ? 'files' : 'file'} to upload</span>
              </>
            )}
          </div>
        </Button>
      </label>

      {/* File previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
            </div>
          ))}
        </div>
      )}

      {/* Selected files list */}
      {selectedFiles && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Upload button */}
          <Button
            onClick={uploadFiles}
            disabled={uploading || !selectedFiles}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}