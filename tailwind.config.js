const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.resolve(__dirname, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}