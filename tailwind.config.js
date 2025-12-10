/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 CRITICAL FIX: The 'content' array must list your source files
  content: [
    // Include all files that contain Tailwind class names
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}