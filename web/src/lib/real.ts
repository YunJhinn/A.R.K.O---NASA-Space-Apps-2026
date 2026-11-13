// Dados reais do NISAR: lidos de data/focos_app.json e data/linha_tempo.json
// (os dois são atualizados pelo GitHub Actions a cada passagem nova do satélite).
import type { Alert, CmpEntry, Ev, FocoJson, FocosAppJson, Info, LinhaTempoJson, RealDates } from './types'
import { MAP_H, MAP_W } from './demo'
import { ago, dbf, fmtD, kmf } from './util'

export const CID_LL: Record<string, [number, number]> = {
  Careiro: [-60.37, -3.77], 'Careiro da Várzea': [-59.83, -3.2], Autazes: [-59.13, -3.58], Borba: [-59.59, -4.39],
  'Nova Olinda do Norte': [-59.09, -3.89], 'Novo Aripuanã': [-60.38, -5.12], 'Manicoré': [-61.3, -5.81], Beruri: [-61.37, -3.9], Manaquiri: [-60.46, -3.43],
}
export const REAL_NAMES = { agua: 'Água nova', arvore: 'Floresta perdida', solo: 'Água que recuou' } as const
export type RealKind = keyof typeof REAL_NAMES

export interface RealSet {
  rd: RealDates
  meta: FocosAppJson
  ev: Ev[]
  info: Record<string, Info>
  alerts: Alert[]
  cities: Record<string, [number, number]>
  cmp: Record<string, CmpEntry>
  img: string
}

type Bounds = { oeste: number; leste: number; norte: number; sul: number }
export const projector = (im: Bounds) => ({
  X: (lon: number) => ((lon - im.oeste) / (im.leste - im.oeste)) * MAP_W,
  Y: (lat: number) => ((im.norte - lat) / (im.norte - im.sul)) * MAP_H,
})

export function realDates(antes: string, depois: string, n: number): RealDates {
  const A = fmtD(antes), B = fmtD(depois)
  return { a: A.pt, b: B.pt, aEN: A.en, bEN: B.en, an: A.num, bn: `${B.num}/${B.y}`, anEN: A.numEN, bnEN: `${B.numEN}/${B.y}`, y: B.y, n }
}

export const whyFoco = (tipo: FocoJson['tipo'], d: string, rd: RealDates) => ({
  agua: `Apareceu água parada onde antes não havia: o sinal caiu ${d} dB entre ${rd.a} e ${rd.b}.`,
  solo: `Onde havia água em ${rd.a}, o radar agora vê superfície exposta (${d} dB a mais): o rio recuou com a seca.`,
  arvore: `O sinal de volume (HV) do radar caiu ${d} dB entre ${rd.a} e ${rd.b}: a floresta perdeu estrutura. Pode ser desmatamento ou queimada; o radar sozinho não separa os dois.`,
}[tipo])

export const realWhy = (k: RealKind, rd: RealDates) => ({
  agua: 'Pixels que eram terra passaram a refletir como água lisa (queda forte no sinal HH). Pode ser alagamento, lago novo ou mudança no leito do rio.',
  arvore: 'O sinal de volume da vegetação (HV) caiu: a floresta perdeu estrutura. Pode ser corte raso, queimada ou exploração seletiva.',
  solo: `Onde havia água em ${rd.a}, o radar agora vê superfície exposta. É o rio baixando com a seca de ${rd.y}.`,
}[k])

export function infoFoco(f: FocoJson, rd: RealDates): Info {
  return { t: f.local, sub: `Dado real NISAR · detectado em ${rd.b} ${rd.y}`, m: kmf(f.area_km2), d: `Δ ${dbf(f.delta_db)} dB vs. ${rd.a}`, g: f.grau, st: 'Observado', why: whyFoco(f.tipo, dbf(f.delta_db), rd) }
}

/** agrupa focos do mesmo tipo a menos de 40 px (~18 km) e gera no máximo 4 alertas */
export function realAlerts(ev: Ev[], focos: FocoJson[], rd: RealDates): Alert[] {
  const pts = ev.map(e => ({ id: e.id, k: e.k, x: e.x, y: e.y, f: focos.find(f => f.id === e.id)! }))
  const used = new Set<string>(), groups: (typeof pts)[] = []
  pts.forEach(p => {
    if (used.has(p.id)) return
    const g = [p]; used.add(p.id)
    for (let i = 0; i < g.length; i++)
      pts.forEach(q => { if (!used.has(q.id) && q.k === g[i].k && Math.hypot(q.x - g[i].x, q.y - g[i].y) < 40) { used.add(q.id); g.push(q) } })
    groups.push(g)
  })
  const al: Alert[] = groups.map(g => {
    const k = g[0].k as RealKind, n = g.length, area = g.reduce((t, q) => t + q.f.area_km2, 0), gm = Math.max(...g.map(q => q.f.grau))
    const rep = g.slice().sort((a, b) => b.f.area_km2 - a.f.area_km2)[0]
    const lvl = gm >= 81 ? 'Alto' : gm >= 51 ? 'Médio' : n >= 3 ? 'Médio' : 'Baixo'
    const t = n > 1
      ? { agua: 'Água nova em vários pontos', solo: 'Rio recuou em vários pontos', arvore: 'Perda de floresta em grupo' }[k]
      : { agua: 'Água nova fora do rio', solo: 'Rio recuou com a seca', arvore: 'Perda de floresta isolada' }[k]
    const m = n > 1
      ? { agua: `${n} focos próximos somam ${kmf(area)} de água nova.`, solo: `${n} focos próximos somam ${kmf(area)} de margem exposta.`, arvore: `${n} focos próximos somam ${kmf(area)} de floresta perdida.` }[k]
      : { agua: `${kmf(area)} de água parada onde não havia em ${rd.a}. O sinal caiu ${Math.round(rep.f.delta_db)} dB.`, solo: `Onde havia água em ${rd.a}, agora há margem exposta.`, arvore: 'Queda no sinal da vegetação. Pode ser corte ou queimada.' }[k]
    return { id: rep.id, lvl, p: gm, t, l: rep.f.local, ty: k, m, pz: `Detectado em ${rd.b}`, src: 'NISAR', _x: rep.x, _y: rep.y }
  })
  const R = { Alto: 0, 'Médio': 1, Baixo: 2 }
  al.sort((a, b) => R[a.lvl] - R[b.lvl] || b.p - a.p)
  const out: Alert[] = [], types = new Set<string>()
  al.forEach(a => { if (out.length < 4 && !types.has(a.ty)) { out.push(a); types.add(a.ty) } })
  al.forEach(a => {
    if (out.length >= 4 || out.includes(a)) return
    if (out.some(o => o.ty === a.ty && Math.hypot(o._x! - a._x!, o._y! - a._y!) < 100)) return
    out.push(a)
  })
  out.sort((a, b) => R[a.lvl] - R[b.lvl] || b.p - a.p)
  return out
}

