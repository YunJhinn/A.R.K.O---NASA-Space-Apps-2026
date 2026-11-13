// Estado global do app (período, filtros, modo Exemplo × NISAR real, idioma, telas).
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { Alert, CmpEntry, CustomRange, Ev, EvType, Info, Lang, Level, LinhaTempoJson, PresetKey, RealDates, Src, TypeFilter, View } from './types'
import { INFO_DEMO, PRESETS, TYPES, TYPES_REAL, type TypeMeta } from './demo'
import { REGIONS, type Region, type RegionId } from './regions'
import { buildReal, buildTimeline, type RealSet, type TimelinePoint } from './real'
import { setI18n, tr } from './i18n'
import fallbackJson from '../data/focos-fallback.json'
import fallbackImg from '../assets/radar-fallback.jpg'
import type { FocosAppJson } from './types'

/** Onde ficam os arquivos gerados pelo pipeline (data/ na raiz do repositório). */
export const DATA_BASE: string = import.meta.env.VITE_DATA_BASE ?? (import.meta.env.DEV ? './data/' : '../data/')

export type PhoneTab = 'alertas' | 'mapa' | 'comparar' | 'sobre'
export interface State {
  view: View
  lang: Lang
  src: Src
  preset: PresetKey
  custom: CustomRange | null
  type: TypeFilter
  prev: boolean
  sel: string | null
  risk: Level | null
  profile: string | null
  colorBy: 'tipo' | 'mes'
  ob: boolean
  obStep: number
  cmp: { k: string; a: string; b: string; swipe: number }
  phone: { tab: PhoneTab; type: TypeFilter; sel: string | null; cType: string; when: 'antes' | 'depois' }
  /** índice da passagem/semana escolhida na linha do tempo (null = período inteiro) */
  tl: number | null
  focus: 'map' | 'alerts' | null
  /** região dos dados de exemplo */
  region: RegionId
  /** lugar buscado pela pessoa (pino no mapa) */
  pin: { lon: number; lat: number; label: string } | null
}

const initial: State = {
  view: 'inicio', lang: 'pt', src: 'demo', preset: '30d', custom: null, type: 'todos', prev: true, sel: 'a1', risk: null,
  profile: null, colorBy: 'tipo', ob: false, obStep: 0,
  cmp: { k: 'agua', a: 'set', b: 'nov', swipe: 50 },
  phone: { tab: 'alertas', type: 'todos', sel: 'a1', cType: 'agua', when: 'depois' },
  tl: null, focus: null, region: 'amazonia', pin: null,
}

type Patch = Partial<State> | ((s: State) => Partial<State>)
function reducer(s: State, p: Patch): State {
  return { ...s, ...(typeof p === 'function' ? p(s) : p) }
}

export interface DataSet {
  ev: Ev[]
  alerts: Alert[]
  cities: Record<string, [number, number]>
  cmp: Record<string, CmpEntry>
  info: Record<string, Info>
  img: string
  types: Record<EvType, TypeMeta>
  rd: RealDates
  real: RealSet
  timeline: TimelinePoint[]
  region: Region
}

