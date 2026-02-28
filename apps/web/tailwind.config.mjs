/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            /* Meitheal Design Tokens — Irish navy + emerald */
            colors: {
                bg: {
                    primary: '#0f0f1a',
                    secondary: '#1a1a2e',
                    card: '#16213e',
                    hover: '#1e2d4f',
                    input: '#0a0a14',
                },
                text: {
                    primary: '#e8e8f0',
                    secondary: '#9b9bb4',
                    muted: '#5e5e78',
                },
                accent: {
                    DEFAULT: '#10b981',
                    hover: '#059669',
                    light: 'rgba(16, 185, 129, 0.12)',
                },
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#3b82f6',
                border: {
                    DEFAULT: '#2a2a42',
                    focus: '#10b981',
                },
            },
            borderRadius: {
                sm: '6px',
                md: '10px',
                lg: '16px',
            },
            boxShadow: {
                sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
                md: '0 4px 12px rgba(0, 0, 0, 0.4)',
                lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
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
