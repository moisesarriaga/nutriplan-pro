import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "neon-green": "#2ECC71",
                "dark-bg": "#0A0A0A",
                "card-bg": "#121212",
            },
            boxShadow: {
                'glow': '0 0 20px rgba(46, 204, 113, 0.3)',
                'glow-hover': '0 0 30px rgba(46, 204, 113, 0.5)',
            }
        },
    },
    plugins: [],
};
export default config;
