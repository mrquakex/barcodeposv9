import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Bir hata oluştu</h1>
            <p className="text-muted-foreground">
              Üzgünüz, beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  Hata detayları (geliştirme modu)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Ana Sayfaya Dön
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

