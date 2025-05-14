"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorDisplay from "./ErrorDisplay";

interface Props {
  children: ReactNode;
  fallback?:
    | React.ReactNode
    | React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to handle unexpected errors
 * Provides a fallback UI when child components throw errors
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Render fallback UI
      if (this.props.fallback) {
        if (React.isValidElement(this.props.fallback)) {
          return this.props.fallback;
        }

        if (typeof this.props.fallback === "function") {
          const FallbackComponent = this.props.fallback;
          return (
            <FallbackComponent
              error={this.state.error}
              resetError={this.resetError}
            />
          );
        }
      }

      // Default error UI
      return (
        <ErrorDisplay error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}
