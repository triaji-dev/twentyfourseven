import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        metamorphous: ['"Metamorphous"', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config;
