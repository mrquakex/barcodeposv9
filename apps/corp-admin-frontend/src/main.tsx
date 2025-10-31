import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { queryClient } from './lib/query-client';

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);


