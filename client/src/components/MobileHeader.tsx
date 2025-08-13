import { Heart, Bell, Moon, Sun, Coins, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function MobileHeader({ title = "Kaiveni", showBackButton = false, onBackClick }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch coin balance
  const { data: coinBalance } = useQuery<{ coins: number }>({
    queryKey: ["/api/coins/balance"],
    retry: false,
  });

  // Fetch notifications
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      setLocation("/");
    }
  };

  return (
    <header className="bg-white dark:bg-charcoal shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-mint to-soft-blue rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-mint to-soft-blue bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Coin Balance */}
          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {coinBalance?.coins || 0}
            </span>
          </div>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-gray-600" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-400" />
            )}
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/notifications")}
            className="relative w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blush rounded-full text-xs text-white flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          
          {/* Admin Dashboard Access - Only for Admin Users */}
          {user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin')}
              className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/40 border border-orange-300 dark:border-orange-600"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}