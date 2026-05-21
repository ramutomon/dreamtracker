/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#F97316',
          amber:  '#FB923C',
          navy:   '#0F172A',
          slate:  '#1E293B',
          muted:  '#334155',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1C1917 100%)',
      },
    },
  },
  plugins: [],
}
