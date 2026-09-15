import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ArrowRight, Activity, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { isMockModeEnabled, setMockModePreference } from '../../lib/api';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mockMode, setMockMode] = useState(isMockModeEnabled());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMock = () => {
    const next = !mockMode;
    setMockMode(next);
    setMockModePreference(next);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Analyze', path: '/analyze' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'History', path: '/history' },
    { name: 'Technology', path: '/about' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${isScrolled
          ? 'bg-[rgba(244,248,245,0.90)] dark:bg-[rgba(6,19,14,0.92)] backdrop-blur-[18px] border-b border-[#A9DEC8]/60 dark:border-[#1B6348]/50 shadow-[0_4px_20px_rgba(11,43,31,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}>
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] group-hover:border-[#12A879] dark:group-hover:border-[#21C58A] transition-all duration-300 shadow-xs text-[#12A879] dark:text-[#21C58A]">
              <div className="w-4.5 h-4.5 rounded-full border-2 border-[#12A879] dark:border-[#21C58A] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12A879] dark:bg-[#21C58A]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#0B2B1F] dark:text-[#E7F5EE] font-sans flex items-center gap-1">
                Signal Scope
              </span>
              <span className="text-[9.5px] tracking-widest uppercase font-mono text-[#49665A] dark:text-[#A8C7B8] -mt-1 font-semibold">
                FORENSICS AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Capsule */}
          <nav className="hidden md:flex items-center gap-1 bg-white/90 dark:bg-[#0B241A]/90 p-1.5 rounded-full border border-[#A9DEC8]/70 dark:border-[#1B6348]/70 backdrop-blur-[18px] shadow-[0_2px_12px_rgba(11,43,31,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:-translate-y-[1px] select-none ${isActive
                      ? 'text-[#0B2B1F] dark:text-[#E7F5EE] font-semibold'
                      : 'text-[#49665A] dark:text-[#A8C7B8] hover:text-[#0B2B1F] dark:hover:text-[#E7F5EE] hover:bg-[#EEF5F0] dark:hover:bg-[#103A2A]/60'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-[#DDF5EA] dark:bg-[#103A2A] rounded-full shadow-xs border border-[#A9DEC8] dark:border-[#1B6348] -z-10"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Mock Mode Switcher */}
            <button
              onClick={toggleMock}
              title={mockMode ? 'Mock Mode active (simulated ML engine)' : 'Live API Mode (connected to Django backend)'}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-white/90 dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] hover:border-[#12A879] dark:hover:border-[#21C58A] text-[#49665A] dark:text-[#A8C7B8] hover:text-[#0B2B1F] dark:hover:text-[#E7F5EE] transition-colors backdrop-blur-md shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A]" />
              <span className="font-mono text-[11px] font-medium">{mockMode ? 'Mock Engine' : 'Live API:8000'}</span>
              {mockMode ? (
                <ToggleRight className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-[#71867C] dark:text-[#769789]" />
              )}
            </button>

            {/* Analyze CTA */}
            <Button
              size="sm"
              onClick={() => navigate('/analyze')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-[#12A879] hover:bg-[#0D9168] dark:bg-[#21C58A] dark:hover:bg-[#36D99B] text-white dark:text-[#06130E] dark:font-bold shadow-[0_4px_14px_rgba(18,168,121,0.35)] dark:shadow-[0_0_20px_rgba(33,197,138,0.35)]"
            >
              Analyze Image
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#0B2B1F] dark:text-[#E7F5EE]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(244,248,245,0.98)] dark:bg-[rgba(6,19,14,0.98)] backdrop-blur-2xl border-b border-[#A9DEC8]/70 dark:border-[#1B6348]/70 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${isActive
                      ? 'bg-[#DDF5EA] dark:bg-[#103A2A] text-[#0B2B1F] dark:text-[#E7F5EE] font-semibold border border-[#A9DEC8] dark:border-[#1B6348]'
                      : 'text-[#49665A] dark:text-[#A8C7B8] hover:bg-[#EEF5F0] dark:hover:bg-[#103A2A]/40'
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#A9DEC8]/40 dark:border-[#1B6348]/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/60 dark:border-[#1B6348] text-xs text-[#49665A] dark:text-[#A8C7B8]"
              >
                {isDark ? <Moon className="w-4 h-4 text-[#21C58A]" /> : <Sun className="w-4 h-4 text-[#0B2B1F]" />}
                <span>Theme: {isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </button>
              <button
                onClick={toggleMock}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/60 dark:border-[#1B6348] text-xs text-[#49665A] dark:text-[#A8C7B8]"
              >
                <Activity className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
                <span className="font-mono">{mockMode ? 'Mock ML' : 'Live API'}</span>
              </button>
            </div>

            <Button
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/analyze');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full justify-center rounded-xl bg-[#12A879] hover:bg-[#0D9168] dark:bg-[#21C58A] dark:hover:bg-[#36D99B] text-white dark:text-[#06130E] dark:font-bold"
            >
              Start Forensic Scan
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
