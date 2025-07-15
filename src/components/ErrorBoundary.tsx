import React, { Component, ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: undefined,
  };

  // Update state when an error occurs
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  // Optional: Log error details for debugging
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in TransactionListDemo:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong while displaying transactions.</h2>
          <p>{this.state.errorMessage || "Unknown error occurred."}</p>
          <button onClick={() => this.setState({ hasError: false, errorMessage: undefined })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}