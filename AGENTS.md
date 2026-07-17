# POSfood Project Rules

## Protected file

### `vite.config.js`

Do not modify this file unless the user explicitly asks to change it.

The required development server settings are:

```js
server: {
    port: 3333,
    host: true,
}
```

Rules:

- Do not change port `3333`.
- Do not add `strictPort`, `optimizeDeps`, or custom build settings without explicit user approval.
- Do not start a second Vite process when the user's Vue UI task is running.
- Before local testing, check whether port `3333` is already in use.
- Prefer the user's existing Vue UI `dev` task. Do not replace its server or network configuration.
- Never change the computer IP, network adapter, router, firewall, or proxy settings for project testing.

## Package safety

- Keep `package.json` valid JSON.
- Never paste diff headers or patch text into `package.json`.
- Only change dependencies that are required for the requested feature.
