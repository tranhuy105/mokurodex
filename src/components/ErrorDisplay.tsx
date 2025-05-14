"use client";

import React from "react";

interface ErrorDisplayProps {
  error: Error | string;
  resetError?: () => void;
}

/**
 * A component for displaying errors in a user-friendly way
 */
export default function ErrorDisplay({ error, resetError }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-xl w-full p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-red-600 dark:text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">
          Something went wrong
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-40">
          <p className="font-mono text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : error}
          </p>
        </div>
        {resetError && (
          <div className="text-center">
            <button
              onClick={resetError}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
