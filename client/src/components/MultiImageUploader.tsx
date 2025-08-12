import { useState, useEffect } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "./ui/button";
import { X, Image as ImageIcon, Upload } from "lucide-react";

interface MultiImageUploaderProps {
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  currentImages?: string[];
}

export function MultiImageUploader({ 
  maxImages = 5, 
  onImagesChange, 
  currentImages = [] 
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);

  // Sync with parent component's currentImages
  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  const handleImageUpload = async (result: any) => {
    setIsUploading(false);
    if (result.successful && result.successful.length > 0) {
      const newImageUrls = result.successful.map((file: any) => file.uploadURL);
      const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const getUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            {images.length >= maxImages && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Maximum reached
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  {/* Image overlay with number */}
                  <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <ObjectUploader
          maxNumberOfFiles={maxImages - images.length}
          maxFileSize={5242880} // 5MB
          onGetUploadParameters={getUploadParameters}
          onComplete={handleImageUpload}
          onUploadStart={handleUploadStart}
          buttonClassName="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-mint dark:hover:border-mint bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-8 transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            {isUploading ? (
              <>
                <Upload className="w-8 h-8 animate-pulse" />
                <span className="text-sm font-medium">
                  Uploading... ({images.length}/{maxImages})
                </span>
                <span className="text-xs text-gray-500">
                  Please wait while images are being uploaded
                </span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm font-medium">
                  Add Images ({images.length}/{maxImages})
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG, WebP up to 5MB each
                </span>
              </>
            )}
          </div>
        </ObjectUploader>
      )}

      {/* Max Images Reached Message */}
      {images.length >= maxImages && (
        <div className="w-full border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-8 rounded-lg text-center">
          <div className="flex flex-col items-center space-y-2">
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm font-medium">
              Maximum images reached ({maxImages}/{maxImages})
            </span>
            <span className="text-xs">
              Remove an image to add a new one
            </span>
          </div>
        </div>
      )}
    </div>
  );
}