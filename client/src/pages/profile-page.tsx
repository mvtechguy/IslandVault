import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Settings, Edit3, LogOut, Heart, Clock, CheckCircle, XCircle, Coins, History, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedAtoll, setSelectedAtoll] = useState(user?.atoll || "");
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");

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

  // Fetch coin ledger
  const { data: coinLedger } = useQuery({
    queryKey: ["/api/coins/ledger"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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

  const editPost = (post: any) => {
    // TODO: Implement edit post functionality
    toast({
      title: "Edit functionality",
      description: "Post editing will be available soon.",
    });
  };

  const deletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };

  // Fetch coin topups
  const { data: coinTopups } = useQuery({
    queryKey: ["/api/coins/topups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const updateProfileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      phone: user?.phone || "",
      fullName: user?.fullName || "",
      gender: user?.gender || "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      island: user?.island || "",
      atoll: user?.atoll || "",
      profilePhotoPath: user?.profilePhotoPath || "",
      job: user?.job || "",
      education: user?.education || "",
      shortBio: user?.shortBio || "",
      partnerPreferences: user?.partnerPreferences || {
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
      queryClient.setQueryData(["/api/user"], updatedUser);
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await uploadResponse.json();

      // Upload file to Google Cloud Storage
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      const imageUrl = result.url || result.publicUrl;
      
      setUploadedPhotoUrl(imageUrl);
      updateProfileForm.setValue("profilePhotoPath", imageUrl);
      
      toast({
        title: "Photo uploaded successfully",
        description: "Your profile picture has been uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
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
              onClick={() => logoutMutation.mutate()}
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
                      src={user.profilePhotoPath}
                      alt="Profile"
                      className="w-full h-full rounded-2xl object-cover"
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
                  {user.shortBio && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {user.shortBio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="coins">Coins</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">My Posts</h3>
                <Badge variant="secondary">{userPosts?.length || 0}</Badge>
              </div>
              {userPosts?.length > 0 ? (
                <div className="space-y-3">
                  {userPosts.map((post: any) => (
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
                          <div className="mt-2">
                            <div className="flex space-x-2 overflow-x-auto">
                              {post.images.slice(0, 3).map((image: string, index: number) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Post image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                />
                              ))}
                              {post.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    +{post.images.length - 3}
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
                  {sentRequests?.length > 0 ? (
                    <div className="space-y-2">
                      {sentRequests.map((request: any) => (
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
                  {receivedRequests?.length > 0 ? (
                    <div className="space-y-2">
                      {receivedRequests.map((request: any) => (
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
                {coinTopups?.length > 0 ? (
                  <div className="space-y-2">
                    {coinTopups.map((topup: any) => (
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
              {coinLedger?.length > 0 ? (
                <div className="space-y-2">
                  {coinLedger.map((entry: any) => (
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
                <div className="flex items-center space-x-4">
                  {(uploadedPhotoUrl || user?.profilePhotoPath) && (
                    <div className="relative">
                      <img
                        src={uploadedPhotoUrl || user?.profilePhotoPath}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="profilePhoto"
                    />
                    <Label
                      htmlFor="profilePhoto"
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadedPhotoUrl || user?.profilePhotoPath ? 'Change Photo' : 'Upload Photo'}
                    </Label>
                  </div>
                </div>
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
                      {atolls.map((atoll) => (
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
                      {availableIslands.map((island) => (
                        <SelectItem key={island.name} value={island.name.toLowerCase().replace(/\s+/g, '_')}>
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
      <BottomNavigation />
    </div>
  );
}
