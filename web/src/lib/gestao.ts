// v7.5 · Gestão (não desastre): prioridade de cada foco para quem gere o recurso.
// A força do sinal do radar sozinha não diz o que importa para a gestão. A prioridade soma:
//   área afetada (mesmo tipo, até ~18 km)  → até 2 pontos
//   repetição em passagens anteriores (mesmo tipo, até 10 km) → até 2 pontos (menos chance de ruído)
//   sinal forte (grau ≥ 81)                → 1 ponto
//   total ≥ 3 = prioridade alta · 2 = média · 0–1 = baixa
import type { Alert, Ev, Level } from './types'
import type { TimelinePoint } from './real'

const km = (a: { lon?: number; lat?: number }, b: { lon?: number; lat?: number }) =>
  a.lon == null || a.lat == null || b.lon == null || b.lat == null ? Infinity
    : 111.32 * Math.hypot((a.lon - b.lon) * Math.cos((a.lat * Math.PI) / 180), a.lat - b.lat)

export interface Prioridade { lvl: Level; pontos: number; area: number; passagens: number; sinal: 'forte' | 'médio' | 'fraco'; porque: string[] }

export function prioridade(a: Alert, ev: Ev[], tl: TimelinePoint[], en: boolean): Prioridade {
  const area = ev.filter(e => e.k === a.ty && km(e, a) <= 18).reduce((t, e) => t + (e.a ?? 0), 0)
  const atual = tl.length ? tl[tl.length - 1].date : null
  const passagens = tl.filter(p => p.date !== atual && p.ev.some(e => e.k === a.ty && km(e, a) <= 10)).length
  const sinal = a.p >= 81 ? 'forte' : a.p >= 51 ? 'médio' : 'fraco'
  const pA = area >= 2 ? 2 : area >= 0.5 ? 1 : 0
  const pR = passagens >= 2 ? 2 : passagens === 1 ? 1 : 0
  const pS = sinal === 'forte' ? 1 : 0
  const pontos = pA + pR + pS
  const f = (v: number) => v.toLocaleString(en ? 'en' : 'pt-BR', { maximumFractionDigits: 2 })
  const porque = en ? [
    `Area: ${f(area)} km² of the same change nearby (+${pA})`,
    `Repeats in ${passagens} earlier radar pass${passagens === 1 ? '' : 'es'} (+${pR})`,
    `Radar signal ${sinal === 'forte' ? 'strong' : sinal === 'médio' ? 'medium' : 'weak'} (+${pS})`,
  ] : [
    `Área: ${f(area)} km² da mesma mudança por perto (+${pA})`,
    `Repete em ${passagens} passage${passagens === 1 ? 'm anterior' : 'ns anteriores'} do radar (+${pR})`,
    `Sinal do radar ${sinal} (+${pS})`,
  ]
  return { lvl: pontos >= 3 ? 'Alto' : pontos === 2 ? 'Médio' : 'Baixo', pontos, area, passagens, sinal, porque }
}

/** alertas com a prioridade de gestão no lugar do nível de perigo, ordenados por pontos */
export function priorizar(al: Alert[], ev: Ev[], tl: TimelinePoint[], en: boolean): Alert[] {
  const nome = { Alto: en ? 'High priority' : 'Prioridade alta', 'Médio': en ? 'Medium priority' : 'Prioridade média', Baixo: en ? 'Low priority' : 'Prioridade baixa' }
  return al.map(a => {
    if (a.src !== 'NISAR') return a
    const P = prioridade(a, ev, tl, en)
    return { ...a, lvl: P.lvl, badge: nome[P.lvl], provas: P.porque, _pontos: P.pontos } as Alert & { _pontos: number }
  }).sort((x, y) => ((y as { _pontos?: number })._pontos ?? 0) - ((x as { _pontos?: number })._pontos ?? 0))
}

/** balanço acumulado por tipo ao longo das passagens (cada passagem é comparada com a anterior) */
export function balanco(tl: TimelinePoint[]) {
  const tipos = ['arvore', 'agua', 'solo'] as const
  const comp = tl.filter(p => p.vs)
  const r = Object.fromEntries(tipos.map(k => [k, {
    km2: +comp.reduce((t, p) => t + (p.resumo.area_km2[k] ?? 0), 0).toFixed(2),
    focos: comp.reduce((t, p) => t + (p.resumo.por_tipo[k] ?? 0), 0),
    passagens: comp.filter(p => (p.resumo.por_tipo[k] ?? 0) > 0).length,
  }])) as Record<typeof tipos[number], { km2: number; focos: number; passagens: number }>
  return { r, de: tl[0]?.date ?? null, ate: tl[tl.length - 1]?.date ?? null, n: comp.length }
}

/** CSV de todos os focos de todas as passagens, para QGIS / planilha */
export function csvFocos(tl: TimelinePoint[]) {
  const lin = ['data_passagem,comparado_com,tipo,lon,lat,area_km2,local']
  tl.forEach(p => p.ev.forEach(e => {
    lin.push([p.date, p.vs ?? '', e.k, e.lon ?? '', e.lat ?? '', e.a ?? '', `"${(e.pl ?? '').replace(/"/g, "'")}"`].join(','))
  }))
  return lin.join('\n')
}
