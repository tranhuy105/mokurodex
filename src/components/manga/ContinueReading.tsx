import { getRecentlyReadManga } from "@/actions/manga-management-prisma";
import { BookOpen, Book, ChevronRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ContinueReadingProps {
  limit?: number;
  showHeader?: boolean;
}

export async function ContinueReading({
  limit = 3,
  showHeader = true,
}: ContinueReadingProps) {
  const recentlyRead = await getRecentlyReadManga(limit);

  if (recentlyRead.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-green-500" />
            Continue Reading
          </h2>
          <Link
            href="/manga"
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center"
          >
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {recentlyRead.map((item) => (
          <div
            key={`${item.manga.id}-${item.volumeId}`}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <Link
              href={`/manga/${encodeURIComponent(item.manga.id)}/${
                item.volumeId
              }/${item.lastReadPage}`}
              className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="relative h-24 w-18 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden">
                {item.volume.coverImage ? (
                  <Image
                    src={item.volume.coverImage}
                    alt={`Volume ${item.volume.volumeNumber}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 20vw, 10vw"
                  />
                ) : item.manga.coverImage ? (
                  <Image
                    src={item.manga.coverImage}
                    alt={item.manga.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 20vw, 10vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Book className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {/* Volume badge */}
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  Vol. {item.volume.volumeNumber}
                </div>
              </div>

              <div className="ml-4 flex-grow">
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {item.manga.title}
                </h3>

                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <BookOpen className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span>
                    Page {item.lastReadPage}/{item.volume.pageCount || "?"}
                  </span>
                </div>

                {/* Progress bar */}
                {item.progress !== null && (
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>
                    {formatDistanceToNow(new Date(item.timestamp))} ago
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                  Continue
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
