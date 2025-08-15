import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Settings, Edit3, LogOut, Heart, Clock, CheckCircle, XCircle, Coins, History, Upload, Camera, Shield, Eye, EyeOff, Save, AlertCircle, RotateCcw } from "lucide-react";
import { CoinBalance } from "@/components/CoinBalance";
import { LocalFileUploader } from "@/components/LocalFileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { getMaldivesData, getIslandsByAtoll } from "@/data/maldives-data";
import { formatDistanceToNow } from "date-fns";

// Create update profile schema without password fields
const updateProfileSchema = z.object({
  username: z.string().min(1, "Username is required"),
  phone: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  island: z.string().min(1, "Island is required"),
  atoll: z.string().min(1, "Atoll is required"),
  profilePhotoPath: z.string().min(1, "Profile picture is required"),
  job: z.string().optional(),
  education: z.string().optional(),
  shortBio: z.string().optional(),
  partnerPreferences: z.object({
    ageMin: z.number().min(18).max(80).optional(),
    ageMax: z.number().min(18).max(80).optional(),
    gender: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedAtoll, setSelectedAtoll] = useState(user?.atoll || "");
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  
  // Privacy states
  const [useRealIdentity, setUseRealIdentity] = useState(true);
  const [fakeProfile, setFakeProfile] = useState({
    fakeFullName: '',
    fakeAge: '',
    fakeIsland: '',
    fakeAtoll: ''
  });

  const atolls = getMaldivesData();
  const availableIslands = selectedAtoll ? getIslandsByAtoll(selectedAtoll) : [];

  // Fetch user posts
  const { data: userPosts } = useQuery({
    queryKey: ["/api/posts/my"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch connection requests
  const { data: sentRequests } = useQuery({
    queryKey: ["/api/connect/sent"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: receivedRequests } = useQuery({
    queryKey: ["/api/connect/received"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch coin-related data
  const { data: coinTopups } = useQuery({
    queryKey: ["/api/coins/topups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: coinLedger } = useQuery({
    queryKey: ["/api/coins/ledger"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch identity reveals
  const { data: revealsData } = useQuery({
    queryKey: ["/api/identity/reveals"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Privacy settings mutation
  const privacyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/privacy/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update privacy settings.",
        variant: "destructive"
      });
    }
  });

  // Load user's current privacy settings into state
  useEffect(() => {
    if (user) {
      setUseRealIdentity(user.useRealIdentity ?? true);
      setFakeProfile({
        fakeFullName: user.fakeFullName || '',
        fakeAge: user.fakeAge?.toString() || '',
        fakeIsland: user.fakeIsland || '',
        fakeAtoll: user.fakeAtoll || ''
      });
    }
  }, [user]);


  // Post management mutations
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/posts/${postId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Edit post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, postData }: { postId: number, postData: any }) => {
      const res = await apiRequest("PATCH", `/api/posts/${postId}`, postData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/my"] });
      setShowEditDialog(false);
      setEditingPost(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editPost = (post: any) => {
    setEditingPost(post);
    setShowEditDialog(true);
  };

  const deletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };



  const updateProfileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      phone: user?.phone || "",
      fullName: user?.fullName || "",
      gender: (user?.gender as "male" | "female" | "other") || "male",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      island: user?.island || "",
      atoll: user?.atoll || "",
      profilePhotoPath: user?.profilePhotoPath || "",
      job: "",
      education: "",
      shortBio: "",
      partnerPreferences: {
        ageMin: 18,
        ageMax: 50,
        gender: "",
        notes: "",
      },
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/me", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile is now pending admin approval.",
      });
      setShowEditProfile(false);
      queryClient.setQueryData(["/api/me"], updatedUser);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onUpdateProfile = (data: any) => {
    // Check if user has no profile photo and hasn't uploaded one
    if (!user?.profilePhotoPath && !uploadedPhotoUrl) {
      toast({
        title: "Profile picture required",
        description: "Please upload a profile picture before saving.",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      ...data,
      profilePhotoPath: uploadedPhotoUrl || data.profilePhotoPath
    };
    updateProfileMutation.mutate(formData);
  };

  const handlePhotoUpload = (files: Array<{ filePath: string; url: string }>) => {
    if (files.length > 0) {
      const uploadedFile = files[0];
      setUploadedPhotoUrl(uploadedFile.filePath);
      updateProfileForm.setValue("profilePhotoPath", uploadedFile.filePath);

      toast({
        title: "Photo uploaded successfully!",
        description: "Your profile picture has been updated.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-charcoal shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">My Profile</h1>
          <div className="flex items-center space-x-2">
            <CoinBalance />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditProfile(true)}
              className="text-mint hover:text-mint/80"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4">
        {/* Profile Header */}
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center">
                  {user.profilePhotoPath ? (
                    <img
                      src={`/api/image-proxy/${user.profilePhotoPath.split('/').pop()}`}
                      alt="Profile"
                      className="w-full h-full rounded-2xl object-cover"
                      onError={(e) => {
                        console.log("Image failed to load:", e.currentTarget.src);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {user.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl font-bold">{user.fullName}</h2>
                    <Badge className={getStatusColor(user.status)}>
                      {getStatusIcon(user.status)}
                      <span className="ml-1">{user.status}</span>
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {user.island}, {user.atoll}
                  </p>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rejection Notice and Resubmit Button */}
        {user.status === 'REJECTED' && (
          <div className="mt-4">
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                      Profile Needs Updates
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                      Your profile was not approved. Please review the feedback in your notifications, update your profile information, and resubmit for review.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowEditProfile(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await apiRequest('POST', '/api/profile/resubmit');
                            queryClient.invalidateQueries({ queryKey: ['/api/me'] });
                            toast({
                              title: "Profile Resubmitted! 🔄",
                              description: "Your profile has been resubmitted for admin review.",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Resubmission Failed",
                              description: error.message || "Please try again later.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Resubmit for Review
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="coins">Coins</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">My Posts</h3>
                <Badge variant="secondary">{(userPosts as any[])?.length || 0}</Badge>
              </div>
              {(userPosts as any[])?.length > 0 ? (
                <div className="space-y-3">
                  {(userPosts as any[]).map((post: any) => (
                    <Card key={post.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {post.title && (
                              <h4 className="font-medium">{post.title}</h4>
                            )}
                            <Badge className={getStatusColor(post.status)}>
                              {getStatusIcon(post.status)}
                              <span className="ml-1">{post.status}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </span>
                            {!post.deletedAt && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => editPost(post)}
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => deletePost(post.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {post.description}
                        </p>
                        {post.images && post.images.length > 0 && (
                          <div className="mt-3">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                              {post.images.slice(0, 4).map((image: string, index: number) => (
                                <div key={index} className="relative aspect-square w-20 h-20 flex-shrink-0">
                                  <img
                                    src={image.startsWith('/uploads') ? image : `/uploads/posts/${image}`}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                    onError={(e) => {
                                      console.log("Post image failed to load:", e.currentTarget.src);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ))}
                              {post.images.length > 4 && (
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    +{post.images.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Sent Requests</h3>
                  {(sentRequests as any[])?.length > 0 ? (
                    <div className="space-y-2">
                      {(sentRequests as any[]).map((request: any) => (
                        <Card key={request.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{request.user?.fullName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {request.user?.island}, {request.user?.atoll}
                                </p>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                      No sent requests
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Received Requests</h3>
                  {(receivedRequests as any[])?.length > 0 ? (
                    <div className="space-y-2">
                      {(receivedRequests as any[]).map((request: any) => (
                        <Card key={request.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{request.user?.fullName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {request.user?.island}, {request.user?.atoll}
                                </p>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                      No received requests
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              {/* Privacy Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-mint" />
                    Identity Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {useRealIdentity ? (
                        <Eye className="w-5 h-5 text-green-500" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-orange-500" />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {useRealIdentity ? 'Using Real Identity' : 'Using Fake Identity'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {useRealIdentity 
                            ? 'Others will see your real name and details'
                            : 'Others will see your fake identity until you reveal yourself'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useRealIdentity}
                      onCheckedChange={setUseRealIdentity}
                    />
                  </div>

                  <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-lg">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">How Privacy Works</h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• With fake identity: Others see fake details on your posts</li>
                      <li>• You can reveal your real identity to specific users anytime</li>
                      <li>• Real identity reveals are permanent until revoked</li>
                      <li>• All connections require admin approval for safety</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Fake Identity Setup */}
              {!useRealIdentity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-soft-blue" />
                      Fake Identity Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fakeFullName">Fake Name</Label>
                        <Input
                          id="fakeFullName"
                          value={fakeProfile.fakeFullName}
                          onChange={(e) => setFakeProfile(prev => ({...prev, fakeFullName: e.target.value}))}
                          placeholder="Enter a fake name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fakeAge">Fake Age</Label>
                        <Input
                          id="fakeAge"
                          type="number"
                          value={fakeProfile.fakeAge}
                          onChange={(e) => setFakeProfile(prev => ({...prev, fakeAge: e.target.value}))}
                          placeholder="Enter fake age"
                          min="18"
                          max="80"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fakeAtoll">Fake Atoll</Label>
                        <Select 
                          value={fakeProfile.fakeAtoll} 
                          onValueChange={(value) => setFakeProfile(prev => ({...prev, fakeAtoll: value, fakeIsland: ''}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fake atoll" />
                          </SelectTrigger>
                          <SelectContent>
                            {atolls.map(atoll => (
                              <SelectItem key={atoll.code} value={atoll.code}>
                                {atoll.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fakeIsland">Fake Island</Label>
                        <Select 
                          value={fakeProfile.fakeIsland} 
                          onValueChange={(value) => setFakeProfile(prev => ({...prev, fakeIsland: value}))}
                          disabled={!fakeProfile.fakeAtoll}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fake island" />
                          </SelectTrigger>
                          <SelectContent>
                            {fakeProfile.fakeAtoll && atolls
                              .find(a => a.code === fakeProfile.fakeAtoll)?.islands
                              .map(island => (
                                <SelectItem key={island.name} value={island.name}>
                                  {island.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Identity Reveals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-lavender" />
                    Real Identity Reveals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(revealsData as any)?.reveals && (revealsData as any).reveals.length > 0 ? (
                    <div className="space-y-3">
                      {(revealsData as any).reveals.map((reveal: any) => (
                        <div key={reveal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <h4 className="font-medium">{reveal.targetUser?.fullName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Revealed {new Date(reveal.revealedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={reveal.isActive ? "default" : "secondary"}>
                            {reveal.isActive ? "Active" : "Revoked"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        You haven't revealed your real identity to anyone yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Privacy Settings Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    privacyMutation.mutate({
                      useRealIdentity,
                      ...fakeProfile,
                      fakeAge: fakeProfile.fakeAge ? parseInt(fakeProfile.fakeAge) : null
                    });
                  }}
                  disabled={privacyMutation.isPending}
                  className="bg-gradient-to-r from-mint via-soft-blue to-lavender text-white font-semibold px-8 py-3 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {privacyMutation.isPending ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="coins" className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{user.coins} Coins</h3>
                <p className="text-gray-600 dark:text-gray-400">Current Balance</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Top-up History</h3>
                {(coinTopups as any[])?.length > 0 ? (
                  <div className="space-y-2">
                    {(coinTopups as any[]).map((topup: any) => (
                      <Card key={topup.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">MVR {topup.amountMvr}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDistanceToNow(new Date(topup.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(topup.status)}>
                                {topup.status}
                              </Badge>
                              {topup.computedCoins && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {topup.computedCoins} coins
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No top-up history
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="font-semibold">Coin Transactions</h3>
              {(coinLedger as any[])?.length > 0 ? (
                <div className="space-y-2">
                  {(coinLedger as any[]).map((entry: any) => (
                    <Card key={entry.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{entry.description || entry.reason}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className={`text-right font-semibold ${
                            entry.delta > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.delta > 0 ? '+' : ''}{entry.delta} coins
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No transaction history</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={updateProfileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...updateProfileForm.register("username")}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+960 XXX-XXXX"
                    {...updateProfileForm.register("phone")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...updateProfileForm.register("fullName")}
                />
              </div>

              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label>Profile Picture *</Label>
                
                {/* Current profile picture preview */}
                {(uploadedPhotoUrl || user?.profilePhotoPath) && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={uploadedPhotoUrl || user?.profilePhotoPath || ''}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        console.log("Profile edit image failed to load:", e.currentTarget.src);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* File uploader */}
                <LocalFileUploader
                  category="profiles"
                  multiple={false}
                  maxSizeMB={5}
                  accept="image/jpeg,image/png,image/webp"
                  onUploadComplete={handlePhotoUpload}
                  onUploadError={(error) => {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>{uploadedPhotoUrl || user?.profilePhotoPath ? 'Change Photo' : 'Upload Photo'}</span>
                  </div>
                </LocalFileUploader>
                
                {updateProfileForm.formState.errors.profilePhotoPath && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {updateProfileForm.formState.errors.profilePhotoPath.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={updateProfileForm.watch("gender")}
                    onValueChange={(value) => updateProfileForm.setValue("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...updateProfileForm.register("dateOfBirth")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="atoll">Atoll</Label>
                  <Select
                    value={selectedAtoll}
                    onValueChange={(value) => {
                      setSelectedAtoll(value);
                      updateProfileForm.setValue("atoll", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {atolls.map((atoll: any) => (
                        <SelectItem key={atoll.code} value={atoll.code}>
                          {atoll.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="island">Island</Label>
                  <Select
                    value={updateProfileForm.watch("island")}
                    onValueChange={(value) => updateProfileForm.setValue("island", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIslands.map((island: any) => (
                        <SelectItem key={island.name} value={island.name}>
                          {island.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="job">Job/Education</Label>
                <Input
                  id="job"
                  {...updateProfileForm.register("job")}
                />
              </div>

              <div>
                <Label htmlFor="shortBio">Short Bio</Label>
                <Textarea
                  id="shortBio"
                  {...updateProfileForm.register("shortBio")}
                  maxLength={300}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditProfile(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      {/* Bottom Navigation */}
      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title (Optional)</Label>
              <Input
                id="edit-title"
                value={editingPost?.title || ""}
                onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                placeholder="Post title..."
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editingPost?.description || ""}
                onChange={(e) => setEditingPost({...editingPost, description: e.target.value})}
                placeholder="Tell us about yourself and what you're looking for..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updatePostMutation.mutate({ 
                postId: editingPost.id, 
                postData: { 
                  title: editingPost.title, 
                  description: editingPost.description 
                }
              })}
              disabled={updatePostMutation.isPending}
            >
              {updatePostMutation.isPending ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
