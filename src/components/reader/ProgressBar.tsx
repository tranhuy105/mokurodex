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
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 pointer-events-none`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div className="h-1 bg-gray-800 w-full">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
