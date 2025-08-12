import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, X, Plus, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ImageUploader } from "@/components/ImageUploader";

const createPostSchema = insertPostSchema.extend({
  preferences: z.object({
    ageMin: z.number().min(18).max(80).optional(),
    ageMax: z.number().min(18).max(80).optional(),
    gender: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).max(5).optional(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function CreatePostPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postImages, setPostImages] = useState<string[]>([]);
  const [wantToPinPost, setWantToPinPost] = useState(false);

  // Fetch coin balance and settings
  const { data: coinBalance } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
  });

  const { data: settings } = useQuery<{
    costPost: number;
    costPin: number;
  }>({
    queryKey: ["/api/settings"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      relationshipType: "SERIOUS",
      images: [],
      preferences: {
        ageMin: 18,
        ageMax: 35,
        gender: "",
        notes: "",
      },
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostFormData) => {
      const postData = {
        ...data,
        images: postImages,
        pinPost: wantToPinPost,
      };
      return await apiRequest("/api/posts", "POST", postData);
    },
    onSuccess: () => {
      toast({
        title: "Post created successfully!",
        description: wantToPinPost 
          ? "Your post has been pinned and will appear at the top of the home page."
          : "Your post has been submitted for admin approval.",
      });
      reset();
      setPostImages([]);
      setWantToPinPost(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostFormData) => {
    createPostMutation.mutate(data);
  };

  const totalCost = (settings?.costPost || 0) + (wantToPinPost ? (settings?.costPin || 3) : 0);
  const canAfford = (coinBalance?.coins || 0) >= totalCost;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-2">
          <Coins className="w-4 h-4 text-mint" />
          <span className="text-sm font-medium">{coinBalance?.coins || 0} coins</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Create New Post</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Share your story and connect with like-minded people
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Post Title *</Label>
              <Input
                id="title"
                placeholder="Give your post a catchy title..."
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell us about yourself and what you're looking for..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Relationship Type */}
            <div className="space-y-2">
              <Label>Looking for</Label>
              <Select onValueChange={(value) => setValue("relationshipType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASUAL">Casual Dating</SelectItem>
                  <SelectItem value="SERIOUS">Serious Relationship</SelectItem>
                  <SelectItem value="MARRIAGE">Marriage</SelectItem>
                  <SelectItem value="FRIENDSHIP">Friendship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Photos (up to 5)</Label>
              <ImageUploader
                currentImages={postImages}
                onImagesChange={setPostImages}
                maxImages={5}
              />
            </div>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Preferences (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageMin">Min Age</Label>
                    <Select onValueChange={(value) => setValue("preferences.ageMin", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageMax">Max Age</Label>
                    <Select onValueChange={(value) => setValue("preferences.ageMax", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Gender Preference */}
                <div className="space-y-2">
                  <Label>Preferred Gender</Label>
                  <Select onValueChange={(value) => setValue("preferences.gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional preferences or information..."
                    rows={3}
                    {...register("preferences.notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pin Post Option */}
            {user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || (coinBalance?.coins || 0) >= 3 ? (
              <Card className="border-mint/20 bg-mint/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-mint" />
                        <span className="font-medium">Pin Post</span>
                        <Badge variant="secondary">Featured</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Make your post appear at the top of the home page
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">
                        {user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? 'Free' : '3 coins'}
                      </span>
                      <Switch
                        checked={wantToPinPost}
                        onCheckedChange={setWantToPinPost}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Cost Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Post creation:</span>
                <span>{user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? 'Free' : `${settings?.costPost || 0} coins`}</span>
              </div>
              {wantToPinPost && (
                <div className="flex items-center justify-between text-sm">
                  <span>Pin post:</span>
                  <span>{user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? 'Free' : `${settings?.costPin || 3} coins`}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 flex items-center justify-between font-medium">
                <span>Total:</span>
                <span>{user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? 'Free' : `${totalCost} coins`}</span>
              </div>
              {!canAfford && (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') && (
                <p className="text-sm text-red-500 mt-2">
                  Insufficient coins. You need {totalCost - (coinBalance?.coins || 0)} more coins.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createPostMutation.isPending || (!canAfford && user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN')}
              className="w-full bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
            >
              {createPostMutation.isPending ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}