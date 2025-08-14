import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuantumCardProps {
  children: React.ReactNode;
  className?: string;
  floating?: boolean;
  glow?: boolean;
  particles?: boolean;
}

export function QuantumCard({ children, className, floating = false, glow = true, particles = false }: QuantumCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-br from-slate-900/50 to-slate-800/30",
      "backdrop-blur-xl shadow-2xl transition-all duration-300",
      glow && "quantum-glow",
      floating && "floating-card hover:scale-105",
      className
    )}>
      {particles && <div className="quantum-particles" />}
      <CardContent className="relative z-10">
        {children}
      </CardContent>
    </Card>
  );
}