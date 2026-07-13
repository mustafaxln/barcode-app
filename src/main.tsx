import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Not: Önceden 5 dakikaydı; aynı barkodu tekrar açtığınızda eski (test/geliştirme
      // sırasında düzeltilmiş) sonucun ekranda kalmasına sebep oluyordu. Ürün verisi zaten
      // nadiren değişiyor, kısa bir cache yine de tekrar taramalarda gereksiz isteği önlüyor.
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
