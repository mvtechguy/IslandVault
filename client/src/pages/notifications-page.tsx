import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Bell, 
  Check, 
  Heart, 
  MessageCircle, 
  User, 
  Shield, 
  Eye, 
  Image,
  CheckCheck,
  X,
  Clock,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertCircle,
  Coins,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  userId: number;
  type: string;
  data: any;
  seen: boolean;
  createdAt: string;
}

// Notification categories for better organization
const getNotificationCategory = (type: string) => {
  if (['CONNECTION_REQUEST_RECEIVED', 'CONNECTION_REQUEST_APPROVED', 'CONNECTION_REQUEST_REJECTED'].includes(type)) {
    return 'connections';
  }
  if (['POST_LIKED', 'POST_APPROVED', 'POST_REJECTED', 'POST_HIDDEN', 'POST_DELETED', 'POST_PIN_REQUEST'].includes(type)) {
    return 'posts';
  }
  if (['TOPUP_APPROVED', 'TOPUP_REJECTED', 'COINS_ADDED', 'COINS_REMOVED'].includes(type)) {
    return 'coins';
  }
  if (['IDENTITY_REVEAL_REQUEST', 'IMAGE_REVEAL_REQUEST'].includes(type)) {
    return 'privacy';
  }
  if (['PROFILE_APPROVED', 'PROFILE_REJECTED', 'PASSWORD_CHANGED'].includes(type)) {
    return 'account';
  }
  return 'other';
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'POST_LIKED':
      return <Heart className="w-5 h-5 text-rose-500" />;
    case 'CONNECTION_REQUEST_RECEIVED':
    case 'CONNECTION_REQUEST_APPROVED':
    case 'CONNECTION_REQUEST_REJECTED':
      return <MessageCircle className="w-5 h-5 text-soft-blue" />;
    case 'IDENTITY_REVEAL_REQUEST':
    case 'IMAGE_REVEAL_REQUEST':
      return <Eye className="w-5 h-5 text-lavender" />;
    case 'PROFILE_APPROVED':
    case 'PROFILE_REJECTED':
      return <Shield className="w-5 h-5 text-mint" />;
    case 'POST_APPROVED':
    case 'POST_REJECTED':
    case 'POST_HIDDEN':
    case 'POST_DELETED':
    case 'POST_PIN_REQUEST':
      return <FileText className="w-5 h-5 text-mint" />;
    case 'TOPUP_APPROVED':
    case 'TOPUP_REJECTED':
    case 'COINS_ADDED':
    case 'COINS_REMOVED':
      return <Coins className="w-5 h-5 text-green-500" />;
    case 'PASSWORD_CHANGED':
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationTitle = (notification: Notification) => {
  const { type, data } = notification;
  
  switch (type) {
    case 'POST_LIKED':
      return `${data?.likerName || 'Someone'} liked your post`;
    case 'CONNECTION_REQUEST_RECEIVED':
      return `New connection request from ${data?.requesterName || 'someone'}`;
    case 'CONNECTION_REQUEST_APPROVED':
      return `${data?.targetName || 'Someone'} accepted your connection request`;
    case 'CONNECTION_REQUEST_REJECTED':
      return `${data?.targetName || 'Someone'} declined your connection request`;
    case 'IDENTITY_REVEAL_REQUEST':
      return `${data?.requesterName || 'Someone'} wants to see your real identity`;
    case 'IMAGE_REVEAL_REQUEST':
      return `${data?.requesterName || 'Someone'} wants to see more images`;
    case 'PROFILE_APPROVED':
      return 'Profile approved!';
    case 'PROFILE_REJECTED':
      return 'Profile rejected';
    case 'POST_APPROVED':
      return 'Post approved';
    case 'POST_REJECTED':
      return 'Post rejected';
    case 'TOPUP_APPROVED':
      return 'Coin top-up approved';
    case 'TOPUP_REJECTED':
      return 'Coin top-up rejected';
    default:
      return 'New notification';
  }
};

const getNotificationDescription = (notification: Notification) => {
  const { type, data } = notification;
  
  switch (type) {
    case 'POST_LIKED':
      return `${data?.likerName || 'Someone'} liked "${data?.postTitle || 'your post'}"`;
    case 'CONNECTION_REQUEST_RECEIVED':
      return data?.postTitle ? `For your post: "${data.postTitle}"` : 'Someone wants to connect with you';
    case 'CONNECTION_REQUEST_APPROVED':
      return 'You can now start chatting together!';
    case 'CONNECTION_REQUEST_REJECTED':
      return 'Your connection request was not accepted';
    case 'IDENTITY_REVEAL_REQUEST':
      return data?.message ? `Message: "${data.message}"` : 'They want to know who you really are';
    case 'IMAGE_REVEAL_REQUEST':
      return data?.message ? `Message: "${data.message}"` : 'They want to see more of your photos';
    case 'PROFILE_APPROVED':
      return 'Welcome to Kaiveni! You can now create posts and connect with others.';
    case 'PROFILE_REJECTED':
      return data?.note || 'Please update your profile and try again.';
    case 'POST_APPROVED':
      return 'Your post is now visible to other users.';
    case 'POST_REJECTED':
      return data?.note || 'Your post needs some adjustments.';
    case 'TOPUP_APPROVED':
      return `${data?.coins || 0} coins have been added to your account.`;
    case 'TOPUP_REJECTED':
      return data?.note || 'There was an issue with your payment slip.';
    default:
      return 'You have a new notification';
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<'all' | 'connections' | 'posts' | 'coins' | 'privacy' | 'account' | 'other'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsSeenMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('POST', `/api/notifications/${notificationId}/mark-seen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsSeenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/notifications/mark-all-seen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notification dismissed",
        description: "The notification has been removed.",
      });
    },
  });

  // Filter and categorize notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSeenFilter = filter === 'unread' ? !notification.seen : true;
    const matchesCategoryFilter = category === 'all' ? true : getNotificationCategory(notification.type) === category;
    return matchesSeenFilter && matchesCategoryFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + notificationsPerPage);

  const unreadCount = notifications.filter(n => !n.seen).length;

  // Function to handle notification click and navigation
  const handleNotificationClick = (notification: Notification) => {
    // Mark as seen if not already
    if (!notification.seen) {
      markAsSeenMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const { type, data } = notification;
    switch (type) {
      case 'POST_LIKED':
      case 'POST_APPROVED':
      case 'POST_REJECTED':
        if (data?.postId) {
          setLocation(`/posts/${data.postId}`);
        }
        break;
      case 'CONNECTION_REQUEST_RECEIVED':
      case 'CONNECTION_REQUEST_APPROVED':
        setLocation('/inbox');
        break;
      case 'TOPUP_APPROVED':
      case 'TOPUP_REJECTED':
      case 'COINS_ADDED':
      case 'COINS_REMOVED':
        setLocation('/coins');
        break;
      case 'PROFILE_APPROVED':
      case 'PROFILE_REJECTED':
        setLocation('/profile');
        break;
      default:
        // Keep on notifications page for other types
        break;
    }
  };

  // Categories with counts
  const categoryCounts = {
    all: filteredNotifications.length,
    connections: notifications.filter(n => getNotificationCategory(n.type) === 'connections').length,
    posts: notifications.filter(n => getNotificationCategory(n.type) === 'posts').length,
    coins: notifications.filter(n => getNotificationCategory(n.type) === 'coins').length,
    privacy: notifications.filter(n => getNotificationCategory(n.type) === 'privacy').length,
    account: notifications.filter(n => getNotificationCategory(n.type) === 'account').length,
    other: notifications.filter(n => getNotificationCategory(n.type) === 'other').length,
  };

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy">
      <MobileHeader title="Notifications" showBack />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
              }}
              className={filter === 'all' ? 'bg-mint hover:bg-mint/80' : ''}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter('unread');
                setCurrentPage(1);
              }}
              className={filter === 'unread' ? 'bg-mint hover:bg-mint/80' : ''}
            >
              Unread ({unreadCount})
            </Button>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsSeenMutation.mutate()}
              disabled={markAllAsSeenMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={(value: any) => {
          setCategory(value);
          setCurrentPage(1);
        }} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="connections" className="text-xs">
              Connections ({categoryCounts.connections})
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs">
              Posts ({categoryCounts.posts})
            </TabsTrigger>
            <TabsTrigger value="coins" className="text-xs">
              Coins ({categoryCounts.coins})
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">
              Privacy ({categoryCounts.privacy})
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs">
              Account ({categoryCounts.account})
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs">
              Other ({categoryCounts.other})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-charcoal rounded-2xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedNotifications.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.seen 
                      ? 'bg-gradient-to-r from-mint/5 via-white to-soft-blue/5 dark:from-mint/10 dark:via-charcoal dark:to-soft-blue/10 border-mint/20' 
                      : 'bg-white dark:bg-charcoal'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        !notification.seen 
                          ? 'bg-gradient-to-br from-mint/20 to-soft-blue/20' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold ${
                              !notification.seen 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {getNotificationTitle(notification)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                              {getNotificationDescription(notification)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-2">
                            {!notification.seen && (
                              <Badge className="bg-blush text-white text-xs px-2 py-1">
                                New
                              </Badge>
                            )}
                            
                            {/* Dismiss Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6 text-gray-400 hover:text-red-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Dismiss notification?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This notification will be permanently removed. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Dismiss
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Showing {startIndex + 1}-{Math.min(startIndex + notificationsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {category !== 'all' ? `No ${category} notifications` : (filter === 'unread' ? 'No unread notifications' : 'No notifications yet')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {category !== 'all' 
                ? `No ${category} related notifications found.`
                : (filter === 'unread' 
                  ? 'All caught up! You have no unread notifications.'
                  : 'When someone likes your posts, sends connection requests, or admin updates happen, you\'ll see them here.'
                )
              }
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}