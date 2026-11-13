import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Em desenvolvimento (npm run dev) o app lê os dados direto da pasta data/ do repositório,
// a mesma que o pipeline Python (pipeline/atualizar.py) atualiza.
const DATA_DIR = path.resolve(__dirname, '../data')
const TYPES: Record<string, string> = { '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.geojson': 'application/geo+json' }

function repoData(): Plugin {
  return {
    name: 'arko-repo-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
        const file = path.resolve(DATA_DIR, rel)
        if (!file.startsWith(DATA_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-store')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// base './' → o app funciona em qualquer subpasta do GitHub Pages (ex.: /ARKO-NISAR/app/)
export default defineConfig({
  plugins: [react(), repoData()],
  base: './',
  build: { outDir: process.env.ARKO_OUT ?? 'dist', emptyOutDir: true },
})
