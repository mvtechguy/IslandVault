import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "./ui/button";
import { X, Image as ImageIcon } from "lucide-react";

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

  const handleImageUpload = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const newImageUrls = result.successful.map((file: any) => file.uploadURL);
      const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
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
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <ObjectUploader
          maxNumberOfFiles={maxImages - images.length}
          maxFileSize={5242880} // 5MB
          onGetUploadParameters={getUploadParameters}
          onComplete={handleImageUpload}
          buttonClassName="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-mint dark:hover:border-mint bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-8"
        >
          <div className="flex flex-col items-center space-y-2">
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm font-medium">
              Add Images ({images.length}/{maxImages})
            </span>
            <span className="text-xs text-gray-500">
              JPG, PNG, GIF up to 5MB each
            </span>
          </div>
        </ObjectUploader>
      )}
    </div>
  );
}