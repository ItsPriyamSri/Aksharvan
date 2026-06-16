import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-twilight': 'var(--bg-twilight)',
        'bg-forest-dark': 'var(--bg-forest-dark)',
        surface: 'var(--surface)',
        forest: 'var(--forest)',
        'forest-deep': 'var(--forest-deep)',
        magic: 'var(--magic)',
        firefly: 'var(--firefly)',
        'firefly-glow': 'var(--firefly-glow)',
        tina: 'var(--tina)',
        toto: 'var(--toto)',
        success: 'var(--success)',
        ink: 'var(--ink)',
      },
      fontFamily: {
        baloo2: ['var(--font-baloo2)', 'sans-serif'],
        mukta: ['var(--font-mukta)', 'sans-serif'],
        tiroDevanagariHindi: ['var(--font-tiro-devanagari-hindi)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
