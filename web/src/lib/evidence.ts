// Explicações geradas SÓ a partir dos dados reais do NISAR (linha_tempo.json de cada região).
// Nada aqui é texto fixo sobre um lugar: tudo é calculado dos focos medidos pelo pipeline
// (tipo pela regra de detecção, Δ em dB, área, datas comparadas e posição).
// A única parte genérica é a física do radar ("o que pode gerar esse sinal"), que vale para
// qualquer lugar e vem da documentação da missão (ASF DAAC / NASA JPL).
import type { Ev } from './types'
import type { TimelinePoint } from './real'
import { fmtD } from './util'

export type Lang = 'pt' | 'en'
type K = 'agua' | 'solo' | 'arvore'
const KS: K[] = ['agua', 'solo', 'arvore']
/** pixel da grade usada (GCOV frequência B, 80 m) */
export const PX_M = 80
const PX_KM2 = (PX_M / 1000) ** 2
/** raio para considerar "o mesmo lugar" entre passagens */
const SPOT_KM = 2

const n1 = (x: number, lang: Lang) => (lang === 'pt' ? x.toFixed(1).replace('.', ',') : x.toFixed(1))
const n2 = (x: number, lang: Lang) => (lang === 'pt' ? x.toFixed(2).replace('.', ',') : x.toFixed(2))
const dt = (iso: string, lang: Lang) => { const f = fmtD(iso); return `${lang === 'pt' ? f.pt : f.en} ${f.y}` }
/** campo de futebol oficial: 105 m × 68 m */
const CAMPO_KM2 = 0.105 * 0.068
const int = (x: number, lang: Lang) => Math.round(x).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')
/** área em linguagem do dia a dia */
export const fields = (km2: number, lang: Lang) => {
  const c = km2 / CAMPO_KM2
  return lang === 'pt' ? `cerca de ${int(c, lang)} campo${Math.round(c) === 1 ? '' : 's'} de futebol` : `about ${int(c, lang)} football field${Math.round(c) === 1 ? '' : 's'}`
}
/** quantas vezes o eco mudou para um Δ em dB */
export const factor = (db: number) => Math.pow(10, Math.abs(db) / 10)

export const NAME: Record<K, [string, string]> = {
  agua: ['Água nova', 'New water'],
  solo: ['Água que recuou', 'Water receded'],
  arvore: ['Floresta perdida (queda no sinal da vegetação)', 'Forest lost (vegetation signal drop)'],
}
export const POL_OF: Record<K, 'HH' | 'HV'> = { agua: 'HH', solo: 'HH', arvore: 'HV' }
/** regra exata usada em pipeline/atualizar.py */
export const RULE: Record<K, [string, string]> = {
  agua: ['HH depois < −16 dB e queda de HH > 4 dB', 'HH after < −16 dB and HH drop > 4 dB'],
  solo: ['HH antes < −16 dB e subida de HH > 4 dB', 'HH before < −16 dB and HH rise > 4 dB'],
  arvore: ['HV antes > −16 dB e queda de HV > 2,5 dB', 'HV before > −16 dB and HV drop > 2.5 dB'],
}
const LIMIT: Record<K, number> = { agua: 4, solo: 4, arvore: 2.5 }

export interface Det { id: string; k: K; date: string; vs: string; db: number; a: number; lon: number; lat: number }

export function detections(tl: TimelinePoint[]): Det[] {
  const out: Det[] = []
  tl.forEach(p => p.ev.forEach(e => {
    if (!p.vs || e.lon == null || e.lat == null || e.db == null) return
    out.push({ id: e.id, k: e.k as K, date: p.date, vs: p.vs, db: e.db, a: e.a ?? 0, lon: e.lon, lat: e.lat })
  }))
  return out
}

const km = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) =>
  111.32 * Math.hypot((a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180), a.lat - b.lat)

