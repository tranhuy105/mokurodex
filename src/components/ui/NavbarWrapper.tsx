"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  // Don't show navbar in reader pages - pattern is /manga/[manga]/[volume]/[page]
  if (pathname && pathname.match(/\/manga\/[^\/]+\/[^\/]+\/\d+/)) {
    return null;
  }
  return <Navbar />;
}
