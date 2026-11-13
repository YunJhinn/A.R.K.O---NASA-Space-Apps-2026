// O que o mapa e o painel mostram agora: o período inteiro ou uma data da linha do tempo.
import { useApp } from './store'
import { HIST_DEMO, REF } from './demo'
import type { Ev } from './types'
import { iso } from './util'
import { fmtDate } from './i18n'

export const DEMO_WEEKS = HIST_DEMO.length

export interface Step { key: string; date: string; label: string; value: number; hasImg: boolean }

/** Passos da linha do tempo: passagens do NISAR (real) ou semanas (exemplo) */
export function useSteps(): Step[] {
  const { s, ds } = useApp()
  if (s.src === 'real') {
    return ds.timeline.map(p => ({ key: p.date, date: p.date, label: p.date, value: p.resumo.focos, hasImg: !!p.img }))
  }
  return HIST_DEMO.map((v, i) => {
    const d = new Date(REF.getTime() - (DEMO_WEEKS - 1 - i) * 7 * 864e5)
    return { key: String(i), date: iso(d), label: iso(d), value: v, hasImg: true }
  })
}

export function useFocus() {
  const { s, ds, visible } = useApp()
  const real = s.src === 'real'
  const r = s.tl
  if (r == null) return { ev: visible(), base: null as Ev[] | null, img: ds.img, step: null as null | { date: string; vs: string | null; label: string } }
  const { a, b } = r
  const one = a === b

  if (real && ds.timeline.length) {
    // focos de todas as passagens do trecho (cada passagem comparada com a anterior)
    const pts = ds.timeline.slice(a, b + 1)
    const all = pts.flatMap(p => p.ev)
    const last = ds.timeline[b]
    const img = last.img ?? [...ds.timeline.slice(0, b)].reverse().find(x => x.img)?.img ?? ds.img
    const label = one ? `Passagem de ${fmtDate(last.date)}` : `Passagens de ${fmtDate(ds.timeline[a].date, false)} a ${fmtDate(last.date)}`
    return { ev: all.filter(e => s.type === 'todos' || e.k === s.type), base: all, img, step: { date: last.date, vs: last.vs, label } }
  }
  // exemplo: focos detectados entre o início da semana a e o fim da semana b
  const endAgo = (DEMO_WEEKS - 1 - b) * 7, startAgo = (DEMO_WEEKS - 1 - a) * 7 + 7
  const all = ds.ev.filter(e => e.st === 'obs' && e.d >= endAgo && e.d < startAgo)
  const end = iso(new Date(REF.getTime() - endAgo * 864e5)), start = iso(new Date(REF.getTime() - (startAgo - 1) * 864e5))
  const label = one ? `Semana até ${fmtDate(end)}` : `De ${fmtDate(start, false)} a ${fmtDate(end)}`
  return { ev: all.filter(e => s.type === 'todos' || e.k === s.type), base: all, img: ds.img, step: { date: end, vs: null, label } }
}
