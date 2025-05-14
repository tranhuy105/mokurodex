import { useState, useEffect } from "react";

interface Progress {
  page: number;
  charCount: number;
  lineCount: number;
  completed: boolean;
}

interface ChapterProgress {
  [chapter: string]: Progress;
}

export function useProgress(chapter: string) {
  const [progress, setProgress] = useState<ChapterProgress>({});

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("manga-reader-progress");
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("manga-reader-progress", JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [progress]);

  const updateProgress = (newProgress: Partial<Progress>) => {
    setProgress((prev) => ({
      ...prev,
      [chapter]: {
        ...prev[chapter],
        ...newProgress,
      },
    }));
  };

  return {
    progress: progress[chapter] || {
      page: 1,
      charCount: 0,
      lineCount: 0,
      completed: false,
    },
    updateProgress,
  };
}