// ---------------- física do radar (genérica, vale para qualquer lugar) ----------------
const PHYS: Record<K, { what: [string, string]; could: [string, string][]; notRadar: [string, string] }> = {
  agua: {
    what: ['O eco HH ficou fraco: a superfície passou a refletir a onda para longe do satélite, como um espelho. É o comportamento de água parada.', 'The HH echo became weak: the surface started reflecting the wave away from the satellite, like a mirror. That is how still water behaves.'],
    could: [
      ['Área alagada (rio, lago ou chuva acumulada)', 'Flooded area (river, lake or pooled rain)'],
      ['Lâmina d’água colocada pelas pessoas (lavoura irrigada por inundação, represa)', 'Water put there by people (flood-irrigated fields, reservoirs)'],
      ['Falso positivo possível: outra superfície muito lisa (areia fina, solo nivelado)', 'Possible false positive: another very smooth surface (fine sand, levelled soil)'],
    ],
    notRadar: ['O radar mede a superfície, não a origem da água: ele não sabe se veio de chuva, de rio ou de irrigação.', 'Radar measures the surface, not where the water came from: it cannot tell rain, river or irrigation apart.'],
  },
  solo: {
    what: ['Antes o eco HH era fraco como o de água; agora voltou forte: a superfície deixou de ser lisa.', 'Before, the HH echo was weak like water; now it is strong again: the surface is no longer smooth.'],
    could: [
      ['A água baixou e expôs chão, margem ou plantas', 'Water went down and exposed ground, banks or plants'],
      ['Plantas cresceram acima da lâmina d’água', 'Plants grew above the water surface'],
      ['Falso positivo possível: vento formando ondas na água no momento da passagem', 'Possible false positive: wind making waves on the water at the time of the pass'],
    ],
    notRadar: ['O radar mostra que a água saiu daquele pixel, não por que ela saiu.', 'Radar shows the water left that pixel, not why it left.'],
  },
  arvore: {
    what: ['O eco HV caiu: menos galhos e folhas “giraram” a onda de volta ao satélite. Há menos volume de vegetação.', 'The HV echo dropped: fewer branches and leaves “rotated” the wave back to the satellite. There is less vegetation volume.'],
    could: [
      ['Corte de vegetação (desmatamento ou corte de floresta plantada)', 'Vegetation cut (clearing or harvest of planted forest)'],
      ['Queimada', 'Fire'],
      ['Colheita de lavoura', 'Crop harvest'],
      ['Falso positivo possível: vegetação ou solo mais secos que na passagem anterior', 'Possible false positive: vegetation or soil drier than in the previous pass'],
    ],
    notRadar: ['Só com o radar não dá para separar corte, queimada e colheita: todos tiram volume de vegetação.', 'Radar alone cannot separate cutting, fire and harvest: all of them remove vegetation volume.'],
  },
}
export const physics = (k: string, lang: Lang) => {
  const p = PHYS[k as K]; if (!p) return null
  const L = (b: [string, string]) => (lang === 'pt' ? b[0] : b[1])
  return { what: L(p.what), could: p.could.map(L), notRadar: L(p.notRadar) }
}

// ---------------- evidência de UM foco ----------------
export interface FocusEvidence {
  pol: 'HH' | 'HV'
  measured: string[]
  spot: string[]
  reading: string | null
  /** a mesma informação em palavras simples */
  plain: string
  plainPol: string
}

