import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Bell, Moon, Sun, Coins, Plus, Filter, Search, Shield } from "lucide-react";
import { Redirect } from "wouter";
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

import { BottomNavigation } from "@/components/BottomNavigation";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";

const createPostSchema = insertPostSchema.extend({
  preferences: z.object({
    ageMin: z.number().min(18).max(80).optional(),
    ageMax: z.number().min(18).max(80).optional(),
    gender: z.string().optional(),
    religion: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

export default function HomePage() {
  const { user } = useAuth();
  
  // Redirect users with PENDING status to onboard page
  if (user && user.status === 'PENDING') {
    return <Redirect to="/onboard" />;
  }
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch coin balance
  const { data: coinBalance } = useQuery({
    queryKey: ["/api/coins/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createPostForm = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      preferences: {
        ageMin: 18,
        ageMax: 50,
        gender: "",
        religion: "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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
    createPostMutation.mutate(data);
  };

  const unreadNotifications = notifications?.filter((n: any) => !n.seen).length || 0;

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-charcoal shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-mint to-soft-blue rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-mint to-soft-blue bg-clip-text text-transparent">
              Kaiveni
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Coin Balance */}
            <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {coinBalance?.coins || 0}
              </span>
            </div>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-gray-600" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </Button>
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blush rounded-full text-xs text-white flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            
            {/* Admin Dashboard Access - Only for Admin Users */}
            {user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin'}
                className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/40 border border-orange-300 dark:border-orange-600"
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4">


        {/* Quick Filters */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Discover Partners</h2>
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
          ) : postsData?.posts?.length > 0 ? (
            postsData.posts.map((post: any) => (
              <UserCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to create a post and start connecting!
              </p>
              {user?.status === 'APPROVED' && (
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={createPostForm.handleSubmit(onCreatePost)} className="space-y-4">
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
                  <Label htmlFor="religion">Preferred Religion</Label>
                  <Input
                    id="religion"
                    {...createPostForm.register("preferences.religion")}
                    placeholder="e.g., Islam"
                  />
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