export function buildReal(d: FocosAppJson, img: string, cidadesLL: Record<string, [number, number]> = CID_LL): RealSet {
  const rd = realDates(d.antes.data, d.depois.data, d.focos.length)
  const { X, Y } = projector(d.imagem)
  const dd = Math.max(0, ago(fmtD(d.depois.data).date))
  const ev: Ev[] = d.focos.map(f => ({ id: f.id, k: f.tipo, x: +X(f.lon).toFixed(1), y: +Y(f.lat).toFixed(1), n: 1, d: dd, st: 'obs', pl: f.local, a: f.area_km2 }))
  const info: Record<string, Info> = {}
  d.focos.forEach(f => { info[f.id] = infoFoco(f, rd) })
  const cities: Record<string, [number, number]> = {}
  Object.entries(cidadesLL).forEach(([n, [lo, la]]) => { const x = X(lo), y = Y(la); if (x > 20 && x < 726 && y > 20 && y < 488) cities[n] = [+x.toFixed(1), +y.toFixed(1)] })
  const areaOf = (id: string) => d.focos.find(f => f.id === id)?.area_km2 ?? 0
  const cmp: Record<string, CmpEntry> = {}
  ;(['agua', 'arvore', 'solo'] as RealKind[]).forEach(k => { cmp[k] = { why: realWhy(k, rd), heat: ev.filter(e => e.k === k).map(e => [e.x, e.y, 22 + areaOf(e.id) * 14]) } })
  return { rd, meta: d, ev, info, alerts: realAlerts(ev, d.focos, rd), cities, cmp, img }
}

// ---- linha do tempo ----
export interface TimelinePoint {
  date: string
  img: string | null
  vs: string | null
  ev: Ev[]
  info: Record<string, Info>
  resumo: LinhaTempoJson['passagens'][number]['resumo']
}

export function buildTimeline(lt: LinhaTempoJson, base: string): TimelinePoint[] {
  const { X, Y } = projector(lt.recorte)
  return lt.passagens.map(p => {
    const rd = p.comparado_com ? realDates(p.comparado_com, p.data, p.focos.length) : null
    const dd = Math.max(0, ago(fmtD(p.data).date))
    const ev: Ev[] = p.focos.map(f => ({ id: f.id, k: f.tipo, x: +X(f.lon).toFixed(1), y: +Y(f.lat).toFixed(1), n: 1, d: dd, st: 'obs', pl: f.local, a: f.area_km2, date: p.data }))
    const info: Record<string, Info> = {}
    if (rd) p.focos.forEach(f => { info[f.id] = infoFoco(f, rd) })
    return { date: p.data, img: p.imagem ? base + p.imagem : null, vs: p.comparado_com, ev, info, resumo: p.resumo }
  })
}

/** Uma região com dados reais (data/regioes.json, gravado pelo pipeline) */
export interface RealMeta {
  id: string
  nome: string
  pais: string
  /** subpasta dentro de data/ ('' = raiz, a Amazônia) */
  pasta: string
  imagem: { oeste: number; leste: number; norte: number; sul: number }
  antes: string
  depois: string
  focos: number
  linha_tempo: boolean
  cidades?: Record<string, [number, number]>
}
export const REAL_DEFAULT: RealMeta = {
  id: 'amazonia', nome: 'Rio Madeira · Amazonas', pais: 'Brasil', pasta: '',
  imagem: { oeste: -62.05, leste: -58.95, norte: -3.944, sul: -6.056 }, antes: '2026-09-03', depois: '2026-10-21', focos: 10, linha_tempo: true,
}
/** Título do painel e nome curto para o menu */
export const REAL_TITLES: Record<string, [string, string]> = {
  amazonia: ['Radar da Amazônia', 'Amazônia'],
  sul: ['Radar do Sul do Brasil', 'Sul do Brasil'],
  bangladesh: ['Radar de Bangladesh', 'Bangladesh'],
}
export const realTitle = (m: RealMeta) => REAL_TITLES[m.id]?.[0] ?? `Radar · ${m.nome}`
export const realShort = (m: RealMeta) => REAL_TITLES[m.id]?.[1] ?? m.nome.split(' · ')[0]
