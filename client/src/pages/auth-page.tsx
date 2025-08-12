import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Heart, Users, Shield, Sparkles } from "lucide-react";
import { getMaldivesData, getIslandsForAtoll } from "@/data/maldives-data";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedAtoll, setSelectedAtoll] = useState("");
  const [availableIslands, setAvailableIslands] = useState<string[]>([]);

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
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      gender: "",
      dateOfBirth: "",
      island: "",
      atoll: "",
      religion: "",
      job: "",
      education: "",
      shortBio: "",
      partnerPreferences: {
        ageMin: 18,
        ageMax: 50,
        gender: "",
        religion: "",
        notes: "",
      },
    },
  });

  // Update available islands when atoll changes
  useEffect(() => {
    if (selectedAtoll) {
      const islands = getIslandsForAtoll(selectedAtoll);
      setAvailableIslands(islands);
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
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-mint/10 dark:from-dark-navy dark:to-charcoal flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-mint to-soft-blue rounded-2xl flex items-center justify-center mr-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-mint to-soft-blue bg-clip-text text-transparent">
              Kaiveni
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Match in the Maldives
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The trusted partner finder exclusively for Maldivians. Connect with genuine people from across our beautiful islands.
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
              {isRegister ? "Join Kaiveni" : "Welcome Back"}
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
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    {...loginForm.register("username")}
                    placeholder="Enter your username or email"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...loginForm.register("password")}
                    placeholder="Enter your password"
                  />
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      placeholder="your@email.com"
                    />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder="Create password"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      placeholder="Confirm password"
                    />
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
                    <Select onValueChange={(value) => registerForm.setValue("gender", value)}>
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
                    <Select onValueChange={setSelectedAtoll}>
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
                      onValueChange={(value) => registerForm.setValue("island", value)}
                      disabled={!selectedAtoll}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select island" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIslands.map((island) => (
                          <SelectItem key={island} value={island.toLowerCase().replace(/\s+/g, '_')}>
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
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      {...registerForm.register("religion")}
                      placeholder="e.g., Islam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job">Job/Education</Label>
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
