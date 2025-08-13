import { Heart, MapPin, MessageCircle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { calculateAge } from "@/lib/utils";

interface UserCardProps {
  post: {
    id: number;
    title?: string;
    description: string;
    images?: string[];
    preferences?: any;
    createdAt: string;
    isPinned?: boolean;
    likes?: number;
    relationshipType?: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/connection-requests", {
        targetUserId: post.user.id,
        postId: post.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent!",
        description: "Your request is now pending admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      toast({ title: "Post liked!" });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive"
      });
    }
  });

  const age = calculateAge(post.user.dateOfBirth);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const isOwnPost = user?.id === post.user.id;
  const canConnect = user?.status === 'APPROVED' && !isOwnPost;

  return (
    <div className="bg-white dark:bg-charcoal rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative">
        {/* Cover image placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-mint/20 to-soft-blue/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-mint to-soft-blue rounded-full mx-auto mb-2 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kaiveni</p>
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          {post.user.profilePhotoPath ? (
            <img
              src={post.user.profilePhotoPath}
              alt="Profile"
              className="w-16 h-16 rounded-2xl border-4 border-white dark:border-charcoal object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-charcoal bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {post.user.fullName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium text-gray-800 dark:text-gray-200">
            {timeAgo}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{post.user.fullName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{age} years old</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{post.user.island}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {post.user.atoll}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {post.description}
        </p>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            {post.images.length === 1 ? (
              <img
                src={post.images[0]}
                alt="Post image"
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    {index === 3 && post.images!.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          +{post.images!.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {post.user.shortBio && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
            "{post.user.shortBio}"
          </p>
        )}

        {post.preferences && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.preferences.ageRange && (
              <Badge variant="secondary" className="text-xs">
                Age: {post.preferences.ageRange.min}-{post.preferences.ageRange.max}
              </Badge>
            )}
            {post.preferences.gender && (
              <Badge variant="secondary" className="text-xs">
                Seeking: {post.preferences.gender}
              </Badge>
            )}
            {post.preferences.religion && (
              <Badge variant="secondary" className="text-xs">
                {post.preferences.religion}
              </Badge>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {!isOwnPost && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="flex items-center space-x-1 text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 p-1 min-w-fit"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{post.likes || 0}</span>
                </Button>
              )}
              
              <Link href={`/posts/${post.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-mint dark:text-gray-400 dark:hover:text-mint text-sm"
                >
                  View Details
                </Button>
              </Link>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {post.preferences?.notes && (
                <span>{post.preferences.notes}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            {canConnect && (
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-mint to-soft-blue text-white rounded-xl font-medium text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <MessageCircle className="w-3 h-3" />
                <span>{connectMutation.isPending ? 'Sending...' : 'Connect'}</span>
                <span className="text-xs opacity-75">(1 coin)</span>
              </Button>
            )}
            {isOwnPost && (
              <Badge variant="outline" className="text-xs">
                Your Post
              </Badge>
            )}
            {!canConnect && !isOwnPost && user?.status !== 'APPROVED' && (
              <Badge variant="secondary" className="text-xs">
                Profile approval required
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
