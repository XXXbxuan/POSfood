const path = require('path')
const vue = require('@vitejs/plugin-vue')

module.exports = {
    server: {
        port: 3333,
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
