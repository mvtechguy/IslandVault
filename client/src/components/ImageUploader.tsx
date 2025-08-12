import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { X, Upload, Image as ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  currentImages?: string[];
}

export function ImageUploader({ 
  maxImages = 5, 
  onImagesChange, 
  currentImages = [] 
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string> => {
    // Get upload URL from server
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    
    const { uploadURL } = await response.json();
    
    // Upload file to cloud storage
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }
    
    return uploadURL;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    const totalImages = images.length + files.length;
    if (totalImages > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload ${maxImages} images total. You currently have ${images.length} images.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      // Upload files one by one
      const uploadPromises = validFiles.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Update images array
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);
      
      toast({
        title: "Images uploaded successfully",
        description: `${uploadedUrls.length} image(s) added to your post.`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-3">
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
              <div key={`image-${index}-${image.slice(-10)}`} className="relative group">
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.classList.remove('hidden');
                        }
                      }
                    }}
                  />
                  <div className="image-placeholder hidden absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  {/* Image number badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </div>
                </div>
                {/* Remove button */}
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

      {/* Upload Button or Max Message */}
      {canAddMore ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-mint dark:hover:border-mint bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-8 transition-colors"
            variant="ghost"
          >
            <div className="flex flex-col items-center space-y-2">
              {uploading ? (
                <>
                  <Upload className="w-8 h-8 animate-pulse" />
                  <span className="text-sm font-medium">
                    Uploading images...
                  </span>
                  <span className="text-xs text-gray-500">
                    Please wait
                  </span>
                </>
              ) : (
                <>
                  <Plus className="w-8 h-8" />
                  <span className="text-sm font-medium">
                    Add Images ({images.length}/{maxImages})
                  </span>
                  <span className="text-xs text-gray-500">
                    JPG, PNG, WebP up to 5MB each
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>
      ) : (
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