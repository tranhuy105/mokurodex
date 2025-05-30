import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
                {/* Orange header bar */}
                <div className="h-2 bg-gradient-to-r from-orange-600 to-orange-400"></div>
                <div className="p-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="rounded-full bg-orange-500/10 p-3">
                            <FileSearch
                                size={28}
                                className="text-orange-500"
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Page Not Found
                    </h1>

                    <p className="text-zinc-400 text-center mb-6">
                        The page you&apos;re looking for
                        doesn&apos;t exist or has been
                        moved.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            asChild
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Link href="/">
                                Go to Home Page
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            <Link href="/content">
                                Browse Collection
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
