import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageContainer } from './components/layout/PageContainer';
import { BackgroundEffects } from './components/background/BackgroundEffects';
import { Home } from './pages/Home';
import { Analyze } from './pages/Analyze';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { About } from './pages/About';
import { ScrollToTopButton } from './components/ui/ScrollToTopButton';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageContainer maxWidth="max-w-7xl">
            <Home />
          </PageContainer>
        }
      />
      <Route
        path="/analyze"
        element={
          <PageContainer maxWidth="max-w-5xl">
            <Analyze />
          </PageContainer>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PageContainer maxWidth="max-w-6xl">
            <Dashboard />
          </PageContainer>
        }
      />
      <Route
        path="/history"
        element={
          <PageContainer maxWidth="max-w-6xl">
            <History />
          </PageContainer>
        }
      />
      <Route
        path="/about"
        element={
          <PageContainer maxWidth="max-w-5xl">
            <About />
          </PageContainer>
        }
      />
    </Routes>
  );
}

export const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        {/* Global dedicated fixed background container */}
        <BackgroundEffects />

        <div className="relative z-10 flex flex-col min-h-screen bg-transparent text-foreground selection:bg-[var(--accent-soft)] selection:text-[var(--foreground)] transition-colors duration-300">
          <Navbar />
          <div className="flex-1">
            <MainRoutes />
          </div>
          <Footer />
          <ScrollToTopButton />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
