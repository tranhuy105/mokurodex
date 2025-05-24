"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CustomErrorPageProps {
  error?: Error | string;
  reset?: () => void;
}

export default function CustomErrorPage({
  error,
  reset,
}: CustomErrorPageProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
        {/* Orange header bar */}
        <div className="h-2 bg-gradient-to-r from-orange-600 to-orange-400"></div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-orange-500/10 p-3">
              <AlertTriangle size={28} className="text-orange-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Oops! Something went wrong
          </h1>

          <p className="text-zinc-400 text-center mb-6">
            We encountered an unexpected error. Please try again or return to
            the home page.
          </p>

          {errorMessage && (
            <div className="mb-6 p-3 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <p className="font-mono text-sm text-orange-400 break-words">
                {errorMessage}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {reset && (
              <Button
                onClick={reset}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Try Again
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Link href="/">Go to Home Page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
