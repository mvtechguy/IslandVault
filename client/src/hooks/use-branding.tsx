import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

type BrandingContextType = {
  appName: string;
  logoUrl: string | null;
  primaryColor: string;
  tagline: string;
  isLoading: boolean;
};

export const BrandingContext = createContext<BrandingContextType | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data: branding, isLoading } = useQuery<{ appName?: string; logoUrl?: string; primaryColor?: string; tagline?: string } | null>({
    queryKey: ["/api/branding"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Update document title when app name changes
  useEffect(() => {
    if (branding?.appName) {
      document.title = branding.appName;
    }
  }, [branding?.appName]);

  const contextValue: BrandingContextType = {
    appName: branding?.appName || "Kaiveni",
    logoUrl: branding?.logoUrl || null,
    primaryColor: branding?.primaryColor || "#10b981",
    tagline: branding?.tagline || "Find your perfect partner in paradise",
    isLoading,
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}