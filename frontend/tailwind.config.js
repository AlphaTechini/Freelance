/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Light mode colors
        primary: {
          bg: '#ffffff',
          'bg-secondary': '#f8f9fa',
          'bg-card': '#ffffff',
          text: '#212529',
          'text-secondary': '#6c757d',
          border: '#dee2e6',
        },
        // Dark mode colors (will be applied via CSS variables)
        dark: {
          bg: '#000000',
          'bg-secondary': '#1a1a1a',
          'bg-card': '#2d2d2d',
          text: '#ffffff',
          'text-secondary': '#b0b0b0',
          border: '#404040',
        },
        // Accent colors
        accent: {
          DEFAULT: '#ff6b35',
          hover: '#e55a2b',
          'dark-hover': '#ff7f4d',
        },
        // Status colors
        success: {
          DEFAULT: '#28a745',
          dark: '#4caf50',
        },
        warning: {
          DEFAULT: '#ffc107',
          dark: '#ffeb3b',
        },
        error: {
          DEFAULT: '#dc3545',
          dark: '#f44336',
        },
      },
      fontSize: {
        'heading-1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-4': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-large': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'focus': '0 0 0 3px rgba(255, 107, 53, 0.1)',
      },
      animation: {
        'loading': 'loading 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in': 'slideIn 0.4s ease',
        'scale-in': 'scaleIn 0.2s ease',
      },
      keyframes: {
        loading: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}