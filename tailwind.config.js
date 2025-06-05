/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: [
        // Color variants for tag backgrounds and text
        {
            pattern:
                /bg-(gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(100|500|900)/,
        },
        {
            pattern:
                /text-(gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(300|800)/,
        },
        {
            pattern:
                /border-(gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(500|700)/,
        },
        {
            pattern:
                /ring-(gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(500)/,
        },
    ],
    theme: {
        extend: {
            keyframes: {
                "fade-in-up": {
                    "0%": {
                        opacity: "0",
                        transform: "translateY(10px)",
                    },
                    "100%": {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
                "fade-out-down": {
                    "0%": {
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                    "100%": {
                        opacity: "0",
                        transform: "translateY(10px)",
                    },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
            animation: {
                "fade-in-up": "fade-in-up 0.3s ease-out",
                "fade-out-down":
                    "fade-out-down 0.3s ease-in",
                "fade-in": "fade-in 0.2s ease-out",
            },
            transitionDelay: {
                0: "0ms",
                150: "150ms",
                300: "300ms",
                450: "450ms",
                600: "600ms",
            },
            utilities: {
                ".animation-delay-150": {
                    "animation-delay": "150ms",
                },
                ".animation-delay-300": {
                    "animation-delay": "300ms",
                },
                ".animation-delay-450": {
                    "animation-delay": "450ms",
                },
                ".animation-delay-600": {
                    "animation-delay": "600ms",
                },
            },
        },
    },
    plugins: [
        function ({ addUtilities }) {
            const newUtilities = {
                ".animation-delay-150": {
                    "animation-delay": "150ms",
                },
                ".animation-delay-300": {
                    "animation-delay": "300ms",
                },
                ".animation-delay-450": {
                    "animation-delay": "450ms",
                },
                ".animation-delay-600": {
                    "animation-delay": "600ms",
                },
            };
            addUtilities(newUtilities);
        },
    ],
};
