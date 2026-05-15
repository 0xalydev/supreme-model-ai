/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        g0: '#0c0d0f',
        g1: '#131417',
        g2: '#1a1b1f',
        g3: '#23252a',
        g4: '#2e3036',
        fg: '#eef0f2',
        fg2: '#a3a8b0',
        fg3: '#6c717a',
        edge: 'rgba(255, 255, 255, 0.12)',
        edge2: 'rgba(255, 255, 255, 0.20)',
        green: '#e8ebef',
      },
      borderRadius: {
        'r': '22px',
      }
    },
  },
  plugins: [],
}
