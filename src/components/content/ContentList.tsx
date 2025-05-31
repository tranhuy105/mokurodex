"use client";

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
import { Content } from "@/types/content";
import {
    AlertTriangle,
    Book,
    BookOpen,
    Trash2,
} from "lucide-react";
import Image from "next/image";

interface ContentListProps {
    contentType: "manga" | "ln";
    contentList: Content[];
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
        firstItem: contentList[0]
            ? contentList[0].title
            : "none",
    });

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle>
                    {contentType === "manga"
                        ? "Manga"
                        : "Light Novel"}{" "}
                    Database{" "}
                    {contentList.length > 0 &&
                        `(${contentList.length})`}
                </CardTitle>
                <CardDescription>
                    {contentType === "manga"
                        ? "Manga"
                        : "Light Novels"}{" "}
                    that have been imported into the
                    database.
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
                            No{" "}
                            {contentType === "manga"
                                ? "manga"
                                : "light novels"}{" "}
                            found in the database.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {contentList.map((item) => (
                            <Card
                                key={item.id}
                                className="overflow-hidden flex flex-col h-full"
                            >
                                <div className="relative aspect-[3/4] w-full overflow-hidden">
                                    {item.coverImage ? (
                                        <div className="h-full w-full relative">
                                            <Image
                                                src={
                                                    item.coverImage
                                                }
                                                alt={
                                                    item.title
                                                }
                                                fill
                                                className="object-cover transition-transform hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted">
                                            {contentType ===
                                            "manga" ? (
                                                <Book className="h-16 w-16 text-muted-foreground/40" />
                                            ) : (
                                                <BookOpen className="h-16 w-16 text-muted-foreground/40" />
                                            )}
                                        </div>
                                    )}

                                    {/* Status badges */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                        {item.scanStatus ===
                                            "error" && (
                                            <div className="bg-destructive rounded-full p-1.5">
                                                <AlertTriangle className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Volume badge */}
                                    <div className="absolute bottom-2 left-2">
                                        <Badge className="bg-black/70 hover:bg-black/80 text-white">
                                            {item.volumes}{" "}
                                            {item.volumes ===
                                            1
                                                ? "volume"
                                                : "volumes"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-3 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <Button
                                            onClick={(
                                                e
                                            ) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDelete(
                                                    item.id
                                                );
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600 -mr-2 -mt-1"
                                            disabled={
                                                isLoading
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Last modified date */}
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Added:{" "}
                                        {new Date(
                                            item.addedDate
                                        ).toLocaleDateString()}
                                    </div>

                                    {/* Error message */}
                                    {item.scanStatus ===
                                        "error" &&
                                        item.errorMessage && (
                                            <p className="mt-2 text-xs text-red-500 line-clamp-2">
                                                {
                                                    item.errorMessage
                                                }
                                            </p>
                                        )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <p className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(
                        contentList[0].addedDate
                    ).toLocaleString()}
                </p>
            </CardFooter>
        </Card>
    );
}