interface Ctx {
  s: State
  set: (p: Patch) => void
  ds: DataSet
  t: (x: string) => string
  setSrc: (src: Src) => void
  setRegion: (r: RegionId, extra?: Partial<State>) => void
  go: (v: View, focus?: State['focus']) => void
  // ajudantes de período
  days: () => number
  inRange: (d: number) => boolean
  periodLabel: () => string
  visible: () => Ev[]
}
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, set] = useReducer(reducer, initial, init => {
    let lang: Lang = 'pt', ob = false, view: View = init.view
    try {
      const q = new URLSearchParams(location.search).get('lang')
      if ((q ?? localStorage.getItem('arko-lang')) === 'en') lang = 'en'
      ob = localStorage.getItem('arko-ob') !== '1' && !location.hash
      localStorage.setItem('arko-ob', '1')
      const h = location.hash.slice(1)
      if (h === 'comparar' || h === 'celular' || h === 'inicio') view = h
    } catch { /* sem localStorage */ }
    return { ...init, lang, ob, view }
  })
  const [real, setReal] = useState<RealSet>(() => buildReal(fallbackJson as FocosAppJson, fallbackImg))
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])

  // dados reais mais novos (gerados pelo GitHub Actions)
  useEffect(() => {
    fetch(DATA_BASE + 'focos_app.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: FocosAppJson | null) => { if (d?.focos && d.imagem && d.depois) setReal(buildReal(d, `${DATA_BASE}${d.imagem.arquivo}?v=${d.depois.data}`)) })
      .catch(() => {})
    fetch(DATA_BASE + 'linha_tempo.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: LinhaTempoJson | null) => { if (d?.passagens) setTimeline(buildTimeline(d, DATA_BASE)) })
      .catch(() => {})
  }, [])

  const ds = useMemo<DataSet>(() => {
    const isReal = s.src === 'real'
    const region = REGIONS[s.region]
    const types = { ...TYPES } as Record<EvType, TypeMeta>
    if (isReal) (Object.keys(TYPES_REAL) as EvType[]).forEach(k => { types[k] = { ...types[k], ...TYPES_REAL[k] } })
    return {
      ev: isReal ? real.ev : region.ev,
      alerts: isReal ? real.alerts : region.alerts,
      cities: isReal ? real.cities : region.cities,
      cmp: isReal ? real.cmp : region.cmp,
      info: { ...INFO_DEMO, ...region.info, ...real.info, ...Object.assign({}, ...timeline.map(p => p.info)) },
      img: isReal ? real.img : region.img,
      types, rd: real.rd, real, timeline, region,
    }
  }, [s.src, s.region, real, timeline])

  // idioma: precisa estar pronto antes dos filhos renderizarem
  setI18n(s.lang, ds.rd)
  useEffect(() => {
    document.documentElement.lang = s.lang === 'en' ? 'en' : 'pt-BR'
    try { localStorage.setItem('arko-lang', s.lang) } catch { /* ok */ }
  }, [s.lang])
  useEffect(() => { try { if (location.hash !== '#' + s.view) history.replaceState(null, '', '#' + s.view) } catch { /* ok */ } }, [s.view])
  useEffect(() => {
    const on = () => { const h = location.hash.slice(1); if (h === 'comparar' || h === 'celular' || h === 'inicio') set({ view: h }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const days = useCallback(() => (s.custom ? s.custom.b - s.custom.a + 1 : PRESETS.find(p => p[0] === s.preset)![2]), [s.custom, s.preset])
  const inRange = useCallback((d: number) => (s.custom ? d >= s.custom.a && d <= s.custom.b : d <= days()), [s.custom, days])
  const periodLabel = useCallback(() => (s.custom ? s.custom.label : PRESETS.find(p => p[0] === s.preset)![1]), [s.custom, s.preset])
  const visible = useCallback(
    () => ds.ev.filter(e => (e.st === 'prev' ? s.prev : inRange(e.d)) && (s.type === 'todos' || e.k === s.type)),
    [ds.ev, s.prev, s.type, inRange],
  )
  const setSrc = useCallback((src: Src) => {
    const isReal = src === 'real'
    set(st => ({
      src, region: isReal ? 'amazonia' : st.region, pin: isReal ? null : st.pin,
      sel: isReal ? null : REGIONS[isReal ? 'amazonia' : st.region].sel, type: 'todos', risk: null, custom: null, preset: isReal ? '30d' : st.preset, tl: null,
      phone: { ...st.phone, sel: isReal ? null : REGIONS[st.region].sel, type: 'todos', cType: isReal ? 'arvore' : 'agua' },
      cmp: { ...st.cmp, k: isReal ? 'arvore' : 'agua', a: isReal ? 'a' : 'set', b: isReal ? 'b' : 'nov' },
    }))
  }, [])
  const setRegion = useCallback((r: RegionId, extra: Partial<State> = {}) => {
    set(st => ({
      region: r, src: 'demo', sel: REGIONS[r].sel, type: 'todos', risk: null, tl: null, pin: null,
      phone: { ...st.phone, sel: REGIONS[r].sel, type: 'todos', cType: 'agua' },
      cmp: { ...st.cmp, k: 'agua', a: 'set', b: 'nov' }, ...extra,
    }))
  }, [])
  const go = useCallback((view: View, focus: State['focus'] = null) => { set({ view, focus }); if (!focus) window.scrollTo(0, 0) }, [])

  const value: Ctx = { s, set, ds, t: tr, setSrc, setRegion, go, days, inRange, periodLabel, visible }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp fora do AppProvider')
  return c
}
