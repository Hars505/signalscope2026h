/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--background-secondary)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          secondary: 'var(--foreground-secondary)',
          muted: 'var(--foreground-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          border: 'var(--accent-border)',
          highlight: 'var(--accent-highlight)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        icon: {
          DEFAULT: 'var(--icon)',
          muted: 'var(--icon-muted)',
        },
        forest: {
          950: '#06130E',
          900: '#0B2B1F', // primary text light
          850: '#0D331E',
          800: '#103D24',
          700: '#144629',
          600: '#1B5B36',
          500: '#257446',
        },
        sage: {
          900: '#0B241A',
          800: '#0E2D21',
          700: '#49665A', // secondary text light
          600: '#5A7A6C',
          500: '#71867C', // muted captions light
          400: '#8DAA98',
          300: '#A8C7B8', // secondary text dark
          200: '#DDF5EA', // soft accent light
          100: '#EEF5F0', // secondary surface light
          50: '#F4F8F5',  // base background light
        },
        mint: {
          50: '#F4F8F5',
          100: '#EEF5F0',
          200: '#DDF5EA',
          300: '#A9DEC8',
          400: '#8DE8C5',
          500: '#21C58A',
        },
        dark: {
          950: '#06130E',
          900: '#091B14',
          850: '#0B241A',
          800: '#0E2D21',
          700: '#103A2A',
          600: '#1B6348',
        },
        brand: {
          lime: '#21C58A',
          emerald: '#12A879',
          forest: '#0B2B1F',
          sage: '#49665A',
          indigo: '#12A879',
          violet: '#0D9168',
          cyan: '#21C58A',
          teal: '#12A879',
          amber: '#F59E0B',
          rose: '#E11D48',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 16px -2px rgba(22, 168, 98, 0.25)',
        'glow-md': '0 0 30px -4px rgba(22, 168, 98, 0.35)',
        'glow-lg': '0 0 50px -6px rgba(22, 168, 98, 0.40)',
        'glow-btn': '0 10px 25px -4px rgba(22, 168, 98, 0.45)',
        'glow-cyan': '0 0 35px -5px rgba(20, 184, 166, 0.35)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2.4s ease-in-out infinite alternate',
        'beam': 'beam 4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)', opacity: '0.85' },
          '100%': { transform: 'translateY(100%)', opacity: '0.4' },
        },
        beam: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.98)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
};
