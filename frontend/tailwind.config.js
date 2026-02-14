/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: '#2E5BFF', // Electric Blue (AA compliant on white)
          dark: '#1E40AF',
          light: '#60A5FA',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#1E293B', // Slate 800
          light: '#475569',
          dark: '#0F172A',
        },
        accent: {
          DEFAULT: '#FCB900',  // Vivid Yellow (Use for backgrounds with dark text)
          hover: '#E5A800',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        neon: '#39FF14',
        coral: '#FF7F50',
        electric: '#2E5BFF',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px (Body Text Minimum)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px (H3)
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px (H2)
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px (H1 Mobile)
        '5xl': ['3rem', { lineHeight: '1.1' }],        // 48px (H1 Desktop)
        '6xl': ['3.75rem', { lineHeight: '1.1' }],     // 60px
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
        '48': '192px',
        '56': '224px',
        '64': '256px',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
      },
    },
  },
  plugins: [],
}
