import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star, Sparkles } from "lucide-react";
import { QuantumCard } from "./QuantumCard";
import { QuantumButton } from "./QuantumButton";

interface QuantumProfileCardProps {
  post: {
    id: number;
    title?: string;
    description: string;
    user: {
      id: number;
      fullName: string;
      profilePhotoPath?: string;
      island?: string;
      atoll?: string;
      gender?: string;
    };
    isPinned?: boolean;
  };
  onConnect?: (userId: number, postId: number) => void;
  onLike?: (postId: number) => void;
  isLiked?: boolean;
  canConnect?: boolean;
}

export function QuantumProfileCard({ post, onConnect, onLike, isLiked = false, canConnect = true }: QuantumProfileCardProps) {
  return (
    <QuantumCard floating glow particles className="group hover:scale-[1.02] transition-all duration-500">
      <div className="p-6 space-y-6">
        {/* Header with quantum effects */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-cyan-400/50 transition-all duration-300 group-hover:ring-cyan-400">
                <AvatarImage src={post.user.profilePhotoPath ? `/api/image-proxy/${post.user.profilePhotoPath.split('/').pop()}` : undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-lg">
                  {post.user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg holo-text">
                {post.user.fullName}
              </h3>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{post.user.island}, {post.user.atoll}</span>
              </div>
            </div>
          </div>
          
          {post.isPinned && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-0 neural-pulse">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          {post.title && (
            <h4 className="font-semibold text-lg text-foreground">
              {post.title}
            </h4>
          )}
          <p className="text-muted-foreground leading-relaxed line-clamp-3">
            {post.description}
          </p>
        </div>

        {/* Quantum Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <QuantumButton
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id)}
            className={isLiked ? "text-red-400 hover:text-red-300" : "text-muted-foreground hover:text-foreground"}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            Like
          </QuantumButton>

          {canConnect && (
            <QuantumButton
              quantum
              pulse
              size="sm"
              onClick={() => onConnect?.(post.user.id, post.id)}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Connect
            </QuantumButton>
          )}
        </div>
      </div>
    </QuantumCard>
  );
}