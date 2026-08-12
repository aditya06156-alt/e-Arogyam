/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        govt: {
          navy: '#0F2942',        // Primary Header Navy
          darknavy: '#0B1E31',    // Dark Navy
          blue: '#1A365D',        // Accent Blue
          lightblue: '#EBF8FF',   // Subtle Blue Highlight
          gray: '#F8FAFC',        // Body background
          border: '#CBD5E1',      // Crisp table border
          text: '#1E293B',        // High-contrast primary text
          muted: '#64748B',       // Secondary text
        },
        status: {
          normalBg: '#F0FDF4',
          normalText: '#15803D',
          normalBorder: '#BBF7D0',
          spoiledBg: '#FEF2F2',
          spoiledText: '#B91C1C',
          spoiledBorder: '#FCA5A5',
          warningBg: '#FFFBEB',
          warningText: '#B45309',
          warningBorder: '#FDE68A',
        }
      },
      borderRadius: {
        'govt': '4px',           // Sharp official corner style
      }
    },
  },
  plugins: [],
}
