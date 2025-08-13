import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Heart, Users, Shield, Sparkles, Eye, EyeOff, Check, X, AlertCircle, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMaldivesData, getIslandsByAtoll } from "@/data/maldives-data";

const loginSchema = z.object({
  username: z.string().min(1, "Username or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { appName, logoUrl, tagline } = useBranding();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedAtoll, setSelectedAtoll] = useState("");
  const [availableIslands, setAvailableIslands] = useState<string[]>([]);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");

  const atolls = getMaldivesData();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      phone: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      gender: "",
      dateOfBirth: "",
      island: "",
      atoll: "",
      job: "",
      education: "",
      shortBio: "",
      profilePhotoPath: "",
      partnerPreferences: {
        ageMin: 18,
        ageMax: 50,
        gender: "",
        notes: "",
      },
    },
  });

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    let strength = 'Weak';
    let color = 'text-red-500';
    
    if (score >= 4) {
      strength = 'Strong';
      color = 'text-green-500';
    } else if (score >= 3) {
      strength = 'Medium';
      color = 'text-yellow-500';
    }
    
    return { checks, score, strength, color };
  };

  // Update available islands when atoll changes
  useEffect(() => {
    if (selectedAtoll) {
      const islands = getIslandsByAtoll(selectedAtoll);
      const islandNames = islands.map(island => island.name);
      setAvailableIslands(islandNames);
      registerForm.setValue("atoll", selectedAtoll);
      registerForm.setValue("island", ""); // Reset island selection
    }
  }, [selectedAtoll, registerForm]);

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: any) => {
    if (!uploadedPhotoUrl) {
      alert("Please upload a profile picture before registering.");
      return;
    }
    const formData = {
      ...data,
      profilePhotoPath: uploadedPhotoUrl
    };
    registerMutation.mutate(formData);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    try {
      // Create form data for local file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'profiles');

      // Upload file to local storage (no auth required during registration)
      const response = await fetch("/api/upload-public", {
        method: 'POST',
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      setUploadedPhotoUrl(result.url);
      registerForm.setValue("profilePhotoPath", result.filePath);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload profile picture. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-mint/10 dark:from-dark-navy dark:to-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${appName} Logo`}
                className="w-12 h-12 object-contain rounded-2xl mr-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.className = 'w-12 h-12 bg-gradient-to-br from-mint to-soft-blue rounded-2xl flex items-center justify-center mr-3';
                  fallbackDiv.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                  e.currentTarget.parentNode?.replaceChild(fallbackDiv, e.currentTarget);
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-mint to-soft-blue rounded-2xl flex items-center justify-center mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
            )}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-mint to-soft-blue bg-clip-text text-transparent">
              {appName}
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Match in the Maldives
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {tagline}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <Users className="w-8 h-8 text-mint mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Maldivians Only</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exclusively for people from all atolls</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-soft-blue mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Safe & Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admin-verified profiles and connections</p>
            </div>
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-lavender mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Quality Matches</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coin-based system ensures serious intentions</p>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="w-full max-w-lg mx-auto border-2 border-mint/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {isRegister ? `Join ${appName}` : "Welcome Back"}
            </CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {isRegister 
                ? "Create your profile to start connecting" 
                : "Sign in to your account"
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isRegister ? (
              /* Login Form */
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username or Phone Number</Label>
                  <Input
                    id="username"
                    {...loginForm.register("username")}
                    placeholder="Enter your username or phone number"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showLoginPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-0"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      {...registerForm.register("username")}
                      placeholder="Choose username"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-r-0 rounded-l-md text-sm text-gray-600 dark:text-gray-300">
                        +960
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        {...registerForm.register("phone")}
                        placeholder="7XXXXXX"
                        className="rounded-l-none"
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Enter your Dhiraagu or Ooredoo number without country code
                    </p>
                    {registerForm.formState.errors.phone && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...registerForm.register("fullName")}
                    placeholder="Your full name"
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture *</Label>
                  <div className="flex items-center space-x-4">
                    {uploadedPhotoUrl && (
                      <div className="relative">
                        <img
                          src={uploadedPhotoUrl}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
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
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadedPhotoUrl ? 'Change Photo' : 'Upload Photo'}
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Upload a clear photo of yourself (JPEG, PNG, or WebP, max 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showRegisterPassword ? "text" : "password"}
                        {...registerForm.register("password")}
                        placeholder="Create password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-0"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {registerForm.watch("password") && (
                      <div className="mt-2 space-y-1">
                        {(() => {
                          const password = registerForm.watch("password");
                          const { checks, strength, color } = checkPasswordStrength(password);
                          return (
                            <div className="space-y-1">
                              <p className={`text-sm font-medium ${color}`}>
                                Strength: {strength}
                              </p>
                              <div className="text-xs space-y-1">
                                <div className={`flex items-center ${checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                                  {checks.length ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  At least 8 characters
                                </div>
                                <div className={`flex items-center ${checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                                  {checks.uppercase ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  Uppercase letter
                                </div>
                                <div className={`flex items-center ${checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                                  {checks.lowercase ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  Lowercase letter
                                </div>
                                <div className={`flex items-center ${checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                                  {checks.number ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  Number
                                </div>
                                <div className={`flex items-center ${checks.special ? 'text-green-600' : 'text-gray-500'}`}>
                                  {checks.special ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                                  Special character
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...registerForm.register("confirmPassword")}
                        placeholder="Confirm password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={registerForm.watch("gender")}
                      onValueChange={(value) => registerForm.setValue("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.gender && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...registerForm.register("dateOfBirth")}
                    />
                    {registerForm.formState.errors.dateOfBirth && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="atoll">Atoll *</Label>
                    <Select 
                      value={selectedAtoll}
                      onValueChange={setSelectedAtoll}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select atoll" />
                      </SelectTrigger>
                      <SelectContent>
                        {atolls.map((atoll) => (
                          <SelectItem key={atoll.code} value={atoll.code}>
                            {atoll.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.atoll && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.atoll.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="island">Island *</Label>
                    <Select
                      value={registerForm.watch("island")}
                      onValueChange={(value) => registerForm.setValue("island", value)}
                      disabled={!selectedAtoll}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select island" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIslands.map((island) => (
                          <SelectItem key={island} value={island}>
                            {island}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.island && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.island.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      {...registerForm.register("education")}
                      placeholder="e.g., Bachelor's Degree"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job">Job/Occupation</Label>
                    <Input
                      id="job"
                      {...registerForm.register("job")}
                      placeholder="e.g., Teacher, Engineer"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shortBio">Short Bio</Label>
                  <Textarea
                    id="shortBio"
                    {...registerForm.register("shortBio")}
                    placeholder="Tell others about yourself... (max 300 characters)"
                    maxLength={300}
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-mint to-soft-blue hover:shadow-lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Profile..." : "Create Profile"}
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your profile will be reviewed by our admin team before going live.
                </p>
              </form>
            )}
            
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRegister ? "Already have an account?" : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-mint hover:text-soft-blue ml-2 font-medium"
                >
                  {isRegister ? "Sign In" : "Register"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
