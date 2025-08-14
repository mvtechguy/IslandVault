import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, MessageCircle, Eye, MoreHorizontal, Camera, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Post } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface UserCardProps {
  post: Post & {
    user: {
      id: number;
      fullName: string;
      island: string;
      atoll: string;
      profilePhotoPath?: string;
      shortBio?: string;
      dateOfBirth: string;
      useRealIdentity?: boolean;
      fakeFullName?: string;
      fakeAge?: number;
      fakeIsland?: string;
      fakeAtoll?: string;
    };
  };
}

export function UserCard({ post }: UserCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const isOwnPost = user?.id === post.userId;
  const canConnect = user?.status === 'APPROVED' && !isOwnPost;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Determine if user is using fake identity and what to display
  const isUsingFakeIdentity = post.user.useRealIdentity === false;
  const displayName = isUsingFakeIdentity && post.user.fakeFullName ? post.user.fakeFullName : post.user.fullName;
  const displayAge = isUsingFakeIdentity && post.user.fakeAge ? post.user.fakeAge : calculateAge(post.user.dateOfBirth);
  const displayIsland = isUsingFakeIdentity && post.user.fakeIsland ? post.user.fakeIsland : post.user.island;
  const displayAtoll = isUsingFakeIdentity && post.user.fakeAtoll ? post.user.fakeAtoll : post.user.atoll;

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      setLiked(!liked);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: liked ? "Unliked" : "Liked",
        description: liked ? "Removed from liked posts" : "Added to liked posts",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/connections", {
        targetUserId: post.userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Connection request sent!",
        description: "Your request has been sent. You'll be notified when they respond.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    },
  });

  const identityRevealMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/image-reveal/request", {
        targetUserId: post.userId,
        postId: post.id,
        requestType: "REAL_IDENTITY",
        message: requestMessage
      });
    },
    onSuccess: () => {
      toast({
        title: "Identity reveal request sent!",
        description: "Your request is pending approval",
      });
      setShowIdentityDialog(false);
      setRequestMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-xl rounded-3xl overflow-hidden border-0 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 backdrop-blur-sm">
      {/* Header with Profile and Pin */}
      <div className="relative p-6 pb-4">
        {post.isPinned && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border-0 font-semibold">
              ✨ Pinned
            </Badge>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-mint to-soft-blue rounded-full p-0.5">
              <img
                src={post.user.profilePhotoPath || "https://via.placeholder.com/150"}
                alt={post.user.fullName}
                className="w-16 h-16 rounded-full object-cover bg-white"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white dark:border-gray-900 shadow-lg"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">{displayName}</h3>
              {isUsingFakeIdentity && (
                <Badge variant="secondary" className="text-xs">
                  🎭 Hidden
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="w-4 h-4 text-mint" />
              <span className="font-medium">{displayIsland}, {displayAtoll}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="font-medium">{displayAge} years</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        {post.title && (
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{post.title}</h4>
        )}
        
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
          {post.description}
        </p>

        {/* Primary Image Display - 1:1 Aspect Ratio */}
        {post.images && Array.isArray(post.images) && post.images.length > 0 && (
          <div className="mb-4">
            <div className="relative group">
              <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src={post.images[0].startsWith('/uploads') ? post.images[0] : `/uploads/posts/${post.images[0]}`}
                  alt="Post image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {post.images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                    +{post.images.length - 1} more
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        )}

        {/* Preferences Tags */}
        {post.preferences && typeof post.preferences === 'object' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.preferences as any).ageMin && (post.preferences as any).ageMax && (
              <Badge variant="secondary" className="bg-mint/10 text-mint border-mint/20 text-xs font-medium px-2 py-1">
                {(post.preferences as any).ageMin}-{(post.preferences as any).ageMax} years
              </Badge>
            )}
            {(post.preferences as any).gender && (
              <Badge variant="secondary" className="bg-blush/10 text-blush border-blush/20 text-xs font-medium px-2 py-1">
                Seeking {(post.preferences as any).gender}
              </Badge>
            )}
            {post.relationshipType && (
              <Badge variant="secondary" className="bg-lavender/10 text-lavender border-lavender/20 text-xs font-medium px-2 py-1">
                {post.relationshipType}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Action Bar */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isOwnPost && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className="flex items-center space-x-2 text-gray-600 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl px-3 py-2 transition-all duration-200"
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current text-rose-500' : ''}`} />
                <span className="font-medium">{post.likes || 0}</span>
              </Button>
            )}
            
            <Link href={`/posts/${post.id}`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 text-gray-600 hover:text-soft-blue dark:text-gray-400 dark:hover:text-soft-blue hover:bg-soft-blue/10 rounded-xl px-3 py-2 transition-all duration-200"
              >
                <Eye className="w-5 h-5" />
                <span className="font-medium">View Post</span>
              </Button>
            </Link>

            {/* Request More Images Button */}
            {!isOwnPost && post.images && post.images.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-600 hover:text-mint dark:text-gray-400 dark:hover:text-mint hover:bg-mint/10 rounded-xl px-3 py-2 transition-all duration-200"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">More Images</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Real Identity Request Button */}
            {!isOwnPost && isUsingFakeIdentity && (
              <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20 rounded-xl px-3 py-2 transition-all duration-200"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span className="font-medium">Request Real Identity</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Real Identity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This user is currently using a hidden identity. Send a request to see their real information.
                    </p>
                    <div>
                      <Label htmlFor="message">Optional Message</Label>
                      <Textarea
                        id="message"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Let them know why you'd like to see their real identity..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowIdentityDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => identityRevealMutation.mutate()}
                        disabled={identityRevealMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {identityRevealMutation.isPending ? "Sending..." : "Send Request"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canConnect && (
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="bg-gradient-to-r from-mint via-soft-blue to-lavender text-white rounded-xl font-semibold text-sm px-6 py-2.5 hover:shadow-lg hover:shadow-mint/25 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 border-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{connectMutation.isPending ? 'Sending...' : 'Connect'}</span>
                <span className="text-xs opacity-80">(1 coin)</span>
              </Button>
            )}
            
            {isOwnPost && (
              <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                Your Post
              </Badge>
            )}
            
            {!canConnect && !isOwnPost && user?.status !== 'APPROVED' && (
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1 bg-amber-100 text-amber-700 border-amber-200">
                Approval Required
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}