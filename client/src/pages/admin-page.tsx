import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, FileText, Coins, MessageSquare, Check, X, Eye, Search, Filter, Palette, Save, RotateCcw, Download, Upload, Package, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeCustomizationPanel } from "@/components/ThemeCustomizationPanel";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedTopup, setSelectedTopup] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [actionNote, setActionNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [appName, setAppName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [tagline, setTagline] = useState("");
  
  // Package management states
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    coins: "",
    priceMvr: "",
    description: "",
    isActive: true,
    isPopular: false
  });
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  
  // Bank Account Management State
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);
  const [bankAccountForm, setBankAccountForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branchName: "",
    swiftCode: "",
    isActive: true,
    isPrimary: false
  });
  const [isEditingBankAccount, setIsEditingBankAccount] = useState(false);

  // Pagination states
  const [usersPage, setUsersPage] = useState(0);
  const [postsPage, setPostsPage] = useState(0);
  const [topupsPage, setTopupsPage] = useState(0);
  const [connectionsPage, setConnectionsPage] = useState(0);
  const [chatPage, setChatPage] = useState(0);
  const itemsPerPage = 10;

  // Reset pagination when status filter changes
  useEffect(() => {
    setUsersPage(0);
    setPostsPage(0);
    setTopupsPage(0);
    setConnectionsPage(0);
  }, [statusFilter]);

  // Fetch pending users
  const { data: usersData } = useQuery<{users: any[], total: number}>({
    queryKey: ["/api/admin/queues/users", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch pending posts
  const { data: postsData } = useQuery<{posts: any[], total: number}>({
    queryKey: ["/api/admin/queues/posts", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch pending topups
  const { data: topupsData } = useQuery<{topups: any[], total: number}>({
    queryKey: ["/api/admin/queues/topups", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch pending connection requests
  const { data: connectionsData } = useQuery<{requests: any[], total: number}>({
    queryKey: ["/api/admin/queues/connect", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch admin chat inbox
  const { data: chatInboxData } = useQuery<{conversations: any[]}>({
    queryKey: ["/api/admin/chat/inbox"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time monitoring
  });

  // Fetch conversation messages when viewing details
  const { data: conversationMessagesData } = useQuery<{messages: any[]}>({
    queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!selectedConversation && !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch telegram settings
  const { data: telegramSettings } = useQuery<{telegramBotToken: string; telegramChatId: string}>({
    queryKey: ["/api/admin/telegram/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch branding settings
  const { data: brandingSettings } = useQuery<{appName: string; logoUrl: string; primaryColor: string; tagline: string}>({
    queryKey: ["/api/admin/branding"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch coin packages
  const { data: packagesData } = useQuery<any[]>({
    queryKey: ["/api/admin/packages"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch bank accounts for admin
  const { data: bankAccountsData } = useQuery({
    queryKey: ["/api/admin/bank-accounts"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch visitor statistics
  const { data: visitorStats } = useQuery<{today: number; thisWeek: number; thisMonth: number; thisYear: number}>({
    queryKey: ["/api/admin/visitor-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 60000, // Refresh every minute
  });

  const approveUserMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/approve`, { note });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/users"] });
      setSelectedUser(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reject`, { note });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/users"] });
      setSelectedUser(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveTopupMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/topups/${id}/approve`, { note });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Topup approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/topups"] });
      setSelectedTopup(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve topup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTelegramMutation = useMutation({
    mutationFn: async (data: { telegramBotToken: string; telegramChatId: string }) => {
      const res = await apiRequest("PUT", "/api/admin/telegram/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Telegram settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update telegram settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/telegram/test");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Test message sent successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send test message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: { appName: string; logoUrl: string; primaryColor: string; tagline: string }) => {
      const res = await apiRequest("PUT", "/api/admin/branding", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "App branding updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update app branding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Package management mutations
  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/packages", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Package created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setSelectedPackage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create package",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/packages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Package updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setSelectedPackage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update package",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/packages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Package deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete package",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Populate form fields when settings are loaded
  useEffect(() => {
    if (brandingSettings) {
      setAppName(brandingSettings.appName || "");
      setLogoUrl(brandingSettings.logoUrl || "");
      setPrimaryColor(brandingSettings.primaryColor || "");
      setTagline(brandingSettings.tagline || "");
    }
  }, [brandingSettings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

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

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const pendingCounts = {
    users: usersData?.users?.filter((u: any) => u.status === 'PENDING').length || 0,
    posts: postsData?.posts?.filter((p: any) => p.status === 'PENDING').length || 0,
    topups: topupsData?.topups?.filter((t: any) => t.status === 'PENDING').length || 0,
    connections: connectionsData?.requests?.filter((c: any) => c.status === 'PENDING').length || 0,
  };

  const totalPending = Object.values(pendingCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-charcoal shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-mint" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-2">
            {totalPending > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                {totalPending} Pending
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4">
        {/* Overview Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                  <p className="text-2xl font-bold">{pendingCounts.users}</p>
                </div>
                <Users className="w-8 h-8 text-mint" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts</p>
                  <p className="text-2xl font-bold">{pendingCounts.posts}</p>
                </div>
                <FileText className="w-8 h-8 text-soft-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Topups</p>
                  <p className="text-2xl font-bold">{pendingCounts.topups}</p>
                </div>
                <Coins className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections</p>
                  <p className="text-2xl font-bold">{pendingCounts.connections}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-lavender" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="users" className="w-full">
            {/* Mobile-friendly scrollable tabs */}
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-auto p-1 space-x-1 md:grid md:grid-cols-10 md:w-full">
                <TabsTrigger value="users" className="relative whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Users
                  {pendingCounts.users > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs">
                      {pendingCounts.users}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="posts" className="relative whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Posts
                  {pendingCounts.posts > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs">
                      {pendingCounts.posts}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="topups" className="relative whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Topups
                  {pendingCounts.topups > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs">
                      {pendingCounts.topups}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="packages" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Packages
                </TabsTrigger>
                <TabsTrigger value="banks" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Banks
                </TabsTrigger>
                <TabsTrigger value="connections" className="relative whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Connect
                  {pendingCounts.connections > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs">
                      {pendingCounts.connections}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="chat-inbox" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="telegram" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Telegram
                </TabsTrigger>
                <TabsTrigger value="branding" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Brand
                </TabsTrigger>
                <TabsTrigger value="themes" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Themes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-4 mt-4 mb-4">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="users" className="space-y-4">
              {usersData?.users?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {usersData.users
                      .slice(usersPage * itemsPerPage, (usersPage + 1) * itemsPerPage)
                      .map((user: any) => (
                        <Card key={user.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user.fullName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">{user.fullName}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {calculateAge(user.dateOfBirth)} years, {user.gender} • {user.island}, {user.atoll}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                      {user.shortBio}
                                    </p>
                                  </div>
                                  <Badge className={getStatusColor(user.status)}>
                                    {user.status}
                                  </Badge>
                                </div>
                                {user.status === 'PENDING' && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedUser(user)}
                                      className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedUser(user)}
                                      className="border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedUser(user)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {usersPage * itemsPerPage + 1}-{Math.min((usersPage + 1) * itemsPerPage, usersData.users.length)} of {usersData.users.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsersPage(Math.max(0, usersPage - 1))}
                        disabled={usersPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsersPage(usersPage + 1)}
                        disabled={(usersPage + 1) * itemsPerPage >= usersData.users.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No users to review</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {postsData?.posts?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {postsData.posts
                      .slice(postsPage * itemsPerPage, (postsPage + 1) * itemsPerPage)
                      .map((post: any) => (
                        <Card key={post.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                {post.title && (
                                  <h3 className="font-semibold">{post.title}</h3>
                                )}
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {post.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge className={getStatusColor(post.status)}>
                                {post.status}
                              </Badge>
                            </div>
                            {post.status === 'PENDING' && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedPost(post)}
                                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPost(post)}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {postsPage * itemsPerPage + 1}-{Math.min((postsPage + 1) * itemsPerPage, postsData.posts.length)} of {postsData.posts.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPostsPage(Math.max(0, postsPage - 1))}
                        disabled={postsPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPostsPage(postsPage + 1)}
                        disabled={(postsPage + 1) * itemsPerPage >= postsData.posts.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No posts to review</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="topups" className="space-y-4">
              {topupsData?.topups?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {topupsData.topups
                      .slice(topupsPage * itemsPerPage, (topupsPage + 1) * itemsPerPage)
                      .map((topup: any) => (
                        <Card key={topup.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">MVR {topup.amountMvr}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Price per coin: MVR {topup.pricePerCoin}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Expected coins: {Math.floor(parseFloat(topup.amountMvr) / parseFloat(topup.pricePerCoin))}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {formatDistanceToNow(new Date(topup.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge className={getStatusColor(topup.status)}>
                                {topup.status}
                              </Badge>
                            </div>
                            {topup.status === 'PENDING' && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedTopup(topup)}
                                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTopup(topup)}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTopup(topup)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Slip
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {topupsPage * itemsPerPage + 1}-{Math.min((topupsPage + 1) * itemsPerPage, topupsData.topups.length)} of {topupsData.topups.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTopupsPage(Math.max(0, topupsPage - 1))}
                        disabled={topupsPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTopupsPage(topupsPage + 1)}
                        disabled={(topupsPage + 1) * itemsPerPage >= topupsData.topups.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No topups to review</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Coin Packages</h3>
                <Button 
                  onClick={() => {
                    setPackageForm({
                      name: "",
                      coins: "",
                      priceMvr: "",
                      description: "",
                      isActive: true,
                      isPopular: false
                    });
                    setIsEditingPackage(false);
                    setSelectedPackage(true);
                  }}
                  className="bg-mint hover:bg-mint/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </div>

              {packagesData?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packagesData.map((pkg: any) => (
                    <Card key={pkg.id} className={`relative ${pkg.isPopular ? 'border-mint' : ''}`}>
                      {pkg.isPopular && (
                        <div className="absolute -top-2 left-4">
                          <Badge className="bg-mint text-white">Most Popular</Badge>
                        </div>
                      )}
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <h4 className="font-semibold text-lg">{pkg.name}</h4>
                          <div className="text-3xl font-bold text-mint">{pkg.coins} Coins</div>
                          <div className="text-lg text-gray-600 dark:text-gray-400">MVR {parseFloat(pkg.priceMvr).toFixed(2)}</div>
                          {pkg.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.description}</p>
                          )}
                          <div className="flex justify-center">
                            <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setPackageForm({
                                name: pkg.name,
                                coins: pkg.coins.toString(),
                                priceMvr: pkg.priceMvr.toString(),
                                description: pkg.description || "",
                                isActive: pkg.isActive,
                                isPopular: pkg.isPopular
                              });
                              setIsEditingPackage(true);
                              setSelectedPackage(pkg);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete package "${pkg.name}"?`)) {
                                deletePackageMutation.mutate(pkg.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No coin packages available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Connection requests management coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="chat-inbox" className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Admin Chat Monitoring</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Monitor all user conversations for safety and policy compliance. This inbox updates in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {chatInboxData?.conversations?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {chatInboxData.conversations
                      .slice(chatPage * itemsPerPage, (chatPage + 1) * itemsPerPage)
                      .map((conv: any) => (
                        <Card key={conv.conversation.id} className="border-l-4 border-l-soft-blue">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center border-2 border-white dark:border-gray-800">
                                      <span className="text-white font-semibold text-xs">
                                        {conv.user1?.fullName?.charAt(0) || 'U'}
                                      </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender to-blush flex items-center justify-center border-2 border-white dark:border-gray-800">
                                      <span className="text-white font-semibold text-xs">
                                        {conv.user2?.fullName?.charAt(0) || 'U'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {conv.user1?.fullName} ↔ {conv.user2?.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      ID: {conv.conversation.id} • 
                                      {formatDistanceToNow(new Date(conv.conversation.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Badge variant={conv.conversation.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {conv.conversation.status}
                                  </Badge>
                                  
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        // Set selected conversation for detailed view
                                        setSelectedConversation(conv.conversation);
                                      }}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Messages
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {chatPage * itemsPerPage + 1}-{Math.min((chatPage + 1) * itemsPerPage, chatInboxData.conversations.length)} of {chatInboxData.conversations.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChatPage(Math.max(0, chatPage - 1))}
                        disabled={chatPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChatPage(chatPage + 1)}
                        disabled={(chatPage + 1) * itemsPerPage >= chatInboxData.conversations.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No conversations found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="telegram" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Telegram Bot Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      placeholder="Enter Telegram bot token"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Get your bot token from @BotFather on Telegram
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      placeholder="Enter chat ID or channel username"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Chat ID where admin notifications will be sent
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => updateTelegramMutation.mutate({
                        telegramBotToken,
                        telegramChatId
                      })}
                      disabled={updateTelegramMutation.isPending || !telegramBotToken || !telegramChatId}
                    >
                      {updateTelegramMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => testTelegramMutation.mutate()}
                      disabled={testTelegramMutation.isPending}
                    >
                      {testTelegramMutation.isPending ? "Testing..." : "Send Test Message"}
                    </Button>
                  </div>

                  {telegramSettings && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ Bot token configured: {telegramSettings.telegramBotToken ? "Yes" : "No"}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ Chat ID: {telegramSettings.telegramChatId || "Not set"}
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Notification Features</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• New user registrations</li>
                      <li>• New post submissions</li>
                      <li>• Coin top-up requests</li>
                      <li>• Connection requests</li>
                      <li>• User approval/rejection status updates</li>
                      <li>• Coin credit notifications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>App Branding & Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="appName">App Name</Label>
                    <Input
                      id="appName"
                      placeholder="Enter app name"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      This will appear in the browser tab and throughout the app
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      placeholder="Enter app tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      A short description that appears on the landing page
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      placeholder="Enter logo image URL"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      URL to your logo image (recommended: 200x200px, PNG or SVG)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        placeholder="#10b981"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: primaryColor || "#10b981" }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Main theme color in hex format (e.g., #10b981)
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => updateBrandingMutation.mutate({
                        appName: appName || "Kaiveni",
                        logoUrl: logoUrl || "",
                        primaryColor: primaryColor || "#10b981",
                        tagline: tagline || "Find your perfect partner in paradise"
                      })}
                      disabled={updateBrandingMutation.isPending}
                    >
                      {updateBrandingMutation.isPending ? "Saving..." : "Save Branding"}
                    </Button>
                  </div>

                  {brandingSettings && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {brandingSettings.logoUrl && (
                          <img 
                            src={brandingSettings.logoUrl} 
                            alt="App Logo" 
                            className="w-12 h-12 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            Current: {brandingSettings.appName}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {brandingSettings.tagline}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Preview</h4>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-mint/10 to-soft-blue/10">
                      <div className="flex items-center space-x-3">
                        {(logoUrl || brandingSettings?.logoUrl) && (
                          <img 
                            src={logoUrl || brandingSettings?.logoUrl} 
                            alt="Logo Preview" 
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: primaryColor || brandingSettings?.primaryColor || "#10b981" }}>
                            {appName || brandingSettings?.appName || "Kaiveni"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tagline || brandingSettings?.tagline || "Find your perfect partner in paradise"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="themes" className="space-y-4">
              <ThemeCustomizationPanel />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {visitorStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-mint/10 to-mint/20 p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-mint dark:text-mint-light">
                          {visitorStats.today}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Today
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-soft-blue/10 to-soft-blue/20 p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-soft-blue dark:text-soft-blue-light">
                          {visitorStats.thisWeek}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          This Week
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-lavender/10 to-lavender/20 p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-lavender dark:text-lavender-light">
                          {visitorStats.thisMonth}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          This Month
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blush/10 to-blush/20 p-4 rounded-lg border">
                        <div className="text-2xl font-bold text-blush dark:text-blush-light">
                          {visitorStats.thisYear}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          This Year
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-mint border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      About Visitor Tracking
                    </h4>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      <li>• Tracks unique visitors by IP address</li>
                      <li>• Updates in real-time as people visit your site</li>
                      <li>• Excludes admin panel and API requests</li>
                      <li>• Privacy-friendly - no personal data stored</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* User Review Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review User: {selectedUser?.fullName}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Username:</Label>
                    <p>{selectedUser.username}</p>
                  </div>
                  <div>
                    <Label>Email:</Label>
                    <p>{selectedUser.email || "Not provided"}</p>
                  </div>
                  <div>
                    <Label>Age:</Label>
                    <p>{calculateAge(selectedUser.dateOfBirth)} years</p>
                  </div>
                  <div>
                    <Label>Gender:</Label>
                    <p>{selectedUser.gender}</p>
                  </div>
                  <div>
                    <Label>Location:</Label>
                    <p>{selectedUser.island}, {selectedUser.atoll}</p>
                  </div>
                  <div>
                    <Label>Religion:</Label>
                    <p>{selectedUser.religion || "Not specified"}</p>
                  </div>
                  <div>
                    <Label>Job/Education:</Label>
                    <p>{selectedUser.job || "Not specified"}</p>
                  </div>
                </div>
                
                {selectedUser.shortBio && (
                  <div>
                    <Label>Bio:</Label>
                    <p className="text-sm mt-1">{selectedUser.shortBio}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="adminNote">Admin Note:</Label>
                  <Textarea
                    id="adminNote"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Add a note for this action..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      rejectUserMutation.mutate({ id: selectedUser.id, note: actionNote });
                    }}
                    disabled={rejectUserMutation.isPending}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      approveUserMutation.mutate({ id: selectedUser.id, note: actionNote });
                    }}
                    disabled={approveUserMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Topup Review Modal */}
        <Dialog open={!!selectedTopup} onOpenChange={() => setSelectedTopup(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Topup: MVR {selectedTopup?.amountMvr}</DialogTitle>
            </DialogHeader>
            {selectedTopup && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Amount:</Label>
                    <p>MVR {selectedTopup.amountMvr}</p>
                  </div>
                  <div>
                    <Label>Price per coin:</Label>
                    <p>MVR {selectedTopup.pricePerCoin}</p>
                  </div>
                  <div>
                    <Label>Expected coins:</Label>
                    <p>{Math.floor(parseFloat(selectedTopup.amountMvr) / parseFloat(selectedTopup.pricePerCoin))}</p>
                  </div>
                  <div>
                    <Label>Submitted:</Label>
                    <p>{formatDistanceToNow(new Date(selectedTopup.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>

                <div>
                  <Label>Bank Slip:</Label>
                  <div className="mt-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bank slip image would be displayed here
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminNote">Admin Note:</Label>
                  <Textarea
                    id="adminNote"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Add a note for this action..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTopup(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      approveTopupMutation.mutate({ id: selectedTopup.id, note: actionNote });
                    }}
                    disabled={approveTopupMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve Topup
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Conversation Detail Modal for Admin Monitoring */}
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Admin Chat Monitoring - Conversation {selectedConversation?.id}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">Conversation Details</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Status: <Badge variant={selectedConversation.status === 'ACTIVE' ? 'default' : 'secondary'}>{selectedConversation.status}</Badge> • 
                        Created: {formatDistanceToNow(new Date(selectedConversation.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  {conversationMessagesData?.messages?.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {conversationMessagesData.messages
                        .slice()
                        .reverse()
                        .map((msgData: any) => (
                        <div key={msgData.message.id} className="flex space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {msgData.sender?.fullName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{msgData.sender?.fullName}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(msgData.message.sentAt), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                              <p className="text-sm whitespace-pre-wrap break-words">{msgData.message.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No messages in this conversation</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time admin monitoring • All messages are logged for safety
                  </p>
                  <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Package Creation/Edit Dialog */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>{isEditingPackage ? 'Edit Package' : 'Create Package'}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="packageName">Package Name</Label>
              <Input
                id="packageName"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                placeholder="e.g., Starter Package"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packageCoins">Coins</Label>
                <Input
                  id="packageCoins"
                  type="number"
                  value={packageForm.coins}
                  onChange={(e) => setPackageForm({ ...packageForm, coins: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="packagePrice">Price (MVR)</Label>
                <Input
                  id="packagePrice"
                  type="number"
                  step="0.01"
                  value={packageForm.priceMvr}
                  onChange={(e) => setPackageForm({ ...packageForm, priceMvr: e.target.value })}
                  placeholder="50.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="packageDescription">Description (Optional)</Label>
              <Textarea
                id="packageDescription"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder="Best value package for new users..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="packageActive"
                  checked={packageForm.isActive}
                  onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="packageActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="packagePopular"
                  checked={packageForm.isPopular}
                  onChange={(e) => setPackageForm({ ...packageForm, isPopular: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="packagePopular">Most Popular</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPackage(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const packageData = {
                    name: packageForm.name,
                    coins: parseInt(packageForm.coins),
                    priceMvr: parseFloat(packageForm.priceMvr),
                    description: packageForm.description || null,
                    isActive: packageForm.isActive,
                    isPopular: packageForm.isPopular
                  };

                  if (isEditingPackage && selectedPackage?.id) {
                    updatePackageMutation.mutate({ id: selectedPackage.id, data: packageData });
                  } else {
                    createPackageMutation.mutate(packageData);
                  }
                }}
                disabled={!packageForm.name || !packageForm.coins || !packageForm.priceMvr || createPackageMutation.isPending || updatePackageMutation.isPending}
                className="bg-mint hover:bg-mint/90"
              >
                {isEditingPackage ? (
                  <>
                    <Edit className="w-4 h-4 mr-1" />
                    Update Package
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Package
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
