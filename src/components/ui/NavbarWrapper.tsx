"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
    const pathname = usePathname();
    // Don't show navbar in reader pages - pattern is reader/*
    if (pathname && pathname.match(/\/reader\/*/)) {
        return null;
    }
    return <Navbar />;
}
