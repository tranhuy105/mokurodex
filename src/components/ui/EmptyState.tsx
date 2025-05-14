import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "error";
  action?: ReactNode;
}

export function EmptyState({
  title,
  message,
  icon: Icon,
  variant = "default",
  action,
}: EmptyStateProps) {
  const variants = {
    default: {
      iconClass: "text-gray-400 dark:text-gray-500",
      titleClass: "text-gray-600 dark:text-gray-300",
    },
    warning: {
      iconClass: "text-yellow-500",
      titleClass: "text-yellow-600 dark:text-yellow-500",
    },
    error: {
      iconClass: "text-red-500",
      titleClass: "text-red-600 dark:text-red-500",
    },
  };

  const { iconClass, titleClass } = variants[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <Icon className={`w-16 h-16 ${iconClass} mb-4`} />
      <p className={`text-lg font-medium ${titleClass}`}>{title}</p>
      <p className="text-gray-600 dark:text-gray-400 mt-2 text-center mb-4">
        {message}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
