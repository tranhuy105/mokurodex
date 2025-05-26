"use client";

import { Manga } from "@prisma/client";
import { AlertTriangle, Book, BookOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContentListProps {
  contentType: "manga" | "ln";
  contentList: Manga[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function ContentList({
  contentType,
  contentList,
  onDelete,
  isLoading,
}: ContentListProps) {
  console.log("ContentList rendering with:", {
    contentType,
    contentListLength: contentList.length,
    firstItem: contentList[0] ? contentList[0].title : "none",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {contentType === "manga" ? "Manga" : "Light Novel"} Database{" "}
          {contentList.length > 0 && `(${contentList.length})`}
        </CardTitle>
        <CardDescription>
          {contentType === "manga" ? "Manga" : "Light Novels"} that have been
          imported into the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contentList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {contentType === "manga" ? (
              <Book className="mx-auto h-12 w-12 opacity-30" />
            ) : (
              <BookOpen className="mx-auto h-12 w-12 opacity-30" />
            )}
            <p className="mt-3">
              No {contentType === "manga" ? "manga" : "light novels"} found in
              the database.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contentList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <Badge variant="outline">
                      {item.volumes} {item.volumes === 1 ? "volume" : "volumes"}
                    </Badge>
                    {item.scanStatus === "error" && (
                      <Badge
                        variant="destructive"
                        className="flex items-center"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{item.directoryPath}</p>
                  {item.scanStatus === "error" && item.errorMessage && (
                    <p className="mt-1 text-sm text-red-500">
                      {item.errorMessage}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onDelete(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
}
