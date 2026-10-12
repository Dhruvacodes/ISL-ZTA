/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#07070A',
          subtle: '#0B0B10',
          panel: '#0E0E15',
          card: '#12121A',
        },
        action: {
          allow: '#10B981',
          mfa: '#F59E0B',
          restrict: '#3B82F6',
          deny: '#EF4444',
          quarantine: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow-violet': '0 0 50px -10px rgba(139, 92, 246, 0.25)',
        'glow-blue': '0 0 50px -10px rgba(59, 130, 246, 0.25)',
        'glow-mint': '0 0 40px -10px rgba(16, 185, 129, 0.2)',
      },
      keyframes: {
        pulseFast: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        flashVeto: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.9)' },
          '50%': { boxShadow: '0 0 25px 4px rgba(239, 68, 68, 0.8)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
      },
      animation: {
        'pulse-fast': 'pulseFast 1.5s ease-in-out infinite',
        'flash-veto': 'flashVeto 0.6s ease-out',
      },
    },
  },
  plugins: [],
}
