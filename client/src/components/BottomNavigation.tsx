import { useLocation } from "wouter";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/browse", icon: Search, label: "Browse" },
  { path: "/create", icon: Plus, label: "Create", special: true },
  { path: "/inbox", icon: MessageCircle, label: "Inbox" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-charcoal border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 transition-colors",
                isActive
                  ? "text-mint"
                  : "text-gray-500 dark:text-gray-400 hover:text-mint"
              )}
            >
              {item.special ? (
                <div className="w-8 h-8 bg-gradient-to-r from-mint to-soft-blue rounded-full flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
