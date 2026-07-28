/** @type {import('tailwindcss').Config} */
// Tokens sourced 1:1 from vivantecare_design_system.md — do not edit values
// here without updating that spec first; it is the source of truth.
export default {
  content: ['./index.html', './src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1E3B', // Deep Navy — primary brand, headers, buttons, hero titles, footer bg
        teal: '#14A99B', // Teal — primary accent: wordmark, links, icons, borders, CTAs
        cyan: '#00B8D9', // Digital Health Cyan — footer icon accents
        purple: '#8B5CF6', // VivantePassport™ product accent
        gray: '#F4F5F7', // Minimalist Light Gray — page/section backgrounds
        graytint: '#F4F7FA', // Alternate section tint ("Why Choose" band)
        charcoal: '#091E42', // Deep Charcoal — body text, labels
        muted: '#5B6472', // Secondary/body copy gray
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        xs: ['10px', { lineHeight: '1.4' }],
        sm: ['11.5px', { lineHeight: '1.5' }],
        base: ['12.5px', { lineHeight: '1.5' }],
        md: ['13px', { lineHeight: '1.5' }],
        lg: ['14px', { lineHeight: '1.5' }],
        xl: ['15px', { lineHeight: '1.6' }],
        '2xl': ['16px', { lineHeight: '1.6' }],
        '3xl': ['18px', { lineHeight: '1.3' }],
        '4xl': ['21px', { lineHeight: '1.3' }],
        '5xl': ['23px', { lineHeight: '1.2' }],
        '6xl': ['24px', { lineHeight: '1.2' }],
        '7xl': ['28px', { lineHeight: '1.2' }],
        '8xl': ['40px', { lineHeight: '1.0' }],
        '9xl': ['50px', { lineHeight: '1.08' }],
      },
      borderRadius: {
        none: '0px', // all corners squared per current design pass
      },
    },
  },
  plugins: [],
};
