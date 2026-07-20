import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { DisclaimerGate } from './components/DisclaimerGate';
import { AdMobBootstrap } from './components/AdMobBootstrap';

const ScanPage = lazy(() => import('./pages/ScanPage').then((m) => ({ default: m.ScanPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ManualAddPage = lazy(() => import('./pages/ManualAddPage').then((m) => ({ default: m.ManualAddPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));

function PageFallback() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <DisclaimerGate>
      <AdMobBootstrap />
      <div className="app-shell flex min-h-screen flex-col bg-neutral-50 pt-[var(--admob-banner-offset,0px)] sm:flex-col-reverse">
        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<ScanPage />} />
              <Route path="/urun/:barcode" element={<ProductPage />} />
              <Route path="/gecmis" element={<HistoryPage />} />
              <Route path="/favoriler" element={<FavoritesPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/urun-ekle/:barcode" element={<ManualAddPage />} />
              <Route path="/hakkinda" element={<AboutPage />} />
            </Routes>
          </Suspense>
        </main>
        <NavBar />
      </div>
    </DisclaimerGate>
  );
}
