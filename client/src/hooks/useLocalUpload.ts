import { useState } from 'react';

interface UploadResult {
  filePath: string;
  url: string;
}

interface UseLocalUploadOptions {
  category?: 'profiles' | 'posts' | 'slips' | 'temp';
  onSuccess?: (files: UploadResult[]) => void;
  onError?: (error: string) => void;
}

export function useLocalUpload(options: UseLocalUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = async (files: FileList | File[]): Promise<UploadResult[]> => {
    setUploading(true);
    setProgress(0);

    try {
      const fileArray = Array.from(files);
      const results: UploadResult[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', options.category || 'temp');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();
        results.push(result);

        // Update progress
        setProgress(((i + 1) / fileArray.length) * 100);
      }

      options.onSuccess?.(results);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadSingleFile = async (file: File): Promise<UploadResult> => {
    const results = await uploadFiles([file]);
    return results[0];
  };

  return {
    uploading,
    progress,
    uploadFiles,
    uploadSingleFile,
  };
}