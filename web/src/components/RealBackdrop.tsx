import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'

// Mapa-base desenhado (estilo telejornal) de cada região real + linhas/rótulos por cima do radar
const BASES = import.meta.glob('../assets/real/mapa-*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const LINES = import.meta.glob('../assets/real/linhas-*.png', { eager: true, import: 'default' }) as Record<string, string>
export const realBase = (id: string) => BASES[`../assets/real/mapa-${id}.jpg`] ?? null
const realLines = (id: string) => LINES[`../assets/real/linhas-${id}.png`] ?? null

// Contorno da faixa do radar: acha o traço branco da imagem e tira o polígono convexo (em %)
const cache = new Map<string, string | null>()
function hull(pts: [number, number][]) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: [number, number][] = [], up: [number, number][] = []
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}
function useFootprint(img: string) {
  const [poly, setPoly] = useState<string | null | undefined>(cache.get(img))
  useEffect(() => {
    if (cache.has(img)) { setPoly(cache.get(img)); return }
    let alive = true
    const im = new Image()
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight
        const c = document.createElement('canvas'); c.width = w; c.height = h
        const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(im, 0, 0)
        const d = g.getImageData(0, 0, w, h).data
        const pts: [number, number][] = []
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
          const i = (y * w + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2]
          if (r > 215 && gg > 215 && b > 215) pts.push([x, y])
        }
        const hp = pts.length > 50 ? hull(pts) : []
        const res = hp.length >= 3 ? `polygon(${hp.map(([x, y]) => `${((x / w) * 100).toFixed(2)}% ${((y / h) * 100).toFixed(2)}%`).join(',')})` : null
        cache.set(img, res); if (alive) setPoly(res)
      } catch { cache.set(img, null); if (alive) setPoly(null) }
    }
    im.onerror = () => { cache.set(img, null); if (alive) setPoly(null) }
    im.src = img
    return () => { alive = false }
  }, [img])
  return poly
}

/** Fundo do mapa no modo real: mapa desenhado + faixa do radar recortada + fronteiras e nomes por cima */
export function RealBackdrop({ img }: { img: string }) {
  const { s, ds } = useApp()
  const id = ds.realMeta.id
  const base = realBase(id), lines = realLines(id)
  const poly = useFootprint(img)
  if (!base) return <div className="layer" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${img})`, backgroundSize: '100% 100%' }} />
  const full = { position: 'absolute', inset: 0, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', pointerEvents: 'none' } as const
  return (
    <>
      <div style={{ ...full, backgroundImage: `url(${base})` }} />
      {s.radar && poly !== undefined && (
        <div style={{ ...full, backgroundImage: `url(${img})`, clipPath: poly ?? undefined, opacity: poly ? 0.9 : 0.55, transition: 'opacity .3s' }} />
      )}
      {lines && <div style={{ ...full, backgroundImage: `url(${lines})`, opacity: s.radar ? 0.7 : 1 }} />}
    </>
  )
}
