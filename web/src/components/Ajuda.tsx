// "?" ao lado de um título: abre uma explicação curta (passar o mouse, focar com o teclado ou tocar)
import { useState } from 'react'

export function Ajuda({ txt, rot }: { txt: string; rot?: string }) {
  const [on, setOn] = useState(false)
  return (
    <span className="relative inline-flex align-middle" style={{ marginLeft: 6 }}>
      <button type="button" aria-label={rot ?? 'O que é isto?'} aria-expanded={on}
        onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)} onFocus={() => setOn(true)} onBlur={() => setOn(false)}
        onClick={e => { e.stopPropagation(); setOn(true) }}
        className="grid place-items-center rounded-full text-[10.5px] font-extrabold"
        style={{ width: 17, height: 17, background: '#E0EAFF', color: '#2B4CB3', border: '1px solid #B2CCFF', cursor: 'help', lineHeight: 1 }}>?</button>
      {on && (
        <span role="tooltip" className="absolute left-1/2 top-[22px] z-50 w-[260px] -translate-x-1/2 rounded-lg p-2.5 text-left text-[12px] font-normal normal-case leading-snug tracking-normal shadow-lg"
          style={{ background: '#101828', color: '#F2F4F7' }}>{txt}</span>
      )}
    </span>
  )
}
