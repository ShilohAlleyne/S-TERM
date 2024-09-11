module.exports = {
    content: ["./index.html", "./src/**/*.{gleam,mjs}"],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"Fira Code"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
            },
            dropShadow: {
                'glow': [
                    '0 0px 20px rgba(255, 255, 255, 0.35)',
                    '0 0px 65px rgba(255, 255, 255, 0.2)',
                ],
            },
        },
        // colors: {
        //     'dark-gray': '#121212',
        // }
    },
    plugins: [],
};
