import { Plus, Coins } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CoinBalanceResponse {
  coins: number;
}

export function CoinBalance({ className }: { className?: string }) {
  const [, setLocation] = useLocation();

  const { data: coinData } = useQuery<CoinBalanceResponse>({
    queryKey: ['/api/coins/balance'],
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: false,
  });

  const handleCoinClick = () => {
    setLocation('/coins');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCoinClick}
      className={cn(
        "flex items-center space-x-2 bg-gradient-to-r from-mint/10 to-soft-blue/10 hover:from-mint/20 hover:to-soft-blue/20 border border-mint/20 rounded-full px-3 py-1",
        className
      )}
    >
      <div className="flex items-center space-x-1">
        <Coins className="w-4 h-4 text-mint" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {coinData?.coins ?? 0}
        </span>
      </div>
      <div className="w-5 h-5 bg-gradient-to-r from-mint to-soft-blue rounded-full flex items-center justify-center">
        <Plus className="w-3 h-3 text-white" />
      </div>
    </Button>
  );
}