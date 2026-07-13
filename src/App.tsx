import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ScanPage } from './pages/ScanPage';
import { ProductPage } from './pages/ProductPage';
import { HistoryPage } from './pages/HistoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ManualAddPage } from './pages/ManualAddPage';

export function App() {
  return (
    <div className="flex min-h-screen flex-col sm:flex-col-reverse">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/urun/:barcode" element={<ProductPage />} />
          <Route path="/gecmis" element={<HistoryPage />} />
          <Route path="/favoriler" element={<FavoritesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/urun-ekle/:barcode" element={<ManualAddPage />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
