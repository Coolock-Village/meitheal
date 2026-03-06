/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            /* Meitheal Design Tokens — Hearth Slate + Electric Indigo */
            colors: {
                bg: {
                    primary: 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
                    secondary: 'rgb(var(--bg-secondary-rgb) / <alpha-value>)',
                    card: 'rgb(var(--bg-card-rgb) / <alpha-value>)',
                    hover: 'rgb(var(--bg-hover-rgb) / <alpha-value>)',
                    input: 'rgb(var(--bg-input-rgb) / <alpha-value>)',
                },
                text: {
                    primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
                    secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
                    muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
                    hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
                    light: 'var(--accent-light)',
                },
                warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
                danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
                info: 'rgb(var(--info-rgb) / <alpha-value>)',
                border: {
                    DEFAULT: 'rgb(var(--border-rgb) / <alpha-value>)',
                    focus: 'rgb(var(--border-focus-rgb) / <alpha-value>)',
                },
                /* Keep standard colors for non-themed utilities */
                black: '#000000',
                white: '#ffffff',
            },
            borderRadius: {
                sm: '6px',
                md: '10px',
                lg: '16px',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            fontFamily: {
                sans: ['Geist Variable', 'Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                heading: ['Outfit', 'Geist Variable', 'Inter Variable', '-apple-system', 'sans-serif'],
            },
            transitionDuration: {
                DEFAULT: '200ms',
            },
            spacing: {
                sidebar: '240px',
            },
            animation: {
                'slide-in': 'slideIn 300ms ease-out',
                'fade-in': 'fadeIn 200ms ease',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
