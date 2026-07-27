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
            '@vue/devtools-api': path.resolve(
                __dirname,
                './node_modules/@vue/devtools-api/lib/cjs/index.js',
            ),
        },
    },
    plugins: [vue()],
}
