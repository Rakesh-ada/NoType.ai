module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa'
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#34d399'
        },
        dark: {
          DEFAULT: '#1f2937',
          light: '#374151',
          dark: '#111827'
        },
        light: {
          DEFAULT: '#f3f4f6',
          dark: '#e5e7eb',
          darker: '#d1d5db'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'neomorphic': '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
        'neomorphic-dark': '8px 8px 16px #111827, -8px -8px 16px #1f2937',
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)'
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}; 