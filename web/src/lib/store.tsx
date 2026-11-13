// Estado global do app (período, filtros, modo Exemplo × NISAR real, idioma, telas).
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Alert, CmpEntry, CustomRange, Ev, EvType, Info, Lang, Level, LinhaTempoJson, PresetKey, RealDates, Src, TypeFilter, View } from './types'
import { INFO_DEMO, PRESETS, TYPES, TYPES_REAL, type TypeMeta } from './demo'
import { REGIONS, type Region, type RegionId } from './regions'
import { buildReal, buildTimeline, REAL_DEFAULT, realShort, type RealMeta, type RealSet, type TimelinePoint } from './real'
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
  /** trecho escolhido na linha do tempo: do passo a ao passo b (null = período inteiro). Uma data só = a igual a b */
  tl: { a: number; b: number } | null
  /** linha do tempo: 'uma' data por vez ou um 'periodo' (vários passos juntos) */
  tlMode: 'uma' | 'periodo'
  focus: 'map' | 'alerts' | null
  /** região escolhida (exemplo: amazonia, sul · real: as de data/regioes.json) */
  region: string
  /** lugar buscado pela pessoa (pino no mapa) */
  pin: { lon: number; lat: number; label: string } | null
  /** regiões favoritas e abertas recentemente (salvas no navegador) */
  favs: MyPlace[]
  recents: MyPlace[]
}

/** Uma região (ou lugar buscado) salva em "Minhas regiões" */
export interface MyPlace {
  key: string
  label: string
  src: Src
  region: string
  pin?: { lon: number; lat: number; label: string } | null
}

const initial: State = {
  view: 'inicio', lang: 'pt', src: 'demo', preset: '30d', custom: null, type: 'todos', prev: true, sel: 'a1', risk: null,
  profile: null, colorBy: 'tipo', ob: false, obStep: 0,
  cmp: { k: 'agua', a: 'set', b: 'nov', swipe: 50 },
  phone: { tab: 'alertas', type: 'todos', sel: 'a1', cType: 'agua', when: 'depois' },
  tl: null, tlMode: 'periodo', focus: null, region: 'amazonia', pin: null, favs: [], recents: [],
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
  /** região real em uso e todas as regiões reais */
  realMeta: RealMeta
  realIndex: RealMeta[]
}

