import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, MessageCircle, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    };
  };
}

export function UserCard({ post }: UserCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);

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

  const age = calculateAge(post.user.dateOfBirth);

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
            <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">{post.user.fullName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="w-4 h-4 text-mint" />
              <span className="font-medium">{post.user.island}, {post.user.atoll}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="font-medium">{age} years</span>
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

        {/* Enhanced Multiple Images Display */}
        {post.images && Array.isArray(post.images) && post.images.length > 0 && (
          <div className="mb-4">
            {post.images.length === 1 ? (
              <div className="relative group">
                <img
                  src={post.images[0].startsWith('/uploads') ? post.images[0] : `/uploads/posts/${post.images[0]}`}
                  alt="Post image"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : post.images.length === 2 ? (
              <div className="grid grid-cols-2 gap-3">
                {post.images.slice(0, 2).map((image: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.startsWith('/uploads') ? image : `/uploads/posts/${image}`}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {post.images.slice(0, 3).map((image: string, index: number) => (
                  <div key={index} className={`relative group ${index === 0 ? 'col-span-2' : ''}`}>
                    <img
                      src={image.startsWith('/uploads') ? image : `/uploads/posts/${image}`}
                      alt={`Post image ${index + 1}`}
                      className={`w-full object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300 ${
                        index === 0 ? 'h-40' : 'h-28'
                      }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {index === 2 && post.images.length > 3 && (
                      <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          +{post.images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
          </div>

          <div className="flex items-center space-x-3">
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