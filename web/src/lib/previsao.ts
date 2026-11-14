// v5.2 · PREVISÃO POR CRUZAMENTO DE DADOS
// Junta, no mesmo lugar e ao longo do tempo, o que cada fonte viu:
//   NISAR (radar, cada passagem comparada com a anterior) · LHASA (perigo de deslizamento por chuva) · FIRMS (focos de calor)
// e compara o período atual com o anterior (a água cresceu? a encosta continua mudando?).
// São regras do A.R.K.O, não um modelo treinado: cada previsão é uma hipótese e mostra as provas que a sustentam.
import type { Alert, Ev, FocoMontanha, Level, RiscosJson } from './types'
import type { TimelinePoint } from './real'
import { dia } from './riscos'

const R = 6371
export const km = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => {
  const dLa = ((b.lat - a.lat) * Math.PI) / 180, dLo = ((b.lon - a.lon) * Math.PI) / 180
  const h = Math.sin(dLa / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const PERTO = 5            // km: "mesma área"
const n2 = (v: number, en: boolean) => (en ? v.toFixed(2) : v.toFixed(2).replace('.', ','))
type P = { lon: number; lat: number }
const temLL = (e: Ev): e is Ev & P => e.lon != null && e.lat != null

interface Ctx {
  timeline: TimelinePoint[]
  montanha?: FocoMontanha[]
  riscos?: RiscosJson
  lang: string
}

export function previsoes({ timeline, montanha, riscos, lang }: Ctx): Alert[] {
  const en = lang === 'en'
  const pass = timeline.filter(p => p.vs && p.ev.length >= 0).filter(p => p.vs)   // passagens comparadas com a anterior
  const ult = pass[pass.length - 1], ant = pass[pass.length - 2]
  const out: (Alert & { _score: number })[] = []
  const add = (o: Omit<Alert, 'id' | 'src' | 'badge' | 'p'> & { _score: number; provas: string[] }) => {
    // não repete a mesma previsão no mesmo lugar
    if (out.some(x => x.ty === o.ty && x.lon != null && km(x as P, o as unknown as P) < PERTO)) return
    out.push({ ...o, id: `p-${out.length}`, src: 'ext', p: Math.min(100, Math.round(o._score)),
      badge: `${en ? 'Forecast' : 'Previsão'} · ${en ? ({ Alto: 'High', 'Médio': 'Medium', Baixo: 'Low' } as const)[o.lvl] : o.lvl}` })
  }
  const evU = (ult?.ev ?? []).filter(temLL), evA = (ant?.ev ?? []).filter(temLL)
  const dU = ult ? dia(ult.date, en) : '', dA = ant ? dia(ant.date, en) : ''
  const lhasa = riscos?.deslizamento?.areas ?? []
  const fogo = riscos?.fogo?.grupos ?? []
  const mt = montanha ?? []
  const areaPerto = (lista: (Ev & P)[], p: P, k: string) => lista.filter(e => e.k === k && km(e, p) < PERTO).reduce((t, e) => t + (e.a ?? 0), 0)

  // 1 · ÁGUA CRESCENDO: água nova nesta passagem e também na anterior, no mesmo lugar (ou crescendo) -> enchente se espalhando
  evU.filter(e => e.k === 'agua').forEach(e => {
    const agora = areaPerto(evU, e, 'agua'), antes = areaPerto(evA, e, 'agua')
    if (!antes) return
    const cresc = agora > antes * 1.2
    const chuva = lhasa.filter(l => l.nivel !== 'Baixo' && km(l, e) < 20)
    const lvl: Level = cresc && (chuva.length || agora > 2) ? 'Alto' : 'Médio'
    add({
      lvl, ty: 'agua', lon: e.lon, lat: e.lat, l: e.pl, _score: 60 + (cresc ? 25 : 0) + (chuva.length ? 15 : 0),
      t: en ? 'Flooding may spread' : 'Alagamento pode se espalhar',
      m: en ? `New water in two passes in a row here${cresc ? ', and growing' : ''}: the area keeps flooding.`
            : `Água nova em duas passagens seguidas aqui${cresc ? ', e aumentando' : ''}: a área continua alagando.`,
      pz: en ? 'NISAR comparison' : 'Comparação NISAR',
      provas: [
        en ? `NISAR ${dA}: ${n2(antes, en)} km² of new water within ${PERTO} km` : `NISAR ${dA}: ${n2(antes, en)} km² de água nova a até ${PERTO} km`,
        en ? `NISAR ${dU}: ${n2(agora, en)} km² (${agora >= antes ? '+' : ''}${Math.round((agora / antes - 1) * 100)}%)` : `NISAR ${dU}: ${n2(agora, en)} km² (${agora >= antes ? '+' : ''}${Math.round((agora / antes - 1) * 100)}%)`,
        ...chuva.slice(0, 1).map(c => en ? `NASA LHASA: ${Math.round(c.p * 100)}% landslide danger from rain ${Math.round(km(c, e))} km away (wet ground)` : `NASA LHASA: perigo de ${Math.round(c.p * 100)}% de deslizamento por chuva a ${Math.round(km(c, e))} km (solo encharcado)`),
      ],
    })
  })

  // 2 · DESLIZAMENTO PROVÁVEL: perigo LHASA + a encosta já mudando no radar (material novo ou vegetação arrancada)
  const encosta: { p: P; o: string; k: string }[] = [
    ...mt.filter(f => f.tipo === 'detritos').map(f => ({ p: f, o: f.local, k: en ? 'new material on the slope' : 'material novo na encosta' })),
    ...evU.filter(e => e.k === 'arvore').map(e => ({ p: e as P, o: e.pl, k: en ? 'vegetation torn off' : 'vegetação arrancada' })),
  ]
  lhasa.forEach(l => {
    const perto = encosta.filter(x => km(x.p, l) < PERTO)
    if (!perto.length) return
    add({
      lvl: l.nivel === 'Baixo' ? 'Médio' : 'Alto', ty: 'deslizamento', lon: l.lon, lat: l.lat, l: l.lugar, _score: (l.nivel === 'Baixo' ? 50 : 70) + l.p * 100,
      t: en ? 'Landslide likely' : 'Deslizamento provável',
      m: en ? 'Rain-triggered landslide danger where the radar already sees the slope changing.' : 'Perigo de deslizamento por chuva onde o radar já vê a encosta mudando.',
      pz: 'NISAR + NASA LHASA',
      provas: [
        en ? `NASA LHASA ${dia(riscos!.deslizamento!.data, en)}: ${Math.round(l.p * 100)}% chance` : `NASA LHASA ${dia(riscos!.deslizamento!.data, en)}: chance de ${Math.round(l.p * 100)}%`,
        ...perto.slice(0, 2).map(x => `NISAR ${dU}: ${x.k} a ${Math.round(km(x.p, l) * 10) / 10} km`),
      ],
    })
  })
  // encosta mudando em duas passagens seguidas, mesmo sem chuva prevista
  evU.filter(e => e.k === 'arvore').forEach(e => {
    const antes = evA.filter(x => x.k === 'arvore' && km(x, e) < PERTO)
    if (!antes.length) return
    add({
      lvl: 'Médio', ty: 'deslizamento', lon: e.lon, lat: e.lat, l: e.pl, _score: 55,
      t: en ? 'Ground keeps changing' : 'Terreno mudando sem parar',
      m: en ? 'Vegetation loss here in two passes in a row: bare ground erodes and slides more easily with rain.'
            : 'Perda de vegetação aqui em duas passagens seguidas: terreno sem cobertura erode e desliza mais fácil com chuva.',
      pz: en ? 'NISAR comparison' : 'Comparação NISAR',
      provas: [`NISAR ${dA}: ${antes.length} ${en ? 'spot(s)' : antes.length === 1 ? 'foco' : 'focos'}`, `NISAR ${dU}: ${n2(e.a ?? 0, en)} km²`],
    })
  })

  // 3 · LAGO GLACIAL: gelo/neve mudando + água nova perto -> perigo de enxurrada de lago glacial (GLOF)
  mt.filter(f => f.tipo === 'gelo').forEach(g => {
    const agua = evU.filter(e => e.k === 'agua' && km(e, g) < PERTO * 2)
    if (!agua.length) return
    add({
      lvl: 'Alto', ty: 'geleira', lon: g.lon, lat: g.lat, l: g.local, _score: 90,
      t: en ? 'Glacial lake flood danger' : 'Perigo de enxurrada de lago glacial',
      m: en ? 'Ice changing next to new water: a meltwater lake may be forming or growing.' : 'Gelo mudando ao lado de água nova: pode haver um lago de degelo se formando ou crescendo.',
      pz: 'NISAR',
      provas: [`NISAR: ${en ? 'ice/snow changing' : 'gelo/neve mudando'} (${n2(g.area_km2, en)} km²)`,
        ...agua.slice(0, 2).map(a => `NISAR ${dU}: ${en ? 'new water' : 'água nova'} ${n2(a.a ?? 0, en)} km² a ${Math.round(km(a, g))} km`)],
    })
  })

  // 4 · QUEIMADA CONFIRMADA: foco de calor (FIRMS) + perda de vegetação no radar no mesmo lugar
  fogo.forEach(f => {
    const veg = evU.filter(e => e.k === 'arvore' && km(e, f) < 3)
    if (!veg.length) return
    const area = veg.reduce((t, e) => t + (e.a ?? 0), 0)
    add({
      lvl: f.nivel === 'Baixo' ? 'Médio' : 'Alto', ty: 'fogo', lon: f.lon, lat: f.lat, l: f.lugar, _score: 65 + f.n,
      t: en ? 'Fire confirmed by radar' : 'Queimada confirmada pelo radar',
      m: en ? `Heat spots and vegetation loss in the same place: about ${n2(area, en)} km² burned.` : `Focos de calor e perda de vegetação no mesmo lugar: cerca de ${n2(area, en)} km² queimados.`,
      pz: 'NISAR + NASA FIRMS',
      provas: [`NASA FIRMS: ${f.n} ${en ? 'heat spots' : 'focos de calor'} (48 h)`, `NISAR ${dU}: ${en ? 'vegetation loss' : 'perda de vegetação'} ${n2(area, en)} km²`],
    })
  })

  // 5 · COMPARAÇÃO DA REGIÃO: água nova muito maior que no período anterior
  if (ult && ant) {
    const a1 = ult.resumo.area_km2.agua ?? 0, a0 = ant.resumo.area_km2.agua ?? 0
    if (a1 > 1 && a1 > a0 * 2) {
      const e = evU.filter(x => x.k === 'agua').sort((x, y) => (y.a ?? 0) - (x.a ?? 0))[0]
      if (e) add({
        lvl: a1 > 5 ? 'Alto' : 'Médio', ty: 'agua', lon: e.lon, lat: e.lat, l: e.pl, _score: 50 + Math.min(40, a1 * 4),
        t: en ? 'Much more water than the last period' : 'Muito mais água que no período anterior',
        m: en ? `New water jumped from ${n2(a0, en)} to ${n2(a1, en)} km² in the region. Watch rivers and low areas.`
              : `A água nova na região saltou de ${n2(a0, en)} para ${n2(a1, en)} km². Atenção a rios e áreas baixas.`,
        pz: en ? 'NISAR comparison' : 'Comparação NISAR',
        provas: [`NISAR ${dA}: ${n2(a0, en)} km²`, `NISAR ${dU}: ${n2(a1, en)} km²`],
      })
    }
  }
  out.sort((a, b) => b._score - a._score)
  return out.map(({ _score, ...a }) => { void _score; return a })
}
