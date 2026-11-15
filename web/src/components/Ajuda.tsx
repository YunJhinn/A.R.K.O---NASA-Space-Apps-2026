// "?" ao lado de um título: abre uma explicação curta (passar o mouse, focar com o teclado ou tocar).
// O balão usa posição fixa na tela (não é cortado por cartões) e é ajustado para caber nas bordas.
import { useLayoutEffect, useRef, useState } from 'react'

const LARG = 280

export function Ajuda({ txt, rot }: { txt: string; rot?: string }) {
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; acima: boolean } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const bal = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (!on || !btn.current) { setPos(null); return }
    const r = btn.current.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight
    const larg = Math.min(LARG, vw - 16)
    const left = Math.max(8, Math.min(r.left + r.width / 2 - larg / 2, vw - larg - 8))
    const alt = bal.current?.offsetHeight ?? 120
    const acima = r.bottom + 8 + alt > vh && r.top - 8 - alt > 0
    setPos({ left, top: acima ? r.top - 8 - alt : r.bottom + 8, acima })
  }, [on, txt])
  return (
    <span className="inline-flex align-middle" style={{ marginLeft: 6 }}>
      <button ref={btn} type="button" aria-label={rot ?? 'O que é isto?'} aria-expanded={on}
        onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}
        onClick={e => { e.stopPropagation(); setOn(true) }}
        className="grid place-items-center rounded-full text-[10.5px] font-extrabold"
        style={{ width: 17, height: 17, background: '#E0EAFF', color: '#2B4CB3', border: '1px solid #B2CCFF', cursor: 'help', lineHeight: 1 }}>?</button>
      {on && (
        <span ref={bal} role="tooltip" className="rounded-lg p-2.5 text-left text-[12px] font-normal normal-case leading-snug tracking-normal shadow-lg"
          style={{ position: 'fixed', zIndex: 1000, width: Math.min(LARG, window.innerWidth - 16), left: pos?.left ?? -9999, top: pos?.top ?? -9999,
            background: '#101828', color: '#F2F4F7', pointerEvents: 'none', whiteSpace: 'normal' }}>{txt}</span>
      )}
    </span>
  )
}
