import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, CreditCard, Upload, Clock, CheckCircle, XCircle, Info, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { QuantumBottomNav } from "@/components/QuantumBottomNav";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { UploadResult } from '@uppy/core';

export default function BuyCoinsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [uploadedSlipUrl, setUploadedSlipUrl] = useState("");

  // Fetch coin packages
  const { data: packages } = useQuery({
    queryKey: ["/api/coins/packages"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["/api/bank-accounts"],
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
    mutationFn: async (data: { packageId: number; slipUrl: string }) => {
      const res = await apiRequest('POST', '/api/coins/topups', {
        packageId: data.packageId,
        slipUrl: data.slipUrl
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topup request submitted!",
        description: "Your request will be reviewed within 24 hours.",
      });
      setSelectedPackageId(null);
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
    if (!selectedPackageId) {
      toast({
        title: "Package required",
        description: "Please select a coin package.",
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
      packageId: selectedPackageId,
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
              {!packages ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading packages...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No coin packages available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {packages.map((pkg: any) => (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                      }}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        selectedPackageId === pkg.id
                          ? "border-mint bg-mint/5 dark:bg-mint/10"
                          : "border-gray-200 dark:border-gray-600 hover:border-mint"
                      } ${pkg.isPopular ? "relative" : ""}`}
                    >
                      {pkg.isPopular && (
                        <div className="absolute -top-2 left-4">
                          <Badge className="bg-mint text-white">Most Popular</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-semibold ${selectedPackageId === pkg.id ? "text-mint" : ""}`}>
                            {pkg.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {pkg.coins} Coins • MVR {parseFloat(pkg.priceMvr).toFixed(2)}
                          </div>
                          {pkg.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                        <div className="text-2xl">
                          {pkg.coins <= 15 && "🪙"}
                          {pkg.coins > 15 && pkg.coins <= 35 && "💰"}
                          {pkg.coins > 35 && "💎"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
              <div className="space-y-4">
                {bankAccounts && bankAccounts.length > 0 ? (
                  bankAccounts.map((account: any) => (
                    <div key={account.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 relative">
                      {account.isPrimary && (
                        <div className="absolute -top-2 right-4">
                          <Badge className="bg-mint text-white px-2 py-1 text-xs flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Primary
                          </Badge>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Bank:</span>
                          <span className="font-medium">{account.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Account:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono">{account.accountNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(account.accountNumber);
                                toast({ title: "Account number copied!", variant: "default" });
                              }}
                              className="h-6 w-6 p-0 hover:bg-mint/20"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Name:</span>
                          <span className="font-medium">{account.accountName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Branch:</span>
                          <span className="font-medium">{account.branchName}</span>
                        </div>
                        {account.swiftCode && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">SWIFT:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium font-mono">{account.swiftCode}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(account.swiftCode);
                                  toast({ title: "SWIFT code copied!", variant: "default" });
                                }}
                                className="h-6 w-6 p-0 hover:bg-mint/20"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-center text-gray-600 dark:text-gray-400">No bank accounts available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Bank Slip */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 text-mint mr-2" />
                Upload Bank Slip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Upload Instructions:</p>
                      <ul className="text-blue-800 dark:text-blue-300 space-y-1 text-xs">
                        <li>• Take a clear photo of your bank transfer slip</li>
                        <li>• Ensure all details are visible and readable</li>
                        <li>• Include transaction reference number</li>
                        <li>• File size should be under 5MB</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-mint to-soft-blue rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Upload Bank Slip
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Take a clear photo of your transfer receipt
                      </p>
                    </div>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="bg-gradient-to-r from-mint to-soft-blue text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5" />
                        Choose File
                      </div>
                    </ObjectUploader>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supports JPG, PNG or PDF files up to 5MB
                    </p>
                  </div>
                </div>
                
                {uploadedSlipUrl && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-300">
                      Bank slip uploaded successfully! You can now submit your topup request.
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
                !selectedPackageId ||
                !uploadedSlipUrl
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
      <QuantumBottomNav />
    </div>
  );
}
