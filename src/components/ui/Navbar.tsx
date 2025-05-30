"use client";

import {
    Book,
    FolderOpen,
    Menu,
    Moon,
    Search,
    Settings,
    Sun,
    Tag,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => {
        return (
            pathname === path ||
            pathname.startsWith(`${path}/`)
        );
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and navigation links */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/"
                            className="flex items-center"
                        >
                            <div className="h-9 w-9 rounded flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="MokuroDex"
                                    className="h-9 w-9 mt-[2px] mr-[2px]"
                                    width={36}
                                    height={36}
                                    priority
                                />
                            </div>
                            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
                                MokuroDex
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-1">
                            <Link
                                href="/"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    isActive("/")
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/content"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    isActive("/content")
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <Book className="h-4 w-4 mr-1" />
                                Library
                            </Link>
                            <Link
                                href="/collections"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    isActive("/collections")
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <FolderOpen className="h-4 w-4 mr-1" />
                                Collections
                            </Link>
                            <Link
                                href="/settings"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    isActive("/settings")
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                            </Link>
                        </div>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center space-x-2">
                        <Link
                            href="/search"
                            className={`p-2 rounded-md transition-colors ${
                                isActive("/search")
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5" />
                        </Link>

                        <button
                            onClick={() =>
                                setTheme(
                                    theme === "dark"
                                        ? "light"
                                        : "dark"
                                )
                            }
                            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                            aria-label="Toggle dark mode"
                        >
                            {/* Only render the icon when mounted to avoid hydration mismatch */}
                            {mounted ? (
                                theme === "dark" ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )
                            ) : (
                                /* Render empty div with same dimensions during SSR */
                                <div className="h-5 w-5" />
                            )}
                        </button>

                        <button
                            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                            aria-label="Menu"
                            onClick={() =>
                                setMenuOpen(!menuOpen)
                            }
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href="/"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/")
                                    ? "text-orange-600 dark:text-orange-400 bg-gray-100 dark:bg-gray-700"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            Home
                        </Link>
                        <Link
                            href="/content"
                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/content")
                                    ? "text-orange-600 dark:text-orange-400 bg-gray-100 dark:bg-gray-700"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            <Book className="h-5 w-5 mr-2" />
                            Library
                        </Link>
                        <Link
                            href="/collections"
                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/collections")
                                    ? "text-orange-600 dark:text-orange-400 bg-gray-100 dark:bg-gray-700"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            <FolderOpen className="h-5 w-5 mr-2" />
                            Collections
                        </Link>
                        <Link
                            href="/tags"
                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/tags")
                                    ? "text-orange-600 dark:text-orange-400 bg-gray-100 dark:bg-gray-700"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            <Tag className="h-5 w-5 mr-2" />
                            Tags
                        </Link>
                        <Link
                            href="/settings"
                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/settings")
                                    ? "text-orange-600 dark:text-orange-400 bg-gray-100 dark:bg-gray-700"
                                    : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                                setMenuOpen(false)
                            }
                        >
                            <Settings className="h-5 w-5 mr-2" />
                            Settings
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
