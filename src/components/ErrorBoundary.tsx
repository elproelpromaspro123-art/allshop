'use client';

import React, { ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary genérico para capturar errores en React
 * Loguea automáticamente a través del logger centralizado
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log al logger centralizado
    logger.error(
      `Error Boundary caught error in ${this.props.name || 'component'}`,
      error,
      {
        componentName: this.props.name,
        componentStack: errorInfo.componentStack,
      }
    );

    // Callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md text-center">
              <div className="mb-4 inline-block rounded-full bg-red-100 p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">Algo salió mal</h1>
              <p className="mb-6 text-gray-600">
                Ocurrió un error inesperado. Hemos registrado el incidente y lo resolveremos pronto.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 rounded-lg bg-red-50 p-3 text-left">
                  <p className="mb-1 text-xs font-mono font-bold text-red-800">
                    {this.state.error.name}
                  </p>
                  <p className="text-xs text-red-700">{this.state.error.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={this.handleReset} className="flex-1">
                  Reintentar
                </Button>
                <Button onClick={() => window.location.href = '/'} className="flex-1">
                  Ir al inicio
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
