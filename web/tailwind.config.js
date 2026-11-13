/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // o app já tem um reset próprio (styles/base.css); o preflight do Tailwind mudaria o visual
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surf: 'var(--surf)', surf2: 'var(--surf2)',
        bd: 'var(--bd)', bd2: 'var(--bd2)', tx: 'var(--tx)', mu: 'var(--mu)', sub: 'var(--sub)',
        ink: 'var(--ink)', acc: 'var(--acc)', acc2: 'var(--acc2)',
        // cores de cada tipo de evento (iguais aos ícones)
        fogo: '#E8590C', agua: '#1C7ED6', arvore: '#2F9E44', solo: '#B8692A', vento: '#D4A20B', tornado: '#5B6575',
        navy: { 950: '#071427', 900: '#0C2342', 800: '#102D55' },
        amber: { band: '#F08C00' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Space Grotesk"', 'Inter', 'sans-serif'] },
      boxShadow: {
        panel: '0 18px 40px rgba(12,35,66,.22), 0 2px 6px rgba(12,35,66,.14)',
        glass: 'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -12px 24px rgba(0,0,0,.18), 0 8px 18px rgba(0,0,0,.28)',
      },
    },
  },
  plugins: [],
}
