export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'auctus-navy': '#1E3A5F',
        'auctus-teal': '#18A098',
        'auctus-cyan': '#00B4D8'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 15px rgba(24,160,152,0.4)',
        'glow-hover': '0 0 25px rgba(24,160,152,0.6)'
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        gradient: 'gradient 8s ease infinite',
        blob: 'blob 10s infinite alternate',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(50px, -70px) scale(1.1)' },
          '66%': { transform: 'translate(-40px, 30px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: []
}
