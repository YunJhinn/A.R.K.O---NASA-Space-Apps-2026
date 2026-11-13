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
  const i = s.tl
  if (i == null) return { ev: visible(), base: null as Ev[] | null, img: ds.img, step: null as null | { date: string; vs: string | null; label: string } }

  if (real && ds.timeline.length) {
    // só os focos encontrados nesta passagem (comparada com a passagem anterior)
    const p = ds.timeline[i]
    const img = p.img ?? [...ds.timeline.slice(0, i)].reverse().find(x => x.img)?.img ?? ds.img
    return {
      ev: p.ev.filter(e => s.type === 'todos' || e.k === s.type), base: p.ev, img,
      step: { date: p.date, vs: p.vs, label: `Passagem de ${fmtDate(p.date)}` },
    }
  }
  // exemplo: só os focos detectados na semana escolhida
  const endAgo = (DEMO_WEEKS - 1 - i) * 7
  const all = ds.ev.filter(e => e.st === 'obs' && e.d >= endAgo && e.d < endAgo + 7)
  const date = iso(new Date(REF.getTime() - endAgo * 864e5))
  return {
    ev: all.filter(e => s.type === 'todos' || e.k === s.type), base: all, img: ds.img,
    step: { date, vs: null, label: `Semana até ${fmtDate(date)}` },
  }
}
