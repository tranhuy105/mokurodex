interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  className = "mb-8",
}: PageHeaderProps) {
  return (
    <div
      className={`${className} pb-4 border-b border-gray-200 dark:border-gray-700`}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
