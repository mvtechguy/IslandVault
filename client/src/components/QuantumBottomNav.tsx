import { Home, Search, Heart, MessageSquare, User, Zap, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { QuantumButton } from "./QuantumButton";

interface QuantumBottomNavProps {
  notifications?: number;
  connections?: number;
  onCreatePost?: () => void;
}

export function QuantumBottomNav({ notifications = 0, connections = 0, onCreatePost }: QuantumBottomNavProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home", active: location === "/" },
    { path: "/browse", icon: Search, label: "Browse", active: location === "/browse" },
    { 
      path: "create", 
      icon: Plus, 
      label: "Create", 
      active: false, 
      special: true,
      onClick: onCreatePost 
    },
    { path: "/connections", icon: Heart, label: "Matches", count: connections, active: location === "/connections" },
    { path: "/inbox", icon: MessageSquare, label: "Messages", count: notifications, active: location === "/inbox" },
    { path: "/profile", icon: User, label: "Profile", active: location === "/profile" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-t border-cyan-400/20 px-2 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <QuantumButton
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => item.onClick ? item.onClick() : setLocation(item.path)}
            className={`relative flex flex-col items-center space-y-1 p-2 rounded-lg transition-all ${
              item.active 
                ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-400/50" 
                : "hover:bg-slate-700/50"
            }`}
          >
            {item.special ? (
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full flex items-center justify-center neural-pulse">
                <item.icon className="w-4 h-4 text-white" />
              </div>
            ) : (
              <item.icon className={`h-5 w-5 ${item.active ? "text-cyan-400" : "text-muted-foreground"}`} />
            )}
            <span className={`text-xs ${item.active ? "text-cyan-400 font-medium" : "text-muted-foreground"}`}>
              {item.label}
            </span>
            {item.count && item.count > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-pink-500 text-xs neural-pulse">
                {item.count > 99 ? "99+" : item.count}
              </Badge>
            )}
          </QuantumButton>
        ))}
      </div>

    </div>
  );
}