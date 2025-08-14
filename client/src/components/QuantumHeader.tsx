import { Bell, Search, Menu, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantumButton } from "./QuantumButton";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface QuantumHeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  notificationCount?: number;
}

export function QuantumHeader({ title, onSearch, showSearch = false, notificationCount = 0 }: QuantumHeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="mobile-header md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold holo-text">
            {title}
          </h1>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>

        {/* Center - Search (if enabled) */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 max-w-xs mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quantum matches..."
                className="pl-10 bg-background/50 border-cyan-400/30 focus:border-cyan-400 quantum-glow"
              />
            </div>
          </form>
        )}

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <QuantumButton variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-pink-500 text-xs neural-pulse">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Badge>
              )}
            </QuantumButton>
          </div>
          
          <div className="flex items-center space-x-1 text-sm">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold text-yellow-400">{user?.coins || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}