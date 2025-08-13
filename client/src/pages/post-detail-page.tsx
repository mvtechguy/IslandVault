import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, Calendar, Coins, ArrowLeft, User, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateAge } from "@/lib/utils";

interface PostDetailUser {
  id: number;
  fullName: string;
  island: string;
  atoll: string;
  profilePhotoPath?: string;
  shortBio?: string;
  dateOfBirth: string;
  job?: string;
  education?: string;
}

interface PostDetail {
  id: number;
  title: string;
  description: string;
  aboutYourself?: string;
  lookingFor?: string;
  ageRange?: string;
  interests?: string[];
  budgetRange?: string;
  timeline?: string;
  relationshipType: string;
  images: string[];
  likes: number;
  isPinned: boolean;
  createdAt: string;
  user: PostDetailUser;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: post, isLoading, error } = useQuery<PostDetail>({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id
  });

  const { data: user } = useQuery<{ id: number; role: string }>({
    queryKey: ["/api/me"],
    retry: false
  });

  const { data: hasLiked } = useQuery<boolean>({
    queryKey: [`/api/posts/${id}/like-status`],
    enabled: !!user && !!id
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/posts/${id}/like`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post liked!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive"
      });
    }
  });

  const requestConnectionMutation = useMutation({
    mutationFn: () => apiRequest("/api/connection-requests", "POST", { 
      targetUserId: post?.user.id 
    }),
    onSuccess: () => {
      toast({ title: "Connection request sent!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Post not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This post may have been deleted or doesn't exist.
            </p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {post.isPinned && (
          <Badge variant="secondary" className="bg-mint-100 text-mint-800 dark:bg-mint-800 dark:text-mint-100">
            <Coins className="w-3 h-3 mr-1" />
            Pinned Post
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Post Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {post.title}
                </h1>
                <div className="flex items-center space-x-2">
                  {user && post && user.id !== post.user.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => likeMutation.mutate()}
                      disabled={likeMutation.isPending}
                      className={hasLiked ? "bg-rose-50 text-rose-600 border-rose-200" : ""}
                    >
                      <Heart
                        className={`w-4 h-4 mr-1 ${
                          hasLiked ? "fill-rose-600 text-rose-600" : ""
                        }`}
                      />
                      {post.likes || 0}
                    </Button>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {post.relationshipType?.toLowerCase() || 'general'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.images.map((image, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {post.description}
                </p>
              </div>

              {/* About Yourself */}
              {post.aboutYourself && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    About Myself
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {post.aboutYourself}
                  </p>
                </div>
              )}

              {/* Looking For */}
              {post.lookingFor && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    What I'm Looking For
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {post.lookingFor}
                  </p>
                </div>
              )}

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.ageRange && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 text-soft-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Age Range</p>
                      <p className="font-medium text-gray-900 dark:text-white">{post.ageRange}</p>
                    </div>
                  </div>
                )}
                
                {post.budgetRange && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Coins className="w-4 h-4 text-mint-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                      <p className="font-medium text-gray-900 dark:text-white">{post.budgetRange}</p>
                    </div>
                  </div>
                )}

                {post.timeline && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 text-lavender-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Timeline</p>
                      <p className="font-medium text-gray-900 dark:text-white">{post.timeline}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              {post.interests && post.interests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="bg-mint-100 text-mint-800 dark:bg-mint-800 dark:text-mint-100">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={post.user.profilePhotoPath} />
                  <AvatarFallback className="text-lg">
                    {post.user.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {post.user.fullName}
                  </h3>
                  {post.user.dateOfBirth && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {calculateAge(post.user.dateOfBirth)} years old
                    </p>
                  )}
                </div>
              </div>

              {post.user.shortBio && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  {post.user.shortBio}
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-soft-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {post.user.island}, {post.user.atoll}
                  </span>
                </div>

                {post.user.job && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-mint-600" />
                    <span className="text-gray-600 dark:text-gray-400">{post.user.job}</span>
                  </div>
                )}

                {post.user.education && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-lavender-600" />
                    <span className="text-gray-600 dark:text-gray-400">{post.user.education}</span>
                  </div>
                )}
              </div>

              {user && post && user.id !== post.user.id && (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-mint-600 hover:bg-mint-700 text-white"
                    onClick={() => requestConnectionMutation.mutate()}
                    disabled={requestConnectionMutation.isPending}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Connection Request
                  </Button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Connection requests cost 1 coin
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Meta */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Post Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Posted:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Likes:</span>
                  <span className="text-gray-900 dark:text-white">{post.likes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {post.relationshipType?.toLowerCase() || 'general'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}