import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, User, Check, X, Clock, Send, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useChat } from "@/hooks/useChat";

export default function InboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const { sendMessage, messages, isConnected } = useChat(selectedConversation?.conversation?.id);

  const { data: conversations, isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    retry: false,
  });

  const { data: sentRequests } = useQuery<any[]>({
    queryKey: ["/api/connect/sent"],
    enabled: !!user,
    retry: false,
  });

  const { data: receivedRequests } = useQuery<any[]>({
    queryKey: ["/api/connect/received"],
    enabled: !!user,
    retry: false,
  });

  const handleConnectionMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'approve' | 'reject' }) => {
      return await apiRequest("PUT", `/api/connect/requests/${requestId}`, { action });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? "Connection approved!" : "Connection rejected",
        description: variables.action === 'approve' 
          ? "You can now chat with this user." 
          : "The connection request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connect/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
        } catch {
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileHeader title="Inbox" />
        <div className="container mx-auto p-4 max-w-4xl pb-20">
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please sign in to view your messages and connections.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileHeader title="Inbox" />
      
      <div className="container mx-auto p-4 max-w-6xl pb-20">
        {selectedConversation ? (
          // Chat View
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedConversation.otherUser?.profilePhotoPath} />
                  <AvatarFallback>
                    {selectedConversation.otherUser?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.otherUser?.fullName}</h3>
                                     <p className="text-xs text-gray-500">
                     {isConnected ? 'Online' : 'Offline'}
                   </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col h-full p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Start your conversation!
                    </p>
                  </div>
                                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user.id
                            ? 'bg-mint-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Inbox View
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversations">Chats</TabsTrigger>
              <TabsTrigger value="received">
                Requests
                {receivedRequests?.filter((r: any) => r.status === 'PENDING').length > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                    {receivedRequests?.filter((r: any) => r.status === 'PENDING').length || 0}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Your Conversations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !conversations || conversations?.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No conversations yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Connect with people by browsing posts and sending connection requests.
                      </p>
                      <Link href="/browse">
                        <Button>Browse Posts</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations?.map((conv: any) => (
                        <div
                          key={conv.conversation.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setSelectedConversation(conv)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conv.otherUser?.profilePhotoPath} />
                            <AvatarFallback>
                              {conv.otherUser?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {conv.otherUser?.fullName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conv.lastMessage?.body || 'No messages yet'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conv.lastMessage && formatDistanceToNow(new Date(conv.lastMessage.sentAt), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Connection Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!receivedRequests || receivedRequests?.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No requests
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        You'll see connection requests from other users here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests
                        ?.filter((request: any) => request.status === 'PENDING')
                        ?.map((request: any) => (
                        <div key={request.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.requester?.profilePhotoPath} />
                            <AvatarFallback>
                              {request.requester?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {request.requester?.fullName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Wants to connect with you
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleConnectionMutation.mutate({ 
                                requestId: request.id, 
                                action: 'approve' 
                              })}
                              disabled={handleConnectionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnectionMutation.mutate({ 
                                requestId: request.id, 
                                action: 'reject' 
                              })}
                              disabled={handleConnectionMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Sent Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!sentRequests || sentRequests?.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No sent requests
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Browse posts to find people you'd like to connect with.
                      </p>
                      <Link href="/browse">
                        <Button>Browse Posts</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests?.map((request: any) => (
                        <div key={request.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.targetUser?.profilePhotoPath} />
                            <AvatarFallback>
                              {request.targetUser?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {request.targetUser?.fullName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Connection request sent
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === 'APPROVED' ? 'default' : 
                              request.status === 'REJECTED' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}