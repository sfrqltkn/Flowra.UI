/** @type {import('tailwindcss').Config} */
module.exports = {
  // ThemeService ile uyumlu çalışması için dark mode'u 'class' yapıyoruz
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts,scss}", // Angular dosyalarını tara
  ],
  theme: {
    extend: {
      // İstersen SCSS'teki renklerini Tailwind'e de tanıtabilirsin
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        darkSurface: '#1A1A2E',
      }
    },
  },
  plugins: [],
}