export function focusEvidence(e: Ev, tl: TimelinePoint[], fallback: { vs: string; date: string }, lang: Lang): FocusEvidence | null {
  const k = e.k as K
  if (!KS.includes(k) || e.db == null) return null
  const pt = lang === 'pt'
  const vs = e.vs ?? fallback.vs, date = e.date ?? fallback.date
  const pol = POL_OF[k]
  const up = k === 'solo'
  const f = factor(e.db)
  const measured = [
    pt ? `Sinal ${pol} ${up ? 'subiu' : 'caiu'} ${n1(e.db, lang)} dB entre ${dt(vs, lang)} e ${dt(date, lang)} (média do foco).`
       : `${pol} signal ${up ? 'rose' : 'dropped'} ${n1(e.db, lang)} dB between ${dt(vs, lang)} and ${dt(date, lang)} (focus average).`,
    pt ? `Isso é um eco ${n1(f, lang)}× ${up ? 'mais forte' : 'mais fraco'} que antes.` : `That is an echo ${n1(f, lang)}× ${up ? 'stronger' : 'weaker'} than before.`,
    pt ? `Regra que disparou: ${RULE[k][0]}. Passou do limite em ${n1(e.db - LIMIT[k], lang)} dB.` : `Rule triggered: ${RULE[k][1]}. Above the limit by ${n1(e.db - LIMIT[k], lang)} dB.`,
  ]
  if (e.a != null) measured.push(pt ? `Área: ${n2(e.a, lang)} km² (≈ ${Math.round(e.a / PX_KM2)} pixels de ${PX_M} m).` : `Area: ${n2(e.a, lang)} km² (≈ ${Math.round(e.a / PX_KM2)} pixels of ${PX_M} m).`)
  if (e.hh) measured.push(`HH: ${n1(e.hh[0], lang)} → ${n1(e.hh[1], lang)} dB`)
  if (e.hv) measured.push(`HV: ${n1(e.hv[0], lang)} → ${n1(e.hv[1], lang)} dB`)

  // o mesmo lugar em outras passagens
  const all = detections(tl)
  const here = { lon: e.lon!, lat: e.lat! }
  const near = e.lon == null ? [] : all.filter(d => !(d.id === e.id && d.date === date) && km(d, here) <= SPOT_KM)
  const others = near.filter(d => !(d.date === date && d.k === k)).sort((a, b) => a.date.localeCompare(b.date))
  const nPass = tl.filter(p => p.vs).length
  const spot = others.slice(0, 6).map(d => `${dt(d.date, lang)} · ${pt ? NAME[d.k][0].split(' (')[0] : NAME[d.k][1].split(' (')[0]} · ${n1(d.db, lang)} dB · ${n2(d.a, lang)} km²`)
  let reading: string | null = null
  if (!others.length) {
    reading = pt ? `Nenhuma outra detecção a menos de ${SPOT_KM} km deste ponto nas ${nPass} comparações de passagens disponíveis.` : `No other detection within ${SPOT_KM} km of this point in the ${nPass} available pass comparisons.`
  } else if (k === 'agua' || k === 'solo') {
    const opp = others.filter(d => d.k === (k === 'agua' ? 'solo' : 'agua'))
    const later = opp.filter(d => d.date > date)[0], earlier = opp.filter(d => d.date < date).at(-1)
    if (k === 'agua' && later) reading = pt ? `Neste ponto o radar viu a água chegar (${dt(date, lang)}) e depois sair (${dt(later.date, lang)}): pelos dados, a água foi temporária.` : `At this point radar saw water arrive (${dt(date, lang)}) and later leave (${dt(later.date, lang)}): according to the data, the water was temporary.`
    else if (k === 'solo' && earlier) reading = pt ? `Neste ponto o radar viu a água chegar (${dt(earlier.date, lang)}) e depois sair (${dt(date, lang)}): pelos dados, a água foi temporária.` : `At this point radar saw water arrive (${dt(earlier.date, lang)}) and later leave (${dt(date, lang)}): according to the data, the water was temporary.`
    else {
      const same = others.filter(d => d.k === k)
      if (same.length) reading = pt ? `${same.length + 1} detecções de “${NAME[k][0]}” neste ponto em datas diferentes: a mudança se repetiu.` : `${same.length + 1} “${NAME[k][1]}” detections at this point on different dates: the change repeated.`
    }
  } else {
    const same = others.filter(d => d.k === 'arvore')
    if (same.length) reading = pt ? `O sinal da vegetação caiu neste ponto em ${same.length + 1} passagens diferentes.` : `The vegetation signal dropped at this point in ${same.length + 1} different passes.`
  }
  const A = dt(vs, lang), B = dt(date, lang), area = e.a != null ? ` (${n2(e.a, lang)} km², ${fields(e.a, lang)})` : ''
  const plain = pt ? {
    agua: `Em ${A} o radar não via água parada aqui. Em ${B}, passou a ver o que parece água parada cobrindo a área${area}.`,
    solo: `Em ${A} o radar via o que parece água parada aqui. Em ${B}, isso tinha sumido${area}: o chão ou as plantas voltaram a aparecer.`,
    arvore: `Entre ${A} e ${B}, este lugar ficou com menos plantas, ou com plantas mais secas${area}.`,
  }[k] : {
    agua: `On ${A} the radar saw no still water here. On ${B}, it saw what looks like still water covering the area${area}.`,
    solo: `On ${A} the radar saw what looks like still water here. By ${B}, it was gone${area}: ground or plants showed up again.`,
    arvore: `Between ${A} and ${B}, this place ended up with fewer plants, or drier plants${area}.`,
  }[k]
  const fx = n1(f, lang)
  const plainPol = pt ? {
    agua: `O satélite manda uma onda e escuta o eco, como quem grita num vale. Aqui o eco voltou ${fx} vezes mais fraco. Água parada funciona como um espelho: a onda bate e vai para o outro lado, quase nada volta. Por isso eco fraco = água.`,
    solo: `O satélite manda uma onda e escuta o eco. Antes, aqui, quase nada voltava (como num espelho d’água). Agora o eco voltou ${fx} vezes mais forte: a superfície ficou áspera de novo, sinal de que a água saiu.`,
    arvore: `O satélite manda uma onda “deitada” e escuta a parte que volta “em pé”. Quem faz a onda virar são galhos e folhas. Aqui essa parte do eco ficou ${fx} vezes mais fraca: tem menos planta para virar a onda.`,
  }[k] : {
    agua: `The satellite sends a wave and listens to the echo, like shouting in a valley. Here the echo came back ${fx} times weaker. Still water acts like a mirror: the wave bounces away and almost nothing returns. So a weak echo = water.`,
    solo: `The satellite sends a wave and listens to the echo. Before, almost nothing came back here (like a mirror of water). Now the echo is ${fx} times stronger: the surface is rough again, a sign the water left.`,
    arvore: `The satellite sends a “lying down” wave and listens to the part that comes back “standing up”. Branches and leaves are what turn the wave. Here that part of the echo got ${fx} times weaker: there are fewer plants to turn the wave.`,
  }[k]
  return { pol, measured, spot, reading, plain, plainPol }
}

