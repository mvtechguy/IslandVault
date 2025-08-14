import { useLocation } from "wouter";
import { Home, Search, Plus, MessageCircle, User, Cpu, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", icon: Cpu, label: "Neural Hub" },
  { path: "/browse", icon: Search, label: "Quantum Scan" },
  { path: "/create", icon: Plus, label: "Create Matrix", special: true },
  { path: "/inbox", icon: MessageCircle, label: "Neural Link" },
  { path: "/profile", icon: User, label: "Matrix" },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-t border-cyan-400/20 px-4 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-400/50 text-cyan-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-700/50"
              )}
            >
              {item.special ? (
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full flex items-center justify-center neural-pulse">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Quantum Energy Indicator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full animate-pulse"></div>
      </div>
    </nav>
  );
}
