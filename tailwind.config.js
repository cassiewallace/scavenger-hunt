import { COLORS } from './src/constants/brand.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:             COLORS.bg,
          surface:        COLORS.surface,
          surfaceActive:  COLORS.surfaceActive,
          border:         COLORS.border,
          magenta:        COLORS.magenta,
          magentaVibrant: COLORS.magentaVibrant,
          teal:           COLORS.teal,
          blue:           COLORS.blue,
          lavender:       COLORS.lavender,
          primary:        COLORS.primary,
          secondary:      COLORS.secondary,
          success:        COLORS.success,
          error:          COLORS.error,
          warning:        COLORS.warning,
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      keyframes: {
        'green-flash': {
          '0%':   { backgroundColor: '#0a3d24' },
          '100%': { backgroundColor: 'transparent' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'green-flash': 'green-flash 1.2s ease-out forwards',
        'slide-in':    'slide-in 0.35s ease-out forwards',
        'fade-in':     'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
