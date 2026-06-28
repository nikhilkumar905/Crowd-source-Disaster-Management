/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Bricolage Grotesque', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      colors: {
        brand: {
          blue: '#2563eb',
          red: '#ef4444',
          ink: '#0b1220'
        }
      }
    }
  },
  plugins: []
};
