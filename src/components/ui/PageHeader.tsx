import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "pb-5 border-b border-gray-200 dark:border-gray-700",
                className
            )}
        >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                {title}
            </h1>
            {subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
