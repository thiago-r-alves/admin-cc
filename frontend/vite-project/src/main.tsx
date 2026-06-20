// src/main.tsx

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const DriverPage = React.lazy(() => import('./pages/DriverPage'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div />}> 
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/motorista" element={<DriverPage />} /> {/* Adicione a rota do motorista */}
        </Routes>
      </Suspense>
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);

// Remove the pre-rendered header and mark JS enabled to hide the placeholder
setTimeout(() => {
  try {
    document.documentElement.classList.remove('js-disabled');
    const el = document.getElementById('preload-header');
    if (el) el.remove();
  } catch {
    // ignore
  }
}, 0);
