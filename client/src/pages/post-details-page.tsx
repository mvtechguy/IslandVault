import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MapPin, Calendar, MessageCircle, User, Share2, Flag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function PostDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id,
  });

  const { data: likeStatus } = useQuery({
    queryKey: [`/api/posts/${id}/like-status`],
    enabled: !!id && !!user,
  });

  const { data: connectionStatus } = useQuery({
    queryKey: [`/api/connect/status/${post?.userId}`],
    enabled: !!post?.userId && !!user && post?.userId !== user?.id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/like-status`] });
      setIsLiked(!isLiked);
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/connect/request", {
        targetUserId: post?.userId,
        postId: post?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent!",
        description: "The user will be notified of your request.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/connect/status/${post?.userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send connection request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileHeader title="Post Details" showBack />
        <div className="container mx-auto p-4 max-w-4xl pb-20">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileHeader title="Post Not Found" showBack />
        <div className="container mx-auto p-4 max-w-4xl pb-20">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Post not found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This post may have been removed or doesn't exist.
              </p>
              <Link href="/browse">
                <Button>Browse Other Posts</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnPost = user?.id === post.userId;
  const canConnect = !isOwnPost && user && !connectionStatus?.connected && connectionStatus?.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileHeader title="Post Details" showBack />
      
      <div className="container mx-auto p-4 max-w-4xl pb-20">
        <Card className="overflow-hidden">
          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="relative h-64 md:h-80">
              <img
                src={post.images[0]}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex space-x-2">
                {post.isPinned && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                    Pinned
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">
                  {post.relationshipType?.toLowerCase() || 'general'}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90"
                  onClick={() => likeMutation.mutate()}
                  disabled={!user || likeMutation.isPending}
                >
                  <Heart className={`w-4 h-4 ${likeStatus?.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span className="ml-1">{post.likes || 0}</span>
                </Button>
              </div>
            </div>
          )}

          <CardContent className="p-6">
            {/* Title and Description */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {post.title}
              </h1>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* Post Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {post.ageRange && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Preferred Age: {post.ageRange}</span>
                </div>
              )}
              
              {post.location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {post.location}</span>
                </div>
              )}
            </div>

            {/* Interests */}
            {post.interests && post.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.user.profilePhotoPath} />
                  <AvatarFallback>
                    {post.user.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {post.user.fullName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{post.user.island}</span>
                    </div>
                    {post.user.dateOfBirth && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{calculateAge(post.user.dateOfBirth)} years old</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {canConnect && (
                  <Button
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="flex-1 bg-mint-600 hover:bg-mint-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {connectMutation.isPending ? 'Sending...' : 'Connect & Chat'}
                  </Button>
                )}

                {connectionStatus?.connected && (
                  <Link href="/inbox">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Chat
                    </Button>
                  </Link>
                )}

                {connectionStatus?.status === 'PENDING' && (
                  <Button disabled className="flex-1" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Request Pending
                  </Button>
                )}

                {isOwnPost && (
                  <Link href="/my-posts">
                    <Button variant="outline" className="flex-1">
                      <User className="w-4 h-4 mr-2" />
                      My Posts
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Post Meta */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}