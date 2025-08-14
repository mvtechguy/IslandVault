import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, FileText, Coins, MessageSquare, Check, X, Eye, Search, Filter, Palette, Save, RotateCcw, Download, Upload, Package, Plus, Edit, Trash2, Landmark, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
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
    swiftCode: "",
    isActive: true,
    isPrimary: false
  });
  const [bankAccountErrors, setBankAccountErrors] = useState({
    bankName: "",
    accountNumber: "",
    accountName: ""
  });
  const [isEditingBankAccount, setIsEditingBankAccount] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);

  // Banner Management State
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    buttonText: "",
    status: "ACTIVE",
    orderIndex: 0,
    isVisible: true,
    startDate: "",
    endDate: ""
  });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);

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
  const { data: usersData, refetch: refetchUsers } = useQuery<{users: any[], total: number}>({
    queryKey: ["/api/admin/queues/users", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch pending posts
  const { data: postsData, refetch: refetchPosts } = useQuery<{posts: any[], total: number}>({
    queryKey: ["/api/admin/queues/posts", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 4000, // Auto-refresh every 4 seconds
  });

  // Fetch pending topups
  const { data: topupsData, refetch: refetchTopups } = useQuery<{topups: any[], total: number}>({
    queryKey: ["/api/admin/queues/topups", statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 6000, // Auto-refresh every 6 seconds
  });

  // Fetch pending connection requests
  const { data: connectionsData, refetch: refetchConnections } = useQuery<{requests: any[], total: number}>({
    queryKey: ["/api/admin/queues/connect/" + statusFilter],
    queryFn: getQueryFn({ 
      on401: "throw"
    }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
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
  const { data: banksData } = useQuery({
    queryKey: ["/api/admin/bank-accounts"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && (user.role === "ADMIN" || user.role === "SUPERADMIN"),
  });

  // Fetch banners for admin
  const { data: bannersData } = useQuery<any[]>({
    queryKey: ["/api/admin/banners"],
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

  const approvePostMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/posts/${id}/approve`, { note });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Post approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/posts"] });
      setSelectedPost(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectPostMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/admin/posts/${id}/reject`, { note });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Post rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queues/posts"] });
      setSelectedPost(null);
      setActionNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject post",
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

  // Banner management mutations
  const createBannerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/banners", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Banner created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setShowAddBanner(false);
      setBannerForm({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        buttonText: "",
        status: "ACTIVE",
        orderIndex: 0,
        isVisible: true,
        startDate: "",
        endDate: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/banners/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Banner updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsEditingBanner(false);
      setSelectedBanner(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update banner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/banners/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Banner deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setSelectedBanner(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete banner",
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

  // Bank account handlers
  const handleAddBank = () => {
    setSelectedBankAccount(null);
    setBankAccountForm({
      bankName: "",
      accountNumber: "",
      accountName: "",
      branchName: "",
      swiftCode: "",
      isActive: true,
      isPrimary: false
    });
    setIsEditingBankAccount(false);
    setShowAddBank(true);
  };

  const handleEditBank = (bank: any) => {
    setSelectedBankAccount(bank);
    setBankAccountForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      branchName: bank.branchName,
      swiftCode: bank.swiftCode || "",
      isActive: bank.isActive,
      isPrimary: bank.isPrimary
    });
    setIsEditingBankAccount(true);
    setShowAddBank(true);
  };

  const handleDeleteBank = async (bankId: number) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      try {
        await apiRequest("/api/admin/bank-accounts/" + bankId, { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
        toast({ title: "Bank account deleted successfully" });
      } catch (error) {
        toast({ title: "Failed to delete bank account", variant: "destructive" });
      }
    }
  };

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
              <TabsList className="inline-flex h-auto p-1 space-x-1 md:grid md:grid-cols-11 md:w-full">
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
                <TabsTrigger value="banners" className="whitespace-nowrap px-3 py-2 text-xs md:text-sm">
                  Banners
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
              {usersData?.users && usersData.users.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {usersData?.users
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
                      Showing {usersPage * itemsPerPage + 1}-{Math.min((usersPage + 1) * itemsPerPage, usersData?.users?.length || 0)} of {usersData?.users?.length || 0}
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
                        disabled={(usersPage + 1) * itemsPerPage >= (usersData?.users?.length || 0)}
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
                    {postsData?.posts
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
                      Showing {postsPage * itemsPerPage + 1}-{Math.min((postsPage + 1) * itemsPerPage, postsData?.posts?.length || 0)} of {postsData?.posts?.length || 0}
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
                        disabled={(postsPage + 1) * itemsPerPage >= (postsData?.posts?.length || 0)}
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
                    {topupsData?.topups
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
                      Showing {topupsPage * itemsPerPage + 1}-{Math.min((topupsPage + 1) * itemsPerPage, topupsData?.topups?.length || 0)} of {topupsData?.topups?.length || 0}
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
                        disabled={(topupsPage + 1) * itemsPerPage >= (topupsData?.topups?.length || 0)}
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
              {connectionsData?.requests && connectionsData.requests.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {connectionsData?.requests
                      .slice(connectionsPage * itemsPerPage, (connectionsPage + 1) * itemsPerPage)
                      .map((request: any) => (
                        <Card key={request.id} className="border-l-4 border-l-mint">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                      {request.requesterName?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {request.requesterName || 'Unknown User'}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Wants to connect with {request.targetUserName || 'Unknown User'}
                                    </p>
                                    {request.postId && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Post ID: {request.postId}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={request.status === 'PENDING' ? 'secondary' : request.status === 'APPROVED' ? 'default' : 'destructive'}>
                                    {request.status}
                                  </Badge>
                                  {request.adminNote && (
                                    <span className="text-xs text-gray-500">Note: {request.adminNote}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {request.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedConnection(request);
                                        setShowConnectionDetails(true);
                                      }}
                                      variant="outline"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Review
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedConnection(request);
                                    setShowConnectionDetails(true);
                                  }}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                  
                  {/* Pagination for connections */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {connectionsPage * itemsPerPage + 1} to {Math.min((connectionsPage + 1) * itemsPerPage, connectionsData?.total || 0)} of {connectionsData?.total || 0} requests
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectionsPage(Math.max(0, connectionsPage - 1))}
                        disabled={connectionsPage === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConnectionsPage(connectionsPage + 1)}
                        disabled={(connectionsPage + 1) * itemsPerPage >= (connectionsData?.total || 0)}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No connection requests found</p>
                </div>
              )}
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

              {chatInboxData?.conversations && chatInboxData.conversations.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {chatInboxData?.conversations
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
                      Showing {chatPage * itemsPerPage + 1}-{Math.min((chatPage + 1) * itemsPerPage, chatInboxData?.conversations?.length || 0)} of {chatInboxData?.conversations?.length || 0}
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
                        disabled={(chatPage + 1) * itemsPerPage >= (chatInboxData?.conversations?.length || 0)}
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

            <TabsContent value="banks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Account Management</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage bank accounts for coin top-up payments
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Bank Accounts</h3>
                    <Button onClick={handleAddBank}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bank Details
                    </Button>
                  </div>
                  
                  {banksData && banksData.length > 0 ? (
                    <div className="space-y-3">
                      {banksData.map((bank) => (
                        <Card key={bank.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-medium">{bank.bankName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {bank.accountName}
                              </p>
                              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                {bank.accountNumber}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBank(bank)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBank(bank.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Landmark className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">No bank accounts configured</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Add bank details for users to send coin top-up payments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banners" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Banner Management</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage promotional banners displayed on the home page
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Active Banners</h3>
                    <Button onClick={() => setShowAddBanner(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Banner
                    </Button>
                  </div>
                  
                  {bannersData && bannersData.length > 0 ? (
                    <div className="space-y-3">
                      {bannersData.map((banner) => (
                        <Card key={banner.id} className="p-4">
                          <div className="flex items-start space-x-4">
                            {banner.imageUrl && (
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {banner.title}
                                  </h4>
                                  {banner.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {banner.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Badge variant={banner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                      {banner.status}
                                    </Badge>
                                    <span>•</span>
                                    <span>Order: {banner.orderIndex}</span>
                                    <span>•</span>
                                    <span>{banner.clickCount || 0} clicks</span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBanner(banner);
                                      setBannerForm({
                                        title: banner.title,
                                        description: banner.description || "",
                                        imageUrl: banner.imageUrl,
                                        linkUrl: banner.linkUrl || "",
                                        buttonText: banner.buttonText || "",
                                        status: banner.status,
                                        orderIndex: banner.orderIndex,
                                        isVisible: banner.isVisible,
                                        startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : "",
                                        endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : ""
                                      });
                                      setIsEditingBanner(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this banner?")) {
                                        deleteBannerMutation.mutate(banner.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">No banners created</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Create promotional banners to display on the home page
                      </p>
                    </div>
                  )}
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

        {/* Add/Edit Banner Dialog */}
        {(showAddBanner || isEditingBanner) && (
          <Dialog open={showAddBanner || isEditingBanner} onOpenChange={(open) => {
            if (!open) {
              setShowAddBanner(false);
              setIsEditingBanner(false);
              setSelectedBanner(null);
              setBannerForm({
                title: "",
                description: "",
                imageUrl: "",
                linkUrl: "",
                buttonText: "",
                status: "ACTIVE",
                orderIndex: 0,
                isVisible: true,
                startDate: "",
                endDate: ""
              });
            }
          }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {isEditingBanner ? 'Edit Banner' : 'Add Banner'}
                </DialogTitle>
                <DialogDescription>
                  Create promotional banners for the home page
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="banner-title">Title *</Label>
                  <Input
                    id="banner-title"
                    placeholder="Enter banner title"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="banner-description">Description</Label>
                  <Textarea
                    id="banner-description"
                    placeholder="Enter banner description"
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="banner-image">Image URL *</Label>
                  <Input
                    id="banner-image"
                    placeholder="Enter image URL"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="banner-link">Link URL</Label>
                  <Input
                    id="banner-link"
                    placeholder="Enter link URL (optional)"
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="banner-button">Button Text</Label>
                  <Input
                    id="banner-button"
                    placeholder="Enter button text (optional)"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, buttonText: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banner-status">Status</Label>
                    <Select value={bannerForm.status} onValueChange={(value) => setBannerForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-order">Order Index</Label>
                    <Input
                      id="banner-order"
                      type="number"
                      placeholder="0"
                      value={bannerForm.orderIndex}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banner-start">Start Date</Label>
                    <Input
                      id="banner-start"
                      type="date"
                      value={bannerForm.startDate}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-end">End Date</Label>
                    <Input
                      id="banner-end"
                      type="date"
                      value={bannerForm.endDate}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowAddBanner(false);
                  setIsEditingBanner(false);
                  setSelectedBanner(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (!bannerForm.title || !bannerForm.imageUrl) {
                    toast({
                      title: "Missing required fields",
                      description: "Title and Image URL are required",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const formData = {
                    ...bannerForm,
                    startDate: bannerForm.startDate ? new Date(bannerForm.startDate).toISOString() : null,
                    endDate: bannerForm.endDate ? new Date(bannerForm.endDate).toISOString() : null
                  };
                  
                  if (isEditingBanner && selectedBanner) {
                    updateBannerMutation.mutate({ id: selectedBanner.id, data: formData });
                  } else {
                    createBannerMutation.mutate(formData);
                  }
                }}>
                  {isEditingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* User Review Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg" aria-labelledby="user-review-title" aria-describedby="user-review-desc">
            <DialogHeader>
              <DialogTitle id="user-review-title">Review User: {selectedUser?.fullName}</DialogTitle>
              <DialogDescription id="user-review-desc">
                Review and approve or reject this user's registration request.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  {selectedUser.profilePhotoPath ? (
                    <img
                      src={selectedUser.profilePhotoPath.startsWith('http') 
                        ? selectedUser.profilePhotoPath 
                        : `/uploads/profiles/${selectedUser.profilePhotoPath}`}
                      alt={`${selectedUser.fullName}'s profile`}
                      className="w-24 h-24 object-cover rounded-full border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = '/uploads/profiles/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-mint to-soft-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Real Information Section */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700 dark:text-green-400">
                      🔒 Real Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Full Name:</Label>
                        <p className="font-medium">{selectedUser.fullName}</p>
                      </div>
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
                        <Label>Phone:</Label>
                        <p>{selectedUser.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <Label>Identity Status:</Label>
                        <p className={selectedUser.useRealIdentity !== false ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                          {selectedUser.useRealIdentity !== false ? "Using Real Identity" : "Using Fake Identity"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fake Information Section */}
                {selectedUser.useRealIdentity === false && (selectedUser.fakeFullName || selectedUser.fakeAge || selectedUser.fakeIsland) && (
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
                        🎭 Fake Identity (What Others See)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Fake Name:</Label>
                          <p className="font-medium">{selectedUser.fakeFullName || "Not set"}</p>
                        </div>
                        <div>
                          <Label>Fake Age:</Label>
                          <p>{selectedUser.fakeAge || "Not set"}</p>
                        </div>
                        <div>
                          <Label>Fake Location:</Label>
                          <p>{selectedUser.fakeIsland && selectedUser.fakeAtoll ? `${selectedUser.fakeIsland}, ${selectedUser.fakeAtoll}` : "Not set"}</p>
                        </div>
                        <div>
                          <Label>Profile Visibility:</Label>
                          <p className="text-orange-600 font-medium">Others see fake details</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Information Section */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
                      📋 Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Religion:</Label>
                        <p>{selectedUser.religion || "Not specified"}</p>
                      </div>
                      <div>
                        <Label>Job/Education:</Label>
                        <p>{selectedUser.job || "Not specified"}</p>
                      </div>
                      <div>
                        <Label>Registration Date:</Label>
                        <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label>Account Status:</Label>
                        <Badge className={getStatusColor(selectedUser.status)}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                    </div>
                    {selectedUser.shortBio && (
                      <div className="mt-4">
                        <Label>Bio:</Label>
                        <p className="text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedUser.shortBio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>


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

        {/* Post Review Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-labelledby="post-review-title" aria-describedby="post-review-desc">
            <DialogHeader>
              <DialogTitle id="post-review-title">Review Post</DialogTitle>
              <DialogDescription id="post-review-desc">
                Review and moderate this post for approval or rejection.
              </DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-6">
                {/* Post Details */}
                <div className="space-y-4">
                  <div>
                    <Label>Title:</Label>
                    <h3 className="text-lg font-semibold mt-1">{selectedPost.title || "No title"}</h3>
                  </div>
                  
                  <div>
                    <Label>Description:</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{selectedPost.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Posted by:</Label>
                      <p>{selectedPost.user?.fullName || "Unknown user"}</p>
                    </div>
                    <div>
                      <Label>Submitted:</Label>
                      <p>{formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>

                  {/* Partner Preferences */}
                  {selectedPost.preferences && (
                    <div>
                      <Label>Partner Preferences:</Label>
                      <div className="mt-2 space-y-2 text-sm">
                        {selectedPost.preferences.ageMin && selectedPost.preferences.ageMax && (
                          <p><strong>Age:</strong> {selectedPost.preferences.ageMin}-{selectedPost.preferences.ageMax} years</p>
                        )}
                        {selectedPost.preferences.gender && (
                          <p><strong>Gender:</strong> {selectedPost.preferences.gender}</p>
                        )}
                        {selectedPost.preferences.notes && (
                          <p><strong>Additional Notes:</strong> {selectedPost.preferences.notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Images */}
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div>
                    <Label>Images ({selectedPost.images.length}):</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {selectedPost.images.map((imageUrl: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-sm';
                                placeholder.textContent = 'Failed to load image';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="postAdminNote">Admin Note:</Label>
                  <Textarea
                    id="postAdminNote"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Add a note for this action..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPost(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      rejectPostMutation.mutate({ id: selectedPost.id, note: actionNote });
                    }}
                    disabled={rejectPostMutation.isPending}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject Post
                  </Button>
                  <Button
                    onClick={() => {
                      approvePostMutation.mutate({ id: selectedPost.id, note: actionNote });
                    }}
                    disabled={approvePostMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve Post
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Topup Review Modal */}
        <Dialog open={!!selectedTopup} onOpenChange={() => setSelectedTopup(null)}>
          <DialogContent className="max-w-lg" aria-labelledby="topup-review-title" aria-describedby="topup-review-desc">
            <DialogHeader>
              <DialogTitle id="topup-review-title">Review Topup: MVR {selectedTopup?.amountMvr}</DialogTitle>
              <DialogDescription id="topup-review-desc">
                Review the payment slip and approve or reject this coin topup request.
              </DialogDescription>
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
                  {selectedTopup.slipPath ? (
                    <div className="mt-2">
                      <img
                        src={selectedTopup.slipPath.startsWith('http') 
                          ? selectedTopup.slipPath 
                          : selectedTopup.slipPath.startsWith('/objects') 
                            ? selectedTopup.slipPath
                            : selectedTopup.slipPath.startsWith('/uploads') 
                              ? selectedTopup.slipPath 
                              : `/uploads/slips/${selectedTopup.slipPath}`}
                        alt="Bank Transfer Slip"
                        className="w-full max-w-md mx-auto h-auto object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          console.log('Image failed to load:', selectedTopup.slipPath);
                          console.log('Image src attribute:', e.currentTarget.src);
                          e.currentTarget.style.display = 'none';
                          if (!e.currentTarget.parentNode?.querySelector('.fallback-message')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'mt-2 p-4 border-2 border-dashed border-red-300 rounded-lg text-center fallback-message';
                            fallback.innerHTML = '<p class="text-sm text-red-600">Unable to load slip image</p><p class="text-xs text-gray-500">Path: ' + selectedTopup.slipPath + '</p>';
                            e.currentTarget.parentNode?.appendChild(fallback);
                          }
                        }}
                      />
                      <div className="flex items-center justify-center mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const imageUrl = selectedTopup.slipPath.startsWith('http') 
                              ? selectedTopup.slipPath 
                              : selectedTopup.slipPath.startsWith('/objects') 
                                ? selectedTopup.slipPath
                                : selectedTopup.slipPath.startsWith('/uploads') 
                                  ? selectedTopup.slipPath 
                                  : `/uploads/slips/${selectedTopup.slipPath}`;
                            window.open(imageUrl, '_blank');
                          }}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-4 border-2 border-dashed border-red-300 dark:border-red-600 rounded-lg text-center">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        No slip image uploaded
                      </p>
                    </div>
                  )}
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden" aria-labelledby="chat-monitor-title" aria-describedby="chat-monitor-desc">
            <DialogHeader>
              <DialogTitle id="chat-monitor-title" className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Admin Chat Monitoring - Conversation {selectedConversation?.id}</span>
              </DialogTitle>
              <DialogDescription id="chat-monitor-desc">
                Monitor and moderate this conversation between users.
              </DialogDescription>
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
        <DialogContent className="max-w-md" aria-labelledby="package-dialog-title" aria-describedby="package-dialog-desc">
          <DialogHeader>
            <DialogTitle id="package-dialog-title" className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>{isEditingPackage ? 'Edit Package' : 'Create Package'}</span>
            </DialogTitle>
            <DialogDescription id="package-dialog-desc">
              {isEditingPackage 
                ? 'Update the coin package details below.'
                : 'Create a new coin package with pricing and description.'}
            </DialogDescription>
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

      {/* Bank Account Dialog */}
      <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
        <DialogContent 
          className="max-w-md"
          aria-labelledby="bank-dialog-title"
          aria-describedby="bank-dialog-desc"
        >
          <DialogHeader>
            <DialogTitle id="bank-dialog-title" className="flex items-center space-x-2">
              <Landmark className="w-5 h-5" />
              <span>{isEditingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</span>
            </DialogTitle>
            <DialogDescription id="bank-dialog-desc">
              {isEditingBankAccount 
                ? 'Update the bank account information below.'
                : 'Enter the bank account details to add a new payment method.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                autoFocus
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                placeholder="e.g., Bank of Maldives"
                className={bankAccountErrors.bankName ? "border-red-500" : ""}
              />
              {bankAccountErrors.bankName && <p className="text-sm text-red-500 mt-1">{bankAccountErrors.bankName}</p>}
            </div>

            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={bankAccountForm.accountName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                placeholder="Account holder name"
                className={bankAccountErrors.accountName ? "border-red-500" : ""}
              />
              {bankAccountErrors.accountName && <p className="text-sm text-red-500 mt-1">{bankAccountErrors.accountName}</p>}
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                placeholder="Account number"
                className={bankAccountErrors.accountNumber ? "border-red-500" : ""}
              />
              {bankAccountErrors.accountNumber && <p className="text-sm text-red-500 mt-1">{bankAccountErrors.accountNumber}</p>}
            </div>



            <div>
              <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
              <Input
                id="swiftCode"
                value={bankAccountForm.swiftCode}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, swiftCode: e.target.value })}
                placeholder="SWIFT/BIC code"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bankActive"
                  checked={bankAccountForm.isActive}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="bankActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bankPrimary"
                  checked={bankAccountForm.isPrimary}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, isPrimary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="bankPrimary">Primary Account</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddBank(false);
                setIsEditingBankAccount(false);
                setSelectedBankAccount(null);
                setBankAccountForm({
                  bankName: "",
                  accountNumber: "",
                  accountName: "",
                  swiftCode: "",
                  isActive: true,
                  isPrimary: false
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // WHY: Reset validation errors before attempting submission
                setBankAccountErrors({ bankName: "", accountNumber: "", accountName: "" });
                
                // WHY: Basic form validation - check required fields
                const errors = {
                  bankName: !bankAccountForm.bankName.trim() ? "Bank name is required" : "",
                  accountNumber: !bankAccountForm.accountNumber.trim() ? "Account number is required" : "",
                  accountName: !bankAccountForm.accountName.trim() ? "Account name is required" : ""
                };
                
                setBankAccountErrors(errors);
                const hasErrors = Object.values(errors).some(error => error);
                
                if (hasErrors) {
                  toast({ 
                    title: "Please fix the validation errors", 
                    variant: "destructive" 
                  });
                  return;
                }

                try {
                  const endpoint = isEditingBankAccount 
                    ? `/api/admin/bank-accounts/${selectedBankAccount.id}`
                    : "/api/admin/bank-accounts";
                  const method = isEditingBankAccount ? "PUT" : "POST";
                  
                  // WHY: Network logging for debugging bank account creation
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[DEBUG] ${method} ${endpoint}`, bankAccountForm);
                  }
                  
                  const response = await apiRequest(method, endpoint, bankAccountForm);
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('[DEBUG] Bank account response:', response);
                  }
                  
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
                  toast({ 
                    title: isEditingBankAccount ? "Bank account updated successfully" : "Bank account added successfully"
                  });
                  
                  setShowAddBank(false);
                  setIsEditingBankAccount(false);
                  setSelectedBankAccount(null);
                  setBankAccountForm({
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    swiftCode: "",
                    isActive: true,
                    isPrimary: false
                  });
                  setBankAccountErrors({ bankName: "", accountNumber: "", accountName: "" });
                } catch (error: any) {
                  // WHY: Enhanced error logging for debugging
                  if (process.env.NODE_ENV === 'development') {
                    console.error('[DEBUG] Bank account error:', error);
                  }
                  
                  const errorMessage = error?.message || "Unknown error occurred";
                  toast({ 
                    title: isEditingBankAccount ? "Failed to update bank account" : "Failed to add bank account", 
                    description: errorMessage,
                    variant: "destructive" 
                  });
                }
              }}
              disabled={!bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.accountName}
            >
              {isEditingBankAccount ? 'Update' : 'Add'} Bank Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
