import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AboutPage } from '@/pages/AboutPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
    </Routes>
  );
}
