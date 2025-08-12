import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function StatusBanner() {
  const { user } = useAuth();

  if (!user) return null;

  const getStatusConfig = () => {
    switch (user.status) {
      case "APPROVED":
        return {
          icon: CheckCircle,
          color: "green",
          title: "Profile Approved",
          message: "You can now browse and connect with others",
          bgColor: "from-mint/20 to-soft-blue/20 dark:from-mint/10 dark:to-soft-blue/10",
          borderColor: "border-mint/30 dark:border-mint/20",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "yellow",
          title: "Profile Under Review",
          message: "Your profile is being reviewed by our team",
          bgColor: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-700",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "red",
          title: "Profile Needs Updates",
          message: "Please update your profile and resubmit for review",
          bgColor: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
          borderColor: "border-red-200 dark:border-red-700",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`mt-4 p-4 bg-gradient-to-r ${config.bgColor} rounded-2xl border ${config.borderColor}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 bg-${config.color}-100 dark:bg-${config.color}-900/30 rounded-full flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${config.color}-600 dark:text-${config.color}-400`} />
        </div>
        <div>
          <p className={`font-semibold text-${config.color}-800 dark:text-${config.color}-200`}>
            {config.title}
          </p>
          <p className={`text-sm text-${config.color}-600 dark:text-${config.color}-300`}>
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
}
