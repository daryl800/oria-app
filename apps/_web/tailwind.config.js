/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0614',
        foreground: '#FFFFFF',
        card: {
          DEFAULT: '#2D1B54',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#9333EA',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#3D2660',
          foreground: '#9B8AB0',
        },
        primary: {
          DEFAULT: '#9333EA',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#3D1F6B',
          foreground: '#D8B4FE',
        },
        border: 'rgba(192,132,252,0.25)',
        input: '#2D1B54',
        ring: '#C084FC',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
