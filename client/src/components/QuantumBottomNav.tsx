import { Home, Search, Heart, MessageSquare, User, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { QuantumButton } from "./QuantumButton";

interface QuantumBottomNavProps {
  notifications?: number;
  connections?: number;
}

export function QuantumBottomNav({ notifications = 0, connections = 0 }: QuantumBottomNavProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Neural Hub", active: location === "/" },
    { path: "/browse", icon: Search, label: "Quantum Scan", active: location === "/browse" },
    { path: "/connections", icon: Heart, label: "Bonds", count: connections, active: location === "/connections" },
    { path: "/inbox", icon: MessageSquare, label: "Neural Link", count: notifications, active: location === "/inbox" },
    { path: "/profile", icon: User, label: "Matrix", active: location === "/profile" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-t border-cyan-400/20 px-2 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <QuantumButton
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => setLocation(item.path)}
            className={`relative flex flex-col items-center space-y-1 p-2 rounded-lg transition-all ${
              item.active 
                ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-400/50" 
                : "hover:bg-slate-700/50"
            }`}
          >
            <item.icon className={`h-5 w-5 ${item.active ? "text-cyan-400" : "text-muted-foreground"}`} />
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
      
      {/* Quantum Energy Indicator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}