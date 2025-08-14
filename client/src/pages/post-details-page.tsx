import { useState, useEffect } from "react";
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

interface PostDetailsData {
  id: number;
  userId: number;
  title?: string;
  description: string;
  images?: string[];
  preferences?: {
    ageMin?: number;
    ageMax?: number;
    gender?: string;
    location?: string;
    interests?: string[];
  };
  relationshipType?: string;
  status: string;
  isPinned: boolean;
  likes: number;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    island: string;
    atoll: string;
    profilePhotoPath?: string;
    shortBio?: string;
    dateOfBirth: string;
    job?: string;
    education?: string;
  };
}

export default function PostDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);

  const { data: post, isLoading } = useQuery<PostDetailsData>({
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

  useEffect(() => {
    if (likeStatus?.liked) {
      setIsLiked(true);
    }
  }, [likeStatus]);

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
      return await apiRequest("POST", "/api/connections", {
        targetUserId: post?.userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/connect/status/${post?.userId}`] });
      toast({
        title: "Connection sent!",
        description: "Your connection request has been sent.",
      });
    },
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white dark:bg-dark-navy">
        <MobileHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-warm-white dark:bg-dark-navy">
        <MobileHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Post not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">This post may have been removed or doesn't exist.</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const isOwnPost = user?.id === post.userId;
  const canConnect = user?.status === 'APPROVED' && !isOwnPost;
  const age = calculateAge(post.user.dateOfBirth);

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy pb-20">
      <MobileHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Post Details</h1>
        </div>

        {/* Main post card */}
        <Card className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-xl rounded-3xl border-0 overflow-hidden mb-6">
          {/* Post Images - 1:1 Aspect Ratio */}
          {post.images && post.images.length > 0 && (
            <div className="relative">
              {post.images.length === 1 ? (
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={post.images[0].startsWith('/uploads') ? post.images[0] : `/uploads/posts/${post.images[0]}`}
                    alt={post.title || "Post image"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-4">
                  {post.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-xl">
                      <img
                        src={image.startsWith('/uploads') ? image : `/uploads/posts/${image}`}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {index === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            +{post.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {post.isPinned && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                    ✨ Pinned
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardContent className="p-6">
            {/* Post header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-mint to-soft-blue rounded-full p-0.5">
                    <Avatar className="w-12 h-12 bg-white">
                      <AvatarImage src={post.user.profilePhotoPath} />
                      <AvatarFallback>{post.user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{post.user.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{post.user.island}, {post.user.atoll}</span>
                    <span>•</span>
                    <span>{age} years</span>
                  </div>
                </div>
              </div>
              
              {post.relationshipType && (
                <Badge variant="secondary" className="bg-lavender/10 text-lavender border-lavender/20">
                  {post.relationshipType}
                </Badge>
              )}
            </div>

            {/* Like and share actions */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                {!isOwnPost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className="flex items-center gap-2 text-gray-600 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                    <span className="font-medium">{post.likes || 0}</span>
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </div>
            </div>

            {/* Post content */}
            {post.title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 break-words">{post.title}</h2>
            )}
            
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 break-words whitespace-pre-wrap overflow-wrap-anywhere">
              {post.description}
            </div>

            {/* Preferences */}
            {post.preferences && (
              <div className="space-y-3 mb-6">
                {(post.preferences.ageMin || post.preferences.ageMax) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Age preference:</span>
                    <Badge variant="secondary" className="bg-mint/10 text-mint border-mint/20">
                      {post.preferences.ageMin}-{post.preferences.ageMax} years
                    </Badge>
                  </div>
                )}
                
                {post.preferences.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>
                    <Badge variant="secondary" className="bg-soft-blue/10 text-soft-blue border-soft-blue/20">
                      {post.preferences.location}
                    </Badge>
                  </div>
                )}
                
                {post.preferences.interests && post.preferences.interests.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Interests:</span>
                    <div className="flex flex-wrap gap-2">
                      {post.preferences.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-blush/10 text-blush border-blush/20">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User info */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">About {post.user.fullName.split(' ')[0]}</h4>
              
              <div className="space-y-2 text-sm">
                {post.user.job && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{post.user.job}</span>
                  </div>
                )}
                
                {post.user.education && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">{post.user.education}</span>
                  </div>
                )}
                
                {post.user.shortBio && (
                  <p className="text-gray-600 dark:text-gray-400 italic mt-3">
                    "{post.user.shortBio}"
                  </p>
                )}
              </div>
            </div>

            {/* Connect button */}
            {canConnect && (
              <div className="flex justify-center">
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending || (connectionStatus as any)?.connected}
                  className="bg-gradient-to-r from-mint via-soft-blue to-lavender text-white rounded-xl font-semibold px-8 py-3 hover:shadow-lg hover:shadow-mint/25 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>
                    {(connectionStatus as any)?.status === 'PENDING' ? 'Request Pending' :
                     (connectionStatus as any)?.connected ? 'Connected' :
                     connectMutation.isPending ? 'Sending...' : 'Send Connection Request'}
                  </span>
                  {!(connectionStatus as any)?.connected && (
                    <span className="text-xs opacity-80">(1 coin)</span>
                  )}
                </Button>
              </div>
            )}
            
            {isOwnPost && (
              <div className="text-center">
                <Badge variant="outline" className="px-4 py-2">
                  This is your post
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}