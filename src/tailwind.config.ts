import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070B14',
          900: '#0D1322',
          800: '#131C31',
        },
        signal: {
          violet: '#8B5CF6',
          teal: '#14B8A6',
          rose: '#F43F5E',
          amber: '#F59E0B',
          emerald: '#10B981',
        },
      },
    },
  },
  plugins: [],
};
export default config;
