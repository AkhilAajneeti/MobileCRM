import React from "react";
import Icon from "./AppIcon";
import ErrorCharacter from "./ErrorCharacter";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
    // The detail stays in the console for whoever is debugging. It is
    // deliberately never put on screen: the person who hits this is trying
    // to do their job, and a stack trace only makes a bad moment worse.
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    // HashRouter: set the route first, then reload so state rebuilds clean.
    window.location.hash = "#/dashboard";
    window.location.reload();
  };

  render() {
    if (!this.state?.hasError) return this.props?.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 pt-safe-gap">
        <div className="w-full max-w-sm text-center">
          <ErrorCharacter className="mx-auto h-44 w-44 sm:h-52 sm:w-52" />

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Let's try that again
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            This page didn't finish loading. A quick refresh usually sorts it —
            nothing you've done has been lost.
          </p>

          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="group linearbg-1 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-semibold text-white shadow-cta-glow transition-all duration-150 active:scale-[0.98]"
            >
              <Icon
                name="RefreshCw"
                size={18}
                className="transition-transform duration-500 group-hover:rotate-180 group-active:animate-spin"
              />
              Refresh the page
            </button>

            <button
              type="button"
              onClick={this.handleHome}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-all duration-150 active:scale-[0.98] active:bg-muted"
            >
              <Icon name="ArrowLeft" size={16} />
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
