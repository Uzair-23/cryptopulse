/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        textMuted: 'var(--text-muted)',
        'text-muted': 'var(--text-muted)',
        textFaint: 'var(--text-faint)',
        'text-faint': 'var(--text-faint)',
        accent: 'var(--accent)',
        bull: 'var(--bull)',
        bear: 'var(--bear)',
        warn: 'var(--warn)',
        star: 'var(--star)',
        ai: 'var(--ai)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
