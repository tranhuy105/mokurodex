interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
}

export default function ProgressBar({
  currentPage,
  totalPages,
}: ProgressBarProps) {
  const progress = (currentPage / totalPages) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between px-4 py-1 bg-gray-900 bg-opacity-90 text-white text-xs font-medium">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 bg-gray-800 w-full">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
