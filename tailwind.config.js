const defaults = require("tailwindcss/defaultTheme");

module.exports = {
    content: [
        "./index.html", 
        "./src/**/*.{gleam,mjs}",
        "./priv/static/stylesheet.css",
        "./priv/static/fonts/*.css"
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['Terminus', ...defaults.fontFamily.mono],
                terminus: ['Terminus', 'monospace'],
                consolas: ['Consolas', 'monospace'],
            },
            dropShadow: {
                'glow': [
                    '0 0px 20px rgba(255, 255, 255, 0.35)',
                    '0 0px 65px rgba(255, 255, 255, 0.2)',
                ],
            },
            fontSize: {
                'smallish': '0.9rem',
                'veryverysmall': '0.3rem',
                'llg': '1.08rem'
            }
        },
    },
    plugins: [],
};
