/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#236B4E',
          50: '#EFF7F2',
          100: '#DCEEE3',
          200: '#B9DDC8',
          300: '#8FC7A8',
          400: '#57A37E',
          500: '#358762',
          600: '#236B4E',
          700: '#1C563E',
          800: '#164331',
          900: '#0F2E22',
        },
        sage: '#A8D5BA',
        mint: '#DDF3E4',
        cream: '#FAF9F4',
        peach: '#FFE2D1',
        lavender: '#E9E4FA',
        accent: {
          DEFAULT: '#F4A261',
          soft: '#FBD9B8',
        },
        charcoal: '#24332B',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 16px -4px rgba(36, 51, 43, 0.08)',
        card: '0 4px 24px -6px rgba(36, 51, 43, 0.10)',
        lift: '0 12px 40px -12px rgba(36, 51, 43, 0.18)',
        glow: '0 0 0 4px rgba(168, 213, 186, 0.35)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      backgroundImage: {
        'hero-gradient':
          'linear-gradient(135deg, #FAF9F4 0%, #DDF3E4 45%, #E9E4FA 100%)',
        'mint-fade': 'linear-gradient(180deg, #DDF3E4 0%, #FAF9F4 100%)',
        'peach-fade': 'linear-gradient(135deg, #FFE2D1 0%, #FAF9F4 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};