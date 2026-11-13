// Ícone do app: tipos de evento usam o desenho ilustrado (x-*), o resto usa traço (i-*).
const ILL = new Set(['fogo', 'agua', 'arvore', 'solo', 'vento', 'tornado'])

export function Icon({ k, size = 18, className = '' }: { k: string; size?: number; className?: string }) {
  if (ILL.has(k)) {
    const s = Math.round(size * 1.5)
    return <svg className={`ill ${className}`} viewBox="0 0 64 64" style={{ width: s, height: s }} aria-hidden="true"><use href={`#x-${k}`} /></svg>
  }
  return <svg className={`i ${className}`} style={{ width: size, height: size }} aria-hidden="true"><use href={`#i-${k}`} /></svg>
}
