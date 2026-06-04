/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff4f00',
        canvas: '#fffefb',
        'canvas-soft': '#f8f4f0',
        ink: '#201515',
        'ink-soft': '#2f2a26',
        'ink-mid': '#36342e',
        body: '#605d52',
        'body-mid': '#939084',
        mute: '#c5c0b1',
        'on-primary': '#fffefb',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '56px', fontWeight: '500' }],
        'display-lg': ['48px', { lineHeight: '48px', fontWeight: '500' }],
        'display-md': ['32px', { lineHeight: '36px', fontWeight: '500', letterSpacing: '1px' }],
        'display-sub-sm': ['24px', { lineHeight: '30px', fontWeight: '600', letterSpacing: '-0.6px' }],
        'body-lg': ['20px', { lineHeight: '30px', letterSpacing: '-0.2px' }],
        'body-md': ['18px', { lineHeight: '27px' }],
        'body-sm': ['16px', { lineHeight: '24px' }],
        caption: ['14px', { lineHeight: '21px' }],
        eyebrow: ['14px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '1px' }],
        'btn-md': ['18px', { lineHeight: '27px', fontWeight: '600' }],
        'btn-sm': ['14.4px', { lineHeight: '14.4px', fontWeight: '700', letterSpacing: '0.144px' }],
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};
