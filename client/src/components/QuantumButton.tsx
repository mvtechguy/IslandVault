import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface QuantumButtonProps extends React.ComponentProps<typeof Button> {
  quantum?: boolean;
  pulse?: boolean;
  holo?: boolean;
}

export const QuantumButton = forwardRef<HTMLButtonElement, QuantumButtonProps>(
  ({ className, quantum = false, pulse = false, holo = false, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          quantum && "quantum-btn",
          pulse && "neural-pulse",
          holo && "holo-text",
          "transition-all duration-300",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

QuantumButton.displayName = "QuantumButton";