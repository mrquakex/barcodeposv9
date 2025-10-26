/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--fluent-color-canvas))',
        'background-alt': 'hsl(var(--fluent-color-alt-canvas))',
        card: 'hsl(var(--fluent-color-card-bg))',
        foreground: 'hsl(var(--fluent-color-text-primary))',
        'foreground-secondary': 'hsl(var(--fluent-color-text-secondary))',
        'foreground-tertiary': 'hsl(var(--fluent-color-text-tertiary))',
        primary: 'hsl(var(--fluent-color-primary))',
        'primary-hover': 'hsl(var(--fluent-color-primary-hover))',
        'primary-pressed': 'hsl(var(--fluent-color-primary-pressed))',
        'primary-background': 'hsl(var(--fluent-color-primary-background))',
        success: 'hsl(var(--fluent-color-success))',
        warning: 'hsl(var(--fluent-color-warning))',
        destructive: 'hsl(var(--fluent-color-error))',
        border: 'hsl(var(--fluent-color-border-default))',
        'border-subtle': 'hsl(var(--fluent-color-border-subtle))',
        'border-strong': 'hsl(var(--fluent-color-border-strong))',
        input: 'hsl(var(--fluent-color-card-bg))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        'fluent-4': 'var(--fluent-shadow-4)',
        'fluent-8': 'var(--fluent-shadow-8)',
        'fluent-16': 'var(--fluent-shadow-16)',
        'fluent-64': 'var(--fluent-shadow-64)',
      },
      fontFamily: {
        sans: 'var(--font-fluent)',
        mono: 'var(--font-fluent-mono)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}
