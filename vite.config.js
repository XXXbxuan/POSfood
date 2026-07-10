const path = require('path')
const vue = require('@vitejs/plugin-vue')

module.exports = {
    build: {
        cssCodeSplit: false,
    },
    server: {
        port: 3333,
        strictPort: true,
        host: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '/~/': path.resolve(__dirname, './src/assets'),
        },
    },
    plugins: [vue()],
}
