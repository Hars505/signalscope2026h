import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[#A9DEC8]/60 dark:border-[rgba(141,232,197,0.14)] bg-white/85 dark:bg-[#091B14] backdrop-blur-md relative z-10 pt-16 pb-12 overflow-hidden transition-colors duration-300">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-[#12A879] dark:text-[#21C58A]">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#12A879] dark:border-[#21C58A] flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#12A879] dark:bg-[#21C58A]" />
                </div>
              </div>
              <span className="text-base font-bold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight">
                Signal<span className="text-[#12A879] dark:text-[#21C58A]">Scope</span>
              </span>
            </Link>
            <p className="text-xs text-[#49665A] dark:text-[#A8C7B8] leading-relaxed">
              Automated multi-spectral image authenticity detection. Fusing spatial vision transformers with frequency-domain residual analysis for calibrated forensic verification.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF5F0] dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] text-[11px] font-mono text-[#49665A] dark:text-[#A8C7B8] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#12A879] dark:bg-[#21C58A] animate-pulse" />
              ViT-B/16 + 2D-FFT Core
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B2B1F] dark:text-[#E7F5EE] mb-4 font-mono">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[#49665A] dark:text-[#A8C7B8]">
              <li>
                <Link to="/analyze" className="hover:text-[#12A879] dark:hover:text-[#36D99B] hover:underline underline-offset-4 transition-colors">
                  Image Analysis Tool
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#12A879] dark:hover:text-[#36D99B] hover:underline underline-offset-4 transition-colors">
                  Forensic Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-[#12A879] dark:hover:text-[#36D99B] hover:underline underline-offset-4 transition-colors">
                  Telemetry History
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#12A879] dark:hover:text-[#36D99B] hover:underline underline-offset-4 transition-colors">
                  Architecture & Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B2B1F] dark:text-[#E7F5EE] mb-4 font-mono">
              AI Forensics
            </h4>
            <ul className="space-y-2.5 text-sm text-[#49665A] dark:text-[#A8C7B8]">
              <li>
                <span>Spatial ViT-B/16 Encoder</span>
              </li>
              <li>
                <span>2D FFT Spectral Decomposition</span>
              </li>
              <li>
                <span>Temperature Logit Calibration</span>
              </li>
              <li>
                <span>Grad-CAM Thermal Attention</span>
              </li>
              <li>
                <span>Degradation Robustness Tests</span>
              </li>
            </ul>
          </div>

          {/* Responsible AI Disclaimer Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B2B1F] dark:text-[#E7F5EE] mb-4 font-mono">
              Responsible AI Statement
            </h4>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[rgba(141,232,197,0.18)] text-xs text-[#49665A] dark:text-[#A8C7B8] leading-relaxed shadow-xs">
              SignalScope outputs empirical likelihood assessments, not absolute proof of authenticity. Assessments should be verified by forensic human experts for mission-critical decisions.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#A9DEC8]/40 dark:border-[rgba(141,232,197,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71867C] dark:text-[#769789]">
          <p>© 2026 SignalScope. AI-Powered Image Authenticity Platform.</p>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>React + Vite Frontend</span>
            <span>REST API Bridge</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
