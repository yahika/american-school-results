import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a2558',
          light: '#1a3a6b',
          dark: '#061830',
        },
        gold: {
          DEFAULT: '#c8972b',
          light: '#e5b850',
          dark: '#a07820',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
        latin: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
