import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
<<<<<<< HEAD
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
=======
        'burnt-brown':       '#8B4513',
        'burnt-brown-dark':  '#6B3310',
        'burnt-brown-light': '#A0522D',
        'burnt-brown-pale':  '#F5EDE6',
        /* A11Y-FIX (QA-A11Y-003): #D4821A is 2.99:1 on white — the worst contrast in the
           audit, and it is what both navigational links on the login page are painted in
           ("Forgot password?" and "Sign up"). #9A5C0D is 5.37:1, clears the 4.5:1 minimum
           for body text, and stays in the same mustard family. The bright #F5A623 is kept
           as mustard-light for fills, borders and gradients, where 3:1 is the relevant
           threshold and the brighter tone is wanted.
           This darkens ~150 `text-mustard` usages across the app at once, and also fixes
           white-on-mustard fills, which were failing in the other direction. */
        'mustard':           '#9A5C0D',
        'mustard-light':     '#F5A623',
        'mustard-pale':      '#FFF8E1',
        'mustard-border':    '#F0D080',
        'off-white':         '#FAFAF8',
        'clay-surface':      '#FFFFFF',
        'text-primary':      '#1C0A00',
        'text-secondary':    '#6B4C3B',
        /* A11Y-FIX (QA-A11Y-003): #A07860 is 3.93:1 on white. #8A6248 is 5.36:1. */
        'text-tertiary':     '#8A6248',
        'clay-border':       '#E7DCD4',
        'clay-border-light': '#F2EDE8',
        'status-success':    '#38A169',
        'status-warning':    '#9A5C0D',
        'status-error':      '#E53E3E',
        'status-info':       '#3182CE',
>>>>>>> 7d4a844803e0cdf23d4765098cb6ab2a39a07649
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