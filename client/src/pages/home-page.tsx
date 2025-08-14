import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Bell, Moon, Sun, Coins, Plus, Filter, Search, Shield, Sparkles, Zap, Star, MapPin, Cpu, Activity } from "lucide-react";
import { QuantumCard } from "@/components/QuantumCard";
import { QuantumButton } from "@/components/QuantumButton";
import { QuantumProfileCard } from "@/components/QuantumProfileCard";
import { QuantumHeader } from "@/components/QuantumHeader";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { UserCard } from "@/components/UserCard";

import { QuantumBottomNav } from "@/components/QuantumBottomNav";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
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

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect users with PENDING status to onboard page
  if (user && user.status === 'PENDING') {
    return <Redirect to="/onboard" />;
  }
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [postImages, setPostImages] = useState<string[]>([]);

  // Fetch posts (both pinned and regular posts for home page)
  const { data: postsData, isLoading: postsLoading } = useQuery<{
    posts: any[];
    total: number;
    hasMore: boolean;
  }>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch coin balance
  const { data: coinBalance } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch notifications
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch settings
  const { data: settings } = useQuery<{
    coinPriceMvr: string;
    costPost: number;
    costConnect: number;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankBranch?: string;
    bankName?: string;
    maxUploadMb: number;
    themeConfig?: any;
  }>({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createPostForm = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      images: [],
      preferences: {
        ageMin: 18,
        ageMax: 50,
        gender: "",

        notes: "",
      },
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostFormData) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created successfully!",
        description: "Your post is now pending admin approval.",
      });
      setShowCreatePost(false);
      createPostForm.reset();
      setPostImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts?pinned=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreatePost = (data: CreatePostFormData) => {
    const postData = {
      ...data,
      images: postImages,
    };
    createPostMutation.mutate(postData);
  };

  const unreadNotifications = notifications?.filter((n: any) => !n.seen).length || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Quantum Background Effects */}
      <div className="quantum-particles"></div>
      
      {/* Futuristic Header */}
      <header className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-b border-cyan-400/20 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center neural-pulse">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold holo-text">
              Quantum Match
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Quantum Credits */}
            <QuantumCard glow={false} className="px-3 py-1">
              <QuantumButton
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/coins')}
                className="flex items-center space-x-2"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">
                  {coinBalance?.coins || 0}
                </span>
                <span className="text-xs text-muted-foreground">Credits</span>
                <Plus className="w-3 h-3 text-cyan-400" />
              </QuantumButton>
            </QuantumCard>
            
            {/* Quantum Controls */}
            <QuantumButton
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              quantum
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </QuantumButton>
            
            {/* Neural Notifications */}
            <QuantumButton
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-pink-500 text-xs neural-pulse">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Badge>
              )}
            </QuantumButton>
            
            {/* Admin Quantum Access */}
            {user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
              <QuantumButton
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = '/admin'}
                className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-400/30"
                title="Quantum Admin Console"
                quantum
              >
                <Shield className="w-4 h-4 text-orange-400" />
              </QuantumButton>
            )}
          </div>
        </div>
      </header>

      {/* Quantum Main Content */}
      <main className="pb-20 px-4 relative z-10">
        {/* Neural Status Panel */}
        <QuantumCard floating className="mt-6 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold holo-text">Neural Network Status</h2>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 neural-pulse">
                <Activity className="h-3 w-3 mr-1" />
                ONLINE
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{postsData?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Active Profiles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">AI</div>
                <div className="text-xs text-muted-foreground">Match Engine</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-400">∞</div>
                <div className="text-xs text-muted-foreground">Possibilities</div>
              </div>
            </div>
          </div>
        </QuantumCard>

        {/* Quantum Filters */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pinned Posts</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="text-sm text-mint font-medium"
            >
              <Filter className="w-4 h-4 mr-1" />
              All Filters
            </Button>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              <Badge variant="default" className="bg-mint hover:bg-mint/80 text-white whitespace-nowrap">
                All
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap hover:border-mint">
                Male
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap hover:border-mint">
                Female
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap hover:border-mint">
                20-30
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap hover:border-mint">
                Malé
              </Badge>
            </div>
          </div>
        </div>

        {/* User Cards Feed */}
        <div className="mt-6 space-y-4">
          {postsLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-charcoal rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : postsData?.posts && postsData.posts.length > 0 ? (
            postsData.posts.map((post: any) => (
              <QuantumProfileCard 
                key={post.id} 
                post={post}
                onConnect={(userId, postId) => {
                  console.log("Quantum connection initiated:", userId, postId);
                }}
                onLike={(postId) => {
                  console.log("Neural like activated:", postId);
                }}
              />
            ))
          ) : (
            <QuantumCard floating particles className="text-center py-16">
              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center neural-pulse">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold holo-text mb-2">
                    Neural Network Initializing
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to join the quantum connection matrix and start making meaningful matches!
                  </p>
                  {user?.status === 'APPROVED' && (
                    <QuantumButton
                      onClick={() => setShowCreatePost(true)}
                      quantum
                      pulse
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Initialize Neural Profile
                    </QuantumButton>
                  )}
                </div>
              </div>
            </QuantumCard>
          )}
        </div>

        {/* Quantum Profile Creation Matrix */}
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto quantum-glow">
            <DialogHeader className="border-b border-cyan-400/20 pb-4">
              <DialogTitle className="text-xl holo-text flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <span>Neural Profile Matrix</span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Initialize your quantum connection profile to start matching with compatible souls
              </p>
            </DialogHeader>
            <form onSubmit={createPostForm.handleSubmit(onCreatePost as any)} className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  {...createPostForm.register("title")}
                  placeholder="Give your post a title..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...createPostForm.register("description")}
                  placeholder="Tell others what you're looking for..."
                  rows={4}
                  maxLength={600}
                />
                {createPostForm.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {createPostForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Image Upload Section */}
              <div>
                <Label>Images (Optional)</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add up to 5 images to make your post more attractive
                </p>
                <ImageUploader
                  maxImages={5}
                  onImagesChange={setPostImages}
                  currentImages={postImages}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Partner Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageMin">Min Age</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      min="18"
                      max="80"
                      {...createPostForm.register("preferences.ageMin", { valueAsNumber: true })}
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageMax">Max Age</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      min="18"
                      max="80"
                      {...createPostForm.register("preferences.ageMax", { valueAsNumber: true })}
                      placeholder="50"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="gender">Preferred Gender</Label>
                  <Select 
                    value={createPostForm.watch("preferences.gender") || "any"}
                    onValueChange={(value) => {
                      const genderValue = value === "any" ? undefined : value;
                      createPostForm.setValue("preferences.gender", genderValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                <div className="mt-4">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...createPostForm.register("preferences.notes")}
                    placeholder="Any specific preferences..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cost: {settings?.costPost || 2} coins
                </div>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || (user?.coins || 0) < (settings?.costPost || 2)}
                    className="bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
                  >
                    {createPostMutation.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </div>
              </div>
              
              {(user?.coins || 0) < (settings?.costPost || 2) && (
                <p className="text-sm text-red-600 text-center">
                  Insufficient coins. You need {settings?.costPost || 2} coins to create a post.
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </main>

      {/* Quantum Bottom Navigation */}
      <QuantumBottomNav notifications={unreadNotifications} />
    </div>
  );
}
