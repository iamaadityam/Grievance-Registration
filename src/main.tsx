import React, { StrictMode, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global event listeners to catch unhandled script errors and log them cleanly
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[Global Script Error Intercepted]:", {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    let message = "";
    if (event.reason) {
      if (event.reason instanceof Error) {
        message = `${event.reason.name}: ${event.reason.message}\nStack: ${event.reason.stack}`;
      } else {
        try {
          message = typeof event.reason === "object" ? JSON.stringify(event.reason) : String(event.reason);
        } catch (_) {
          message = String(event.reason);
        }
      }
    } else {
      message = "No reason provided";
    }
    console.error("[Unhandled Promise Rejection Intercepted]:", message);
  });
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  props!: Props;
  state!: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught React Error]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-950/50 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-sm font-black uppercase text-slate-200 tracking-wider">Portal Interface Exception</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                A browser interface or script error occurred while loading this portal view. This is often caused by restricted browser permissions inside sandboxed frames.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-[10px] font-mono text-red-400 max-h-40 overflow-y-auto whitespace-pre-wrap break-all leading-normal">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md active:scale-95"
            >
              Reload Portal View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

