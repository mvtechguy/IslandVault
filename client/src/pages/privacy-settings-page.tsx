import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Eye, EyeOff, User, Camera, MapPin, Calendar, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { MobileHeader } from "@/components/MobileHeader";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { getMaldivesData } from "@/data/maldives-data";

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const maldivesData = getMaldivesData();
  const queryClient = useQueryClient();

  const [useRealIdentity, setUseRealIdentity] = useState(true);
  const [fakeProfile, setFakeProfile] = useState({
    fakeFullName: '',
    fakeAge: '',
    fakeIsland: '',
    fakeAtoll: ''
  });

  // Fetch current privacy settings
  const { data: privacySettings } = useQuery({
    queryKey: ["/api/profile/privacy"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  // Update privacy settings
  const privacyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", '/api/profile/privacy', data),
    onSuccess: () => {
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/privacy"] });
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

  // Fetch identity reveals
  const { data: revealsData } = useQuery({
    queryKey: ["/api/identity/reveals"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  useEffect(() => {
    if (privacySettings) {
      setUseRealIdentity((privacySettings as any).useRealIdentity ?? true);
      setFakeProfile({
        fakeFullName: (privacySettings as any).fakeFullName || '',
        fakeAge: (privacySettings as any).fakeAge?.toString() || '',
        fakeIsland: (privacySettings as any).fakeIsland || '',
        fakeAtoll: (privacySettings as any).fakeAtoll || ''
      });
    }
  }, [privacySettings]);

  const handleSavePrivacySettings = () => {
    privacyMutation.mutate({
      useRealIdentity,
      ...fakeProfile,
      fakeAge: fakeProfile.fakeAge ? parseInt(fakeProfile.fakeAge) : null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/5 via-white to-soft-blue/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <MobileHeader title="Privacy Settings" showBack />
      
      <div className="container mx-auto px-4 pt-20 pb-20 max-w-4xl">
        {/* Privacy Toggle */}
        <Card className="mb-6">
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
          <Card className="mb-6">
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
                      {maldivesData.map(atoll => (
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
                      {fakeProfile.fakeAtoll && maldivesData
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
        <Card className="mb-6">
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

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSavePrivacySettings}
            disabled={privacyMutation.isPending}
            className="bg-gradient-to-r from-mint via-soft-blue to-lavender text-white font-semibold px-8 py-3 rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {privacyMutation.isPending ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}