interface Ctx {
  s: State
  set: (p: Patch) => void
  ds: DataSet
  t: (x: string) => string
  setSrc: (src: Src) => void
  setRegion: (r: string, extra?: Partial<State>) => void
  /** lugar aberto agora (para favoritar) e abrir um lugar salvo */
  here: MyPlace
  openPlace: (p: MyPlace) => void
  toggleFav: (p: MyPlace) => void
  regionName: (src: Src, id: string) => string
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
    let favs: MyPlace[] = [], recents: MyPlace[] = []
    try { favs = JSON.parse(localStorage.getItem('arko-favs') ?? '[]'); recents = JSON.parse(localStorage.getItem('arko-recentes') ?? '[]') } catch { /* ok */ }
    return { ...init, lang, ob, view, favs, recents }
  })
  // dados reais: índice das regiões e os dados de cada uma (carregados quando a região é aberta)
  const [realIndex, setRealIndex] = useState<RealMeta[]>([REAL_DEFAULT])
  const [sets, setSets] = useState<Record<string, { real: RealSet; timeline: TimelinePoint[] }>>(() => ({
    amazonia: { real: buildReal(fallbackJson as FocosAppJson, fallbackImg), timeline: [] },
  }))
  const realMeta = realIndex.find(m => m.id === s.region) ?? realIndex[0]
  useEffect(() => {
    fetch(DATA_BASE + 'regioes.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: RealMeta[] | null) => { if (Array.isArray(d) && d.length) setRealIndex(d) })
      .catch(() => {})
  }, [])
  const loaded = useRef(new Set<string>())
  useEffect(() => {
    const m = realMeta
    if (loaded.current.has(m.id)) return
    loaded.current.add(m.id)
    const base = DATA_BASE + m.pasta
    fetch(base + 'focos_app.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: FocosAppJson | null) => {
        if (!d?.focos || !d.imagem || !d.depois) return
        const real = buildReal(d, `${base}${d.imagem.arquivo}?v=${d.depois.data}`, m.cidades)
        setSets(x => ({ ...x, [m.id]: { real, timeline: x[m.id]?.timeline ?? [] } }))
      })
      .catch(() => {})
    fetch(base + 'linha_tempo.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: LinhaTempoJson | null) => {
        if (!d?.passagens) return
        const timeline = buildTimeline(d, base)
        setSets(x => ({ ...x, [m.id]: { real: x[m.id]?.real ?? x.amazonia.real, timeline } }))
      })
      .catch(() => {})
  }, [realMeta])
  const cur = sets[realMeta.id] ?? sets.amazonia
  const real = cur.real
  const timeline = sets[realMeta.id] ? cur.timeline : []

  const ds = useMemo<DataSet>(() => {
    const isReal = s.src === 'real'
    const region = REGIONS[s.region as RegionId] ?? REGIONS.amazonia
    const types = { ...TYPES } as Record<EvType, TypeMeta>
    if (isReal) (Object.keys(TYPES_REAL) as EvType[]).forEach(k => { types[k] = { ...types[k], ...TYPES_REAL[k] } })
    return {
      ev: isReal ? real.ev : region.ev,
      alerts: isReal ? real.alerts : region.alerts,
      cities: isReal ? real.cities : region.cities,
      cmp: isReal ? real.cmp : region.cmp,
      info: { ...INFO_DEMO, ...region.info, ...real.info, ...Object.assign({}, ...timeline.map(p => p.info)) },
      img: isReal ? real.img : region.img,
      types, rd: real.rd, real, timeline, region, realMeta, realIndex,
    }
  }, [s.src, s.region, real, timeline, realMeta, realIndex])

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
  const hasReal = useCallback((id: string) => realIndex.some(m => m.id === id), [realIndex])
  const setSrc = useCallback((src: Src) => {
    const isReal = src === 'real'
    set(st => {
      const region = isReal ? (hasReal(st.region) ? st.region : 'amazonia') : (st.region in REGIONS ? st.region : 'amazonia')
      const ex = REGIONS[region as RegionId]
      return {
        src, region, pin: null,
        sel: isReal ? null : ex.sel, type: 'todos', risk: null, custom: null, preset: isReal ? '30d' : st.preset, tl: null,
        phone: { ...st.phone, sel: isReal ? null : ex.sel, type: 'todos', cType: isReal ? 'arvore' : 'agua' },
        cmp: { ...st.cmp, k: isReal ? 'arvore' : 'agua', a: isReal ? 'a' : 'set', b: isReal ? 'b' : 'nov' },
      }
    })
  }, [hasReal])
  /** Abre uma região. Fica no modo atual se a região existir nele; senão troca de modo. */
  const setRegion = useCallback((r: string, extra: Partial<State> = {}) => {
    set(st => {
      const src: Src = extra.src ?? (st.src === 'real' && hasReal(r) ? 'real' : r in REGIONS ? 'demo' : hasReal(r) ? 'real' : 'demo')
      const region = src === 'real' ? (hasReal(r) ? r : 'amazonia') : (r in REGIONS ? r : 'amazonia')
      const ex = REGIONS[(region in REGIONS ? region : 'amazonia') as RegionId]
      const isReal = src === 'real'
      return {
        region, src, sel: isReal ? null : ex.sel, type: 'todos', risk: null, tl: null, pin: null, custom: null, preset: isReal ? '30d' : st.preset,
        phone: { ...st.phone, sel: isReal ? null : ex.sel, type: 'todos', cType: isReal ? 'arvore' : 'agua' },
        cmp: { ...st.cmp, k: isReal ? 'arvore' : 'agua', a: isReal ? 'a' : 'set', b: isReal ? 'b' : 'nov' }, ...extra,
      }
    })
  }, [hasReal])
  // ---- minhas regiões: favoritas e recentes ----
  const regionName = useCallback((src: Src, id: string) => {
    if (src === 'real') { const m = realIndex.find(x => x.id === id); return m ? realShort(m) : id }
    return REGIONS[id as RegionId]?.name ?? id
  }, [realIndex])
  const here: MyPlace = useMemo(() => ({
    key: `${s.src}:${s.region}:${s.pin?.label ?? ''}`,
    label: s.pin?.label ?? regionName(s.src, s.region), src: s.src, region: s.region, pin: s.pin,
  }), [s.src, s.region, s.pin, regionName])
  useEffect(() => {
    set(st => {
      const recents = [here, ...st.recents.filter(x => x.key !== here.key)].slice(0, 6)
      return recents.map(x => x.key).join() === st.recents.map(x => x.key).join() ? {} : { recents }
    })
  }, [here])
  useEffect(() => { try { localStorage.setItem('arko-favs', JSON.stringify(s.favs)); localStorage.setItem('arko-recentes', JSON.stringify(s.recents)) } catch { /* ok */ } }, [s.favs, s.recents])
  const toggleFav = useCallback((p: MyPlace) => set(st => ({ favs: st.favs.some(x => x.key === p.key) ? st.favs.filter(x => x.key !== p.key) : [p, ...st.favs].slice(0, 12) })), [])
  const openPlace = useCallback((p: MyPlace) => {
    setRegion(p.region, { src: p.src, pin: p.pin ?? null, preset: '1a' })
    set({ view: 'inicio' })
  }, [setRegion])

  const go = useCallback((view: View, focus: State['focus'] = null) => { set({ view, focus }); if (!focus) window.scrollTo(0, 0) }, [])

  const value: Ctx = { s, set, ds, t: tr, setSrc, setRegion, here, openPlace, toggleFav, regionName, go, days, inRange, periodLabel, visible }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp fora do AppProvider')
  return c
}
