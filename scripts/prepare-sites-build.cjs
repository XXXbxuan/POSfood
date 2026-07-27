const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const serverRoot = path.join(distRoot, 'server')

if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    throw new Error('Vite build output is missing dist/index.html')
}

fs.mkdirSync(serverRoot, { recursive: true })
fs.writeFileSync(
    path.join(serverRoot, 'index.js'),
    `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || !request.headers.get("accept")?.includes("text/html")) {
      return response;
    }
    return env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request));
  },
};
`,
)
