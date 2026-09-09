import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'burnt-brown':       '#3E1F0A', // PWA primary
        'burnt-brown-dark':  '#2C1406', // PWA primary-dark
        'burnt-brown-light': '#5C2F12', // PWA primary-light
        'burnt-brown-pale':  '#F5F5F4', // PWA soft-surface
        'mustard':           '#E1AD01', // PWA accent
        'mustard-light':     '#F0C832', // PWA accent-light
        'mustard-pale':      '#FFF8E1',
        'mustard-border':    '#F0C832',
        'off-white':         '#FAFAF9', // PWA background
        'clay-surface':      '#FFFFFF', // PWA surface
        'text-primary':      '#2D1B12', // PWA text-primary
        'text-secondary':    '#6B4F3A', // PWA text-secondary
        'text-tertiary':     '#A08070', // PWA text-tertiary
        'clay-border':       '#E7DCD4', // PWA border
        'clay-border-light': '#F0E8E2', // PWA border-light
        'status-success':    '#4CAF50', // PWA status-success
        'status-warning':    '#FF9800', // PWA status-warning
        'status-error':      '#E53935', // PWA status-error
        'status-info':       '#2196F3', // PWA status-info
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'clay':   '20px',
        'clay-sm':'12px',
        'clay-lg':'28px',
        'pill':   '9999px',
      },
      boxShadow: {
        'clay':     '0 8px 32px rgba(139,69,19,0.10), 0 2px 8px rgba(139,69,19,0.06)',
        'clay-sm':  '0 4px 16px rgba(139,69,19,0.08)',
        'clay-lg':  '0 16px 48px rgba(139,69,19,0.14), 0 4px 16px rgba(139,69,19,0.08)',
        'clay-hover':'0 12px 40px rgba(139,69,19,0.16), 0 4px 12px rgba(139,69,19,0.10)',
        'clay-inset':'inset 0 2px 6px rgba(139,69,19,0.08)',
        'sidebar':   '4px 0 24px rgba(107,51,16,0.18)',
        'sidebar-pill': '0 8px 40px rgba(107,51,16,0.28), 0 2px 12px rgba(107,51,16,0.18), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #3E1F0A 0%, #2C1406 100%)',
        'btn-primary':      'linear-gradient(135deg, #3E1F0A 0%, #2C1406 100%)',
        'btn-mustard':      'linear-gradient(135deg, #F0C832 0%, #E1AD01 100%)',
        'kpi-gradient-1':   'linear-gradient(135deg, #FFF8E1 0%, #FFFFFF 100%)',
        'kpi-gradient-2':   'linear-gradient(135deg, #F5EDE6 0%, #FFFFFF 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-right':'slideRight 0.3s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config