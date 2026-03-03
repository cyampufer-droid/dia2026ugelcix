import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleClearCache = async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      // Clear localStorage cache markers
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('workbox-') || key.startsWith('vite-')) {
          localStorage.removeItem(key);
        }
      }
      // Force reload without cache
      window.location.replace(window.location.origin + '/login');
    } catch (e) {
      console.error('Error clearing cache:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="text-center max-w-md space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground">
              Ocurrió un error inesperado. Esto suele ocurrir cuando hay una actualización pendiente. Pruebe limpiar la caché del navegador.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted rounded-lg p-3 max-h-32 overflow-auto">
                <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
              </details>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleClearCache} className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                Limpiar Caché y Reiniciar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={this.handleGoBack} className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Ir al Inicio
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recargar
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
