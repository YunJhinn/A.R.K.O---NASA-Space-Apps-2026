import type { CSSProperties, ReactNode } from 'react'
import { useApp } from '../lib/store'
import { pos } from '../lib/util'

/** Camada base do mapa: imagem + nomes das cidades. Os filhos ficam por cima. */
export function MapBase({ img, bg = true, className = 'layer', style, children }: { img?: string; bg?: boolean; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const { ds } = useApp()
  return (
    <div className={className} style={bg ? { backgroundImage: `url(${img ?? ds.img})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', ...style } : style}>
      {Object.entries(ds.cities).map(([n, [x, y]]) => (
        <span key={n} className="city" style={pos(x, y)}><i />{n}</span>
      ))}
      {children}
    </div>
  )
}

/** Mancha de concentração (calor) na grade do mapa */
export function Heat({ x, y, r, color, blur, style }: { x: number; y: number; r: number; color: string; blur?: number; style?: CSSProperties }) {
  return (
    <div className="heat" style={{
      left: `${((x - r) / 746) * 100}%`, top: `${((y - r * 0.75) / 508) * 100}%`, width: `${((r * 2) / 746) * 100}%`, height: `${((r * 1.5) / 508) * 100}%`,
      background: color, ...(blur != null ? { filter: `blur(${blur}px)` } : {}), ...style,
    }} />
  )
}
