import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TourProvider } from './context/TourContext';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { Onboarding } from './components/shared/Onboarding';
import { WifiOff } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MoMoStudio = lazy(() => import('./pages/MoMoStudio').then(m => ({ default: m.MoMoStudio })));
const MoMofoglio = lazy(() => import('./pages/MoMofoglio').then(m => ({ default: m.MoMofoglio })));
const MoMolista = lazy(() => import('./pages/MoMolista').then(m => ({ default: m.MoMolista })));
const MoMoBnB = lazy(() => import('./pages/MoMoBnB').then(m => ({ default: m.MoMoBnB })));
const ItinerariSalvati = lazy(() => import('./pages/ItinerariSalvati').then(m => ({ default: m.ItinerariSalvati })));
const SharedTour = lazy(() => import('./pages/SharedTour').then(m => ({ default: m.SharedTour })));

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;
  return (
    <div className="fixed top-14 left-0 right-0 bg-red-500 text-white text-xs font-medium py-1.5 px-4 flex justify-center items-center gap-2 z-40 transition-all duration-300">
      <WifiOff size={14} />
      <span>Sei offline — mappa non disponibile.</span>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col space-y-4 p-4 animate-pulse pt-20">
      <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-20 bg-gray-200 rounded-xl w-full mt-4"></div>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F7F7] font-sans text-[#222222] transition-colors duration-300">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:p-3 focus:bg-white focus:text-[#FF5A5F] focus:rounded-lg focus:shadow-lg focus:font-bold">
        Vai al contenuto principale
      </a>
      <Onboarding />
      <TopBar />
      <OfflineBanner />
      
      <main id="main-content" className="pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] min-h-[100dvh] overflow-y-auto no-scrollbar">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/studio/:tappaId?" element={<MoMoStudio />} />
            <Route path="/foglio" element={<MoMofoglio />} />
            <Route path="/lista" element={<MoMolista />} />
            <Route path="/bnb" element={<MoMoBnB />} />
            <Route path="/itinerari" element={<ItinerariSalvati />} />
            <Route path="/shared/*" element={<SharedTour />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <TourProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TourProvider>
  );
}

export default App;
