import React from "react";

export type ErrorBoundaryProps = {
  name?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: unknown;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown): void {
     
    console.error("ErrorBoundary caught", this.props.name ?? "component", error, info);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const message =
      this.state.error instanceof Error
        ? this.state.error.message
        : this.state.error
          ? String(this.state.error)
          : "Unknown error";

    return (
      <div className="rounded-2xl bg-rose-950/30 p-4 text-rose-50">
        <div className="text-sm font-semibold">{this.props.name ?? "Something"} crashed</div>
        <div className="mt-2 text-xs opacity-90">{message}</div>
      </div>
    );
  }
}
