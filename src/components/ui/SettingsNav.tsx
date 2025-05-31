"use client";

import {
    Book,
    ChevronDown,
    Database,
    Download,
    Menu,
    Settings,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SettingsNavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

export function SettingsNav() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const navItems: SettingsNavItem[] = [
        {
            name: "General Settings",
            href: "/settings",
            icon: <Settings className="h-5 w-5" />,
        },
        {
            name: "Reading Preferences",
            href: "/settings/preferences",
            icon: <Book className="h-5 w-5" />,
        },
        {
            name: "Database",
            href: "/settings/database",
            icon: <Database className="h-5 w-5" />,
        },
        {
            name: "Import",
            href: "/settings/import",
            icon: <Upload className="h-5 w-5" />,
        },
        {
            name: "Offline Content",
            href: "/settings/offline",
            icon: <Download className="h-5 w-5" />,
        },
    ];

    // Function to determine if a nav item is active
    const isActive = (href: string): boolean => {
        if (href === "/settings") {
            // For the main settings page, only highlight when exactly at /settings
            return pathname === "/settings";
        } else {
            // For other pages, highlight if the pathname starts with the href
            return pathname.startsWith(href);
        }
    };

    // Get current page name for mobile header
    const currentPage =
        navItems.find((item) => isActive(item.href))
            ?.name || "Settings";

    return (
        <div className="mb-8 w-full">
            {/* Mobile menu button */}
            <div className="block md:hidden">
                <button
                    onClick={() =>
                        setMobileMenuOpen(!mobileMenuOpen)
                    }
                    className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 dark:bg-gray-800"
                >
                    <div className="flex items-center">
                        <Menu className="mr-2 h-5 w-5" />
                        <span>{currentPage}</span>
                    </div>
                    <ChevronDown
                        className={`h-5 w-5 transform transition-transform ${
                            mobileMenuOpen
                                ? "rotate-180"
                                : ""
                        }`}
                    />
                </button>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                    <div className="mt-2 rounded-md bg-white shadow-lg dark:bg-gray-800">
                        <div className="py-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block px-4 py-2 text-sm ${
                                        isActive(item.href)
                                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() =>
                                        setMobileMenuOpen(
                                            false
                                        )
                                    }
                                >
                                    <div className="flex items-center">
                                        {item.icon}
                                        <span className="ml-2">
                                            {item.name}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop horizontal nav */}
            <div className="hidden md:block">
                <nav className="flex flex-wrap space-x-2 border-b border-gray-200 pb-4 dark:border-gray-700">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                                isActive(item.href)
                                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            }`}
                        >
                            {item.icon}
                            <span className="ml-2">
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