// ---------------- resumo de UMA região (todas as passagens) ----------------
export interface TypeStat { k: K; n: number; passes: number; area: number; dbMean: number; dbMin: number; dbMax: number; peak: { date: string; n: number; area: number } | null; first: string | null; last: string | null }
export interface RegionEvidence { passes: { date: string; vs: string; c: Record<K, number> }[]; stats: TypeStat[]; total: number }

export function regionEvidence(tl: TimelinePoint[]): RegionEvidence | null {
  const all = detections(tl)
  const passes = tl.filter(p => p.vs).map(p => ({ date: p.date, vs: p.vs!, c: { agua: 0, solo: 0, arvore: 0 } as Record<K, number> }))
  if (!passes.length) return null
  all.forEach(d => { const p = passes.find(x => x.date === d.date); if (p) p.c[d.k]++ })
  const stats = KS.map(k => {
    const ds = all.filter(d => d.k === k)
    const byDate: Record<string, { n: number; area: number }> = {}
    ds.forEach(d => { const b = (byDate[d.date] ??= { n: 0, area: 0 }); b.n++; b.area += d.a })
    const peakD = Object.entries(byDate).sort((a, b) => b[1].n - a[1].n || b[1].area - a[1].area)[0]
    const dates = Object.keys(byDate).sort()
    return {
      k, n: ds.length, passes: dates.length, area: ds.reduce((t, d) => t + d.a, 0),
      dbMean: ds.length ? ds.reduce((t, d) => t + d.db, 0) / ds.length : 0,
      dbMin: ds.length ? Math.min(...ds.map(d => d.db)) : 0, dbMax: ds.length ? Math.max(...ds.map(d => d.db)) : 0,
      peak: peakD ? { date: peakD[0], ...peakD[1] } : null, first: dates[0] ?? null, last: dates.at(-1) ?? null,
    }
  })
  return { passes, stats, total: all.length }
}

export function statLines(st: TypeStat, lang: Lang): string[] {
  const pt = lang === 'pt'
  if (!st.n) return [pt ? 'Nenhum foco deste tipo nas passagens disponíveis.' : 'No detections of this type in the available passes.']
  const up = st.k === 'solo'
  return [
    pt ? `${st.n} focos em ${st.passes} passagens, somando ${n2(st.area, lang)} km².` : `${st.n} detections in ${st.passes} passes, totalling ${n2(st.area, lang)} km².`,
    pt ? `Sinal ${POL_OF[st.k]} ${up ? 'subiu' : 'caiu'} em média ${n1(st.dbMean, lang)} dB (de ${n1(st.dbMin, lang)} a ${n1(st.dbMax, lang)} dB), ou seja, eco ${n1(factor(st.dbMean), lang)}× ${up ? 'mais forte' : 'mais fraco'}.`
       : `${POL_OF[st.k]} signal ${up ? 'rose' : 'dropped'} ${n1(st.dbMean, lang)} dB on average (${n1(st.dbMin, lang)} to ${n1(st.dbMax, lang)} dB), an echo ${n1(factor(st.dbMean), lang)}× ${up ? 'stronger' : 'weaker'}.`,
    st.peak ? (pt ? `Maior número na passagem de ${dt(st.peak.date, lang)}: ${st.peak.n} focos, ${n2(st.peak.area, lang)} km².` : `Most on the ${dt(st.peak.date, lang)} pass: ${st.peak.n} detections, ${n2(st.peak.area, lang)} km².`) : '',
    st.first && st.last && st.first !== st.last ? (pt ? `Primeira detecção em ${dt(st.first, lang)}, última em ${dt(st.last, lang)}.` : `First detection ${dt(st.first, lang)}, last ${dt(st.last, lang)}.`) : '',
  ].filter(Boolean)
}
/** resumo de um tipo em palavras simples */
export function statPlain(st: TypeStat, lang: Lang): string {
  const pt = lang === 'pt'
  if (!st.n) return ''
  const what = pt ? { agua: 'apareceu água parada', solo: 'a água foi embora', arvore: 'as plantas diminuíram' }[st.k] : { agua: 'still water appeared', solo: 'water went away', arvore: 'plants decreased' }[st.k]
  const pk = st.peak ? (pt ? ` O momento com mais casos foi ${dt(st.peak.date, lang)}.` : ` The busiest moment was ${dt(st.peak.date, lang)}.`) : ''
  return pt ? `Em ${st.n} lugares ${what}, somando ${n2(st.area, lang)} km² (${fields(st.area, lang)}).${pk}`
            : `In ${st.n} places ${what}, totalling ${n2(st.area, lang)} km² (${fields(st.area, lang)}).${pk}`
}
export const fmtDate = dt
