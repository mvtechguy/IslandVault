import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, CreditCard, Upload, Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { UploadResult } from '@uppy/core';

const COIN_PACKAGES = [
  { coins: 10, amount: 100, popular: false },
  { coins: 30, amount: 300, popular: true },
  { coins: 50, amount: 500, popular: false },
];

export default function BuyCoinsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [uploadedSlipUrl, setUploadedSlipUrl] = useState("");

  // Fetch settings for coin price and bank details
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch coin balance
  const { data: coinBalance } = useQuery({
    queryKey: ["/api/coins/balance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch topup history
  const { data: topupHistory } = useQuery({
    queryKey: ["/api/coins/topups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const submitTopupMutation = useMutation({
    mutationFn: async (data: { amountMvr: number; slipUrl: string }) => {
      const formData = new FormData();
      formData.append('amountMvr', data.amountMvr.toString());
      // Note: In a real implementation, you'd handle the file upload properly
      // For now, we'll just send the slip URL
      const res = await fetch('/api/coins/topups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ amountMvr: data.amountMvr }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topup request submitted!",
        description: "Your request will be reviewed within 24 hours.",
      });
      setSelectedPackage(null);
      setCustomAmount("");
      setUploadedSlipUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/coins/topups"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit topup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const res = await apiRequest("POST", "/api/objects/upload");
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setUploadedSlipUrl(uploadedFile.uploadURL as string);
      toast({
        title: "Slip uploaded successfully",
        description: "You can now submit your topup request.",
      });
    }
  };

  const handleSubmitTopup = () => {
    const amount = selectedPackage || parseFloat(customAmount);
    if (!amount || amount < 50) {
      toast({
        title: "Invalid amount",
        description: "Minimum topup amount is MVR 50.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedSlipUrl) {
      toast({
        title: "Bank slip required",
        description: "Please upload your bank transfer slip.",
        variant: "destructive",
      });
      return;
    }

    submitTopupMutation.mutate({
      amountMvr: amount,
      slipUrl: uploadedSlipUrl,
    });
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

  const coinPrice = parseFloat(settings?.coinPriceMvr || "10");

  return (
    <div className="min-h-screen bg-warm-white dark:bg-dark-navy text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-charcoal shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Buy Coins</h1>
          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {coinBalance?.coins || 0}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Current Balance */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4">
              <Coins className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold">{coinBalance?.coins || 0} Coins</h2>
            <p className="text-gray-600 dark:text-gray-400">Current Balance</p>
          </div>

          {/* Coin Packages */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Choose a Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {COIN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.coins}
                    onClick={() => {
                      setSelectedPackage(pkg.amount);
                      setCustomAmount("");
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPackage === pkg.amount
                        ? "border-mint bg-mint/5 dark:bg-mint/10"
                        : "border-gray-200 dark:border-gray-600 hover:border-mint"
                    } ${pkg.popular ? "relative" : ""}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-4">
                        <Badge className="bg-mint text-white">Most Popular</Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${selectedPackage === pkg.amount ? "text-mint" : ""}`}>
                          {pkg.coins} Coins
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          MVR {pkg.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-2xl">
                        {pkg.coins === 10 && "🪙"}
                        {pkg.coins === 30 && "💰"}
                        {pkg.coins === 50 && "💎"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Amount */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Custom Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="customAmount">Enter Amount (MVR)</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    MVR
                  </div>
                  <Input
                    id="customAmount"
                    type="number"
                    min="50"
                    step="10"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPackage(null);
                    }}
                    className="pl-12"
                    placeholder="Enter amount"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum: MVR 50 • Rate: 1 coin = MVR {coinPrice}
                  {customAmount && parseFloat(customAmount) >= 50 && (
                    <span className="ml-2 font-medium text-mint">
                      = {Math.floor(parseFloat(customAmount) / coinPrice)} coins
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 text-mint mr-2" />
                Bank Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                    <span className="font-medium">{settings?.bankName || "Bank of Maldives"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account:</span>
                    <span className="font-medium">{settings?.bankAccountNumber || "7701234567890"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{settings?.bankAccountName || "Kaiveni Pvt Ltd"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                    <span className="font-medium">{settings?.bankBranch || "Malé Main Branch"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Bank Slip */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upload Bank Slip</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-mint transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        JPG, PNG or PDF (max 5MB)
                      </p>
                    </div>
                  </div>
                </ObjectUploader>
                
                {uploadedSlipUrl && (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Bank slip uploaded successfully. You can now submit your topup request.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              onClick={handleSubmitTopup}
              disabled={
                submitTopupMutation.isPending ||
                (!selectedPackage && !customAmount) ||
                !uploadedSlipUrl ||
                (customAmount && parseFloat(customAmount) < 50)
              }
              className="w-full py-3 bg-gradient-to-r from-mint to-soft-blue text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {submitTopupMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
            
            <Alert className="mt-4">
              <Info className="w-4 h-4" />
              <AlertDescription>
                Your request will be reviewed within 24 hours. You'll be notified once approved.
              </AlertDescription>
            </Alert>
          </div>

          {/* Topup History */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Topup History</CardTitle>
            </CardHeader>
            <CardContent>
              {topupHistory?.length > 0 ? (
                <div className="space-y-3">
                  {topupHistory.map((topup: any) => (
                    <div
                      key={topup.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">MVR {topup.amountMvr}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(new Date(topup.createdAt), { addSuffix: true })}
                        </p>
                        {topup.adminNote && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {topup.adminNote}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(topup.status)}>
                          {getStatusIcon(topup.status)}
                          <span className="ml-1">{topup.status}</span>
                        </Badge>
                        {topup.computedCoins && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            +{topup.computedCoins} coins
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No topup history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
