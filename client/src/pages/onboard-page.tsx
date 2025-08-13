import { useState, useEffect } from "react";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Shield, 
  Users, 
  Coins, 
  CheckCircle, 
  Clock, 
  Star,
  Lock,
  UserCheck,
  CreditCard,
  MessageCircle,
  ArrowRight,

  Award,
  Eye,
  Ban
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OnboardPage() {
  const { appName, logoUrl } = useBranding();
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Redirect to home if user is approved
  if (!isLoading && user && user.status === 'ACTIVE') {
    return <Redirect to="/" />;
  }

  const steps = [
    {
      title: "Welcome to Your Safe Space",
      icon: <Shield className="w-8 h-8 text-mint" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Your profile is currently under review to ensure everyone's safety and authenticity.
          </p>
          <div className="bg-mint/10 p-4 rounded-lg border border-mint/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-mint" />
              <span className="font-semibold text-mint">Review Process</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Our team manually reviews each profile to verify authenticity and ensure compliance with community guidelines. This usually takes 24-48 hours.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "How Kaiveni Works",
      icon: <Users className="w-8 h-8 text-soft-blue" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-soft-blue/10 rounded-lg">
              <UserCheck className="w-6 h-6 text-soft-blue mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Create Posts</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share what you're looking for in a partner</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-lavender/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-lavender mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Connect Safely</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Send connection requests to people you're interested in</p>
              </div>
            </div>
          </div>
          <div className="bg-blush/10 p-4 rounded-lg border border-blush/20">
            <h4 className="font-semibold text-blush mb-2">Maldivians Only</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Exclusively for Maldivian citizens from all atolls, creating an authentic local community.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Your Safety is Our Priority",
      icon: <Shield className="w-8 h-8 text-mint" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg">
              <Eye className="w-5 h-5 text-mint" />
              <div>
                <h4 className="font-semibold">Admin Monitoring</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">All conversations are monitored for safety</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg">
              <UserCheck className="w-5 h-5 text-mint" />
              <div>
                <h4 className="font-semibold">Profile Verification</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Every profile is manually reviewed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg">
              <Ban className="w-5 h-5 text-mint" />
              <div>
                <h4 className="font-semibold">Content Moderation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">All posts are reviewed before going live</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg">
              <Lock className="w-5 h-5 text-mint" />
              <div>
                <h4 className="font-semibold">Secure Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your personal information is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Understanding the Coin System",
      icon: <Coins className="w-8 h-8 text-soft-blue" />,
      content: (
        <div className="space-y-4">
          <div className="bg-soft-blue/10 p-4 rounded-lg border border-soft-blue/20">
            <h4 className="font-semibold text-soft-blue mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              How Coins Work
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Coins are used to create posts and send connection requests. This system helps maintain quality interactions and prevents spam.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">Create Post</span>
              </div>
              <p className="text-2xl font-bold text-soft-blue">2 Coins</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Share what you're looking for</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-blush" />
                <span className="font-semibold">Connection Request</span>
              </div>
              <p className="text-2xl font-bold text-blush">3 Coins</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Connect with someone special</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How to Buy Coins",
      icon: <CreditCard className="w-8 h-8 text-mint" />,
      content: (
        <div className="space-y-4">
          <div className="bg-mint/10 p-4 rounded-lg border border-mint/20">
            <h4 className="font-semibold text-mint mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Secure Bank Transfer
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Purchase coins safely through Maldivian bank transfers. Upload your transfer receipt for quick verification.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <span className="text-gray-700 dark:text-gray-300">Go to "Buy Coins" section</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <span className="text-gray-700 dark:text-gray-300">Choose your coin package</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <span className="text-gray-700 dark:text-gray-300">Make bank transfer to provided account</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
              <span className="text-gray-700 dark:text-gray-300">Upload receipt and wait for approval</span>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Coin purchases are verified manually for security. This typically takes 2-6 hours during business hours.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Get Started Today",
      icon: <Award className="w-8 h-8 text-lavender" />,
      content: (
        <div className="space-y-4">
          <div className="bg-lavender/10 p-4 rounded-lg border border-lavender/20 text-center">
            <Award className="w-12 h-12 text-lavender mx-auto mb-3" />
            <h4 className="font-semibold text-lavender mb-2">Ready to Connect</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Once your profile is approved, you can start creating posts and connecting with other Maldivians!
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">What happens next:</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Profile review (24-48 hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Email notification when approved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Purchase coins to get started</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Start creating posts and connecting!</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-mint/5 dark:from-dark-navy dark:to-charcoal">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-dark-navy/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${appName} Logo`}
                className="w-8 h-8 object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-mint to-soft-blue rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-mint to-soft-blue bg-clip-text text-transparent">
              Welcome to {appName}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Alert */}
        <Alert className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Profile Under Review:</strong> Your profile is being reviewed for approval. While you wait, learn how to make the most of {appName}!
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-mint' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    index < currentStep ? 'bg-mint' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-dark-navy/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {steps[currentStep].icon}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {steps[currentStep].content}
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="min-w-[100px]"
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} of {steps.length}
              </span>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  disabled
                  className="min-w-[100px] bg-gray-400 cursor-not-allowed"
                >
                  Waiting for Approval
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="min-w-[100px] bg-gradient-to-r from-mint to-soft-blue hover:from-mint/90 hover:to-soft-blue/90"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-white/50 dark:bg-dark-navy/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Have questions? We're here to help!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your safety and satisfaction are our top priorities. Thank you for choosing {appName}.
          </p>
        </div>
      </div>
    </div>
  );
}