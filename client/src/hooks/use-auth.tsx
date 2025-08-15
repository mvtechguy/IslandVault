import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  phone: string;
  fullName: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  island: string;
  atoll: string;
  profilePhotoPath?: string;
  bio?: string;
  interests?: string[];
  relationshipType?: string;
  role: string;
  status: string;
  coins: number;
  isVerified: boolean;
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginMutation: any;
  registerMutation: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Track previous user state for notifications
  const [previousUser, setPreviousUser] = useState<User | null>(null);
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/me'],
    retry: false,
    refetchInterval: (data) => {
      // Poll more frequently if user is pending approval
      if (data?.status === 'PENDING_APPROVAL') {
        return 3000; // 3 seconds
      }
      // Normal polling for other states
      return 10000; // 10 seconds
    },
    refetchIntervalInBackground: true,
  });

  // Show notifications for status and coin changes
  useEffect(() => {
    if (user && previousUser) {
      // Check for status change to APPROVED
      if (previousUser.status !== 'APPROVED' && user.status === 'APPROVED') {
        toast({
          title: "Profile Approved! 🎉",
          description: "Your profile has been approved. Welcome to Kaiveni!",
        });
        
        // Auto-redirect to home page after approval
        const timer = setTimeout(() => {
          setLocation('/');
        }, 2000); // 2 second delay to show success message
        
        return () => clearTimeout(timer);
      }
      
      // Check for status change to REJECTED
      if (previousUser.status !== 'REJECTED' && user.status === 'REJECTED') {
        toast({
          title: "Profile Needs Updates ⚠️",
          description: "Please check your notifications for details and update your profile.",
          variant: "destructive",
        });
        
        // Redirect to notifications page to see rejection reason
        const timer = setTimeout(() => {
          setLocation('/notifications');
        }, 3000); // 3 second delay to read the message
        
        return () => clearTimeout(timer);
      }
      
      // Check for coin balance increase
      if (user.coins > previousUser.coins) {
        const coinDifference = user.coins - previousUser.coins;
        toast({
          title: "Coins Added!",
          description: `${coinDifference} coins have been added to your account.`,
        });
      }
    }
    
    // Update previous user state
    if (user) {
      setPreviousUser(user);
    }
  }, [user, previousUser, toast, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest('POST', '/api/login', credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest('POST', '/api/register', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Registration successful",
        description: "Welcome to Kaiveni!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      queryClient.removeQueries({ queryKey: ['/api/me'] });
      queryClient.clear();
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}