// v5.3 · Ficha de cada ponto de risco no mapa (fogo FIRMS, deslizamento LHASA, montanha NISAR, previsão por cruzamento).
// Mesmo formato do card dos focos do radar: Resumo (o que é + causa provável), Dados (o que levou a saber) e Polarização.
// Tudo montado a partir dos dados de cada fonte; as causas são hipóteses e aparecem como tal.
import type { Alert, Ev, FocoMontanha, RiscosJson } from './types'
import type { TimelinePoint } from './real'
import { dia, pequena } from './riscos'
import { km } from './previsao'

export interface Ficha {
  cor: string
  tag: string
  estado: string
  titulo: string
  sub: string
  metrica: string
  delta?: string
  causa: string
  resumo: string
  dados: string[]
  porque: string[]
  outras: string[]
  pol: { sigla: string; oque: string; texto: string; valores: string[] }
  grau: number
}

type P = { lon: number; lat: number }
const SECA_AMZ = [7, 8, 9, 10, 11]
const n1 = (v: number, en: boolean) => (en ? v.toFixed(1) : v.toFixed(1).replace('.', ','))
const n2 = (v: number, en: boolean) => (en ? v.toFixed(2) : v.toFixed(2).replace('.', ','))

interface Ctx { region: string; timeline: TimelinePoint[]; riscos?: RiscosJson; montanha?: FocoMontanha[]; lang: string }

/** focos do radar perto de um ponto, na passagem mais recente que os tem */
function radarPerto(tl: TimelinePoint[], p: P, raio: number, k?: string) {
  const out: { e: Ev & P; date: string; d: number }[] = []
  tl.forEach(pt => pt.ev.forEach(e => {
    if (e.lon == null || e.lat == null || (k && e.k !== k)) return
    const d = km(e as P, p)
    if (d <= raio) out.push({ e: e as Ev & P, date: pt.date, d })
  }))
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.d - b.d)
}
const ultimaPassagem = (tl: TimelinePoint[]) => tl.filter(p => p.vs).at(-1)?.date
const proxima = (iso?: string) => { if (!iso) return undefined; const d = new Date(iso + 'T12:00Z'); d.setUTCDate(d.getUTCDate() + 12); return d.toISOString().slice(0, 10) }

export function fichaFogo(i: number, c: Ctx): Ficha | null {
  const f = c.riscos?.fogo?.grupos[i]; if (!f) return null
  const en = c.lang === 'en', mes = Number(f.ultimo.slice(5, 7))
  const veg = radarPerto(c.timeline, f, 3, 'arvore')
  const ult = ultimaPassagem(c.timeline), prox = proxima(ult)
  const radarDepois = ult && ult >= f.ultimo.slice(0, 10)
  const intenso = f.n >= 10 || f.frp >= 150
  const pq = pequena(f)
  let causa: string
  if (pq) causa = en ? 'Probably a small controlled burn (trash, leaves, crop residue or a small field). Weak and isolated, so it does not raise an alert; it stays on the map in case it grows.'
                     : 'Provável queima pequena e controlada (lixo, folhas, palha ou roçado). Fraca e isolada, por isso não vira alerta; fica no mapa caso cresça.'
  else if (veg.length) causa = en ? `Fire linked to vegetation removal: the radar had already seen vegetation loss here on ${dia(veg[0].date, en)}.` : `Fogo ligado à retirada de vegetação: o radar já tinha visto perda de vegetação aqui em ${dia(veg[0].date, en)}.`
  else if (c.region === 'amazonia' && SECA_AMZ.includes(mes)) causa = en ? 'Dry-season burning, most likely set by people to clear land or renew pasture.' : 'Queima da estação seca, provavelmente colocada por pessoas para limpar área ou renovar pasto.'
  else if (c.region === 'bangladesh' || c.region === 'sul') causa = en ? 'Probably farm burning (crop residue or field clearing).' : 'Provavelmente queima agrícola (palha de colheita ou limpeza de lavoura).'
  else causa = en ? 'Active fire; the cause still needs to be checked.' : 'Fogo ativo; a causa ainda precisa ser checada.'
  return {
    cor: pq ? '#6B7280' : '#E2553A', tag: pq ? (en ? 'Small burn' : 'Pequena queima') : (en ? 'Risky fire' : 'Queimada de risco'), estado: en ? 'Seen by satellite' : 'Visto por satélite',
    titulo: f.lugar, sub: `NASA FIRMS · VIIRS · ${en ? 'last' : 'último'} ${dia(f.ultimo, en)} ${f.ultimo.slice(11, 16)} UTC`,
    metrica: `${f.n} ${en ? 'heat spots' : f.n === 1 ? 'foco de calor' : 'focos de calor'}`, delta: `${n1(f.frp, en)} MW`,
    grau: pq ? Math.min(25, Math.round(5 + f.n * 4 + f.frp)) : Math.min(100, Math.round(30 + f.n * 4 + f.frp / 5)),
    causa,
    resumo: intenso
      ? (en ? `A strong, spread-out fire: ${f.n} heat spots in ${c.riscos!.fogo!.janela_h} h within ~3 km. It may be advancing.` : `Fogo forte e espalhado: ${f.n} focos de calor em ${c.riscos!.fogo!.janela_h} h num raio de ~3 km. Pode estar avançando.`)
      : (en ? `A localized burn: ${f.n} heat spot(s) in ${c.riscos!.fogo!.janela_h} h.` : `Queima localizada: ${f.n} ${f.n === 1 ? 'foco' : 'focos'} de calor em ${c.riscos!.fogo!.janela_h} h.`),
    dados: [
      en ? `${f.n} hot pixels (375 m) from VIIRS on NOAA-20/21 in the last ${c.riscos!.fogo!.janela_h} h` : `${f.n} pixels quentes (375 m) do VIIRS nos satélites NOAA-20/21 nas últimas ${c.riscos!.fogo!.janela_h} h`,
      en ? `Fire radiative power: ${n1(f.frp, en)} MW in total (how much heat the fire releases)` : `Potência do fogo: ${n1(f.frp, en)} MW no total (quanto calor o fogo libera)`,
      en ? 'Low-confidence detections were removed; the same fire seen in two passes counts once' : 'Detecções de baixa confiança foram descartadas; o mesmo fogo visto em duas passagens conta uma vez só',
      ...(f.dois_satelites ? [en ? `${f.dois_satelites} of these spots were confirmed in more than one satellite pass (more confidence)` : `${f.dois_satelites} ${f.dois_satelites === 1 ? 'destes focos foi confirmado' : 'destes focos foram confirmados'} em mais de uma passagem de satélite (mais confiança)`] : []),
      veg.length
        ? (en ? `NISAR radar: vegetation loss of ${n2(veg[0].e.a ?? 0, en)} km² ${n1(veg[0].d, en)} km away (${dia(veg[0].date, en)})` : `Radar NISAR: perda de vegetação de ${n2(veg[0].e.a ?? 0, en)} km² a ${n1(veg[0].d, en)} km (${dia(veg[0].date, en)})`)
        : (en ? `NISAR radar: no vegetation loss within 3 km${ult ? ` up to the ${dia(ult, en)} pass` : ''}` : `Radar NISAR: sem perda de vegetação a até 3 km${ult ? ` até a passagem de ${dia(ult, en)}` : ''}`),
    ],
    porque: [
      ...(pq ? [en ? `A.R.K.O rule: 1–2 heat spots with less than 15 MW in total = small burn. Larger or stronger fires are "risky fires" (they can get out of control, including accidental fires).` : `Regra do A.R.K.O: 1 ou 2 focos com menos de 15 MW no total = pequena queima. Fogo maior ou mais forte é "queimada de risco" (pode fugir do controle, inclusive incêndio acidental).`] : []),
      ...(c.region === 'amazonia' && SECA_AMZ.includes(mes) ? [en ? 'The date falls in the southern Amazon dry season (Jul–Nov), when most fires are set by people.' : 'A data cai na estação seca do sul da Amazônia (jul–nov), quando a maior parte do fogo é colocada por pessoas.'] : []),
      intenso ? (en ? 'Many spots close together and high power point to a fire front, not an isolated spark.' : 'Muitos focos juntos e potência alta indicam frente de fogo, não uma faísca isolada.') : (en ? 'Few spots and low power point to a small, controlled burn.' : 'Poucos focos e potência baixa indicam queima pequena e controlada.'),
    ],
    outras: en ? ['Gas flare or industry (fixed hot spot, repeats every day)', 'Very hot exposed ground or rooftops (rare, low power)'] : ['Chama de gás ou indústria (ponto quente fixo, repete todo dia)', 'Solo exposto ou telhado muito quente (raro, potência baixa)'],
    pol: {
      sigla: 'HV', oque: en ? 'Vegetation volume' : 'Volume da vegetação',
      texto: en
        ? 'FIRMS sees heat (infrared); the radar sees what the fire leaves behind. Burning removes leaves and branches, so the HV echo (which bounces off vegetation) drops. Wet ash and bare soil can raise HH.'
        : 'O FIRMS vê o calor (infravermelho); o radar vê o que o fogo deixa. A queima tira folhas e galhos, então o eco HV (que volta da vegetação) cai. Cinza molhada e solo exposto podem fazer o HH subir.',
      valores: veg.length && veg[0].e.hv
        ? [`HV: ${n1(veg[0].e.hv[0], en)} → ${n1(veg[0].e.hv[1], en)} dB (${dia(veg[0].date, en)})`, ...(veg[0].e.hh ? [`HH: ${n1(veg[0].e.hh[0], en)} → ${n1(veg[0].e.hh[1], en)} dB`] : [])]
        : [radarDepois
            ? (en ? 'The radar passed after the fire and saw no vegetation loss here yet.' : 'O radar passou depois do fogo e ainda não viu perda de vegetação aqui.')
            : (en ? `The radar has not passed since the fire. Next NISAR pass ~${prox ? dia(prox, en) : '12 days'}: if the vegetation burned, HV should drop.` : `O radar ainda não passou depois do fogo. Próxima passagem do NISAR ~${prox ? dia(prox, en) : '12 dias'}: se a vegetação queimou, o HV deve cair.`)],
    },
  }
}

export function fichaLhasa(i: number, c: Ctx): Ficha | null {
  const d = c.riscos?.deslizamento, a = d?.areas[i]; if (!d || !a) return null
  const en = c.lang === 'en'
  const enc = radarPerto(c.timeline, a, 5).filter(x => x.e.k === 'arvore' || x.e.k === 'solo')
  const mt = (c.montanha ?? []).filter(m => m.tipo === 'detritos' && km(m, a) <= 5)
  return {
    cor: '#9A5B13', tag: en ? 'Landslide' : 'Deslizamento', estado: en ? 'Forecast (model)' : 'Previsão (modelo)',
    titulo: a.lugar, sub: `NASA LHASA · ${dia(d.data, en)}`,
    metrica: `${Math.round(a.p * 100)}% ${en ? 'chance' : 'de chance'}`, delta: `~${Math.round(a.km2)} km²`,
    grau: Math.min(100, Math.round(a.p * 400)),
    causa: en ? 'Rain on steep, already wet ground: the soil gets heavy and loses grip on the slope.' : 'Chuva em terreno íngreme e já encharcado: o solo fica pesado e perde a firmeza na encosta.',
    resumo: en ? `NASA's model puts a ${Math.round(a.p * 100)}% chance of a rain-triggered landslide here today${enc.length || mt.length ? ', and the radar already sees the ground changing nearby' : ''}.`
               : `O modelo da NASA estima ${Math.round(a.p * 100)}% de chance de deslizamento por chuva aqui hoje${enc.length || mt.length ? ', e o radar já vê o terreno mudando perto' : ''}.`,
    dados: [
      en ? `LHASA probability: ${Math.round(a.p * 100)}% (A.R.K.O thresholds: 10% medium, 25% high, tested on real landslides)` : `Probabilidade LHASA: ${Math.round(a.p * 100)}% (limiares do A.R.K.O: 10% médio, 25% alto, testados com deslizamentos reais)`,
      en ? `Area at this level: ~${Math.round(a.km2)} km² (1 km grid)` : `Área nesse nível: ~${Math.round(a.km2)} km² (grade de 1 km)`,
      en ? 'Inputs: GPM IMERG satellite rain (today and past days), soil moisture, snow, slope, faults and rock type' : 'Entradas: chuva do satélite GPM IMERG (hoje e dias anteriores), umidade do solo, neve, declividade, falhas e tipo de rocha',
      ...enc.slice(0, 2).map(x => en ? `NISAR ${dia(x.date, en)}: ${x.e.k === 'arvore' ? 'vegetation loss' : 'surface change'} ${n2(x.e.a ?? 0, en)} km² at ${n1(x.d, en)} km` : `NISAR ${dia(x.date, en)}: ${x.e.k === 'arvore' ? 'perda de vegetação' : 'mudança no terreno'} ${n2(x.e.a ?? 0, en)} km² a ${n1(x.d, en)} km`),
      ...mt.slice(0, 1).map(m => en ? `NISAR: new material on the slope (${n2(m.area_km2, en)} km²)` : `NISAR: material novo na encosta (${n2(m.area_km2, en)} km²)`),
    ],
    porque: [en ? 'LHASA was trained with thousands of past landslides and the conditions before each one.' : 'O LHASA foi treinado com milhares de deslizamentos passados e as condições antes de cada um.'],
    outras: en ? ['The model works on a 1 km grid: it shows the area, not the exact slope', 'Dry spells lower the chance in the next days'] : ['O modelo trabalha em grade de 1 km: mostra a área, não a encosta exata', 'Dias sem chuva baixam a chance nos próximos dias'],
    pol: {
      sigla: 'HH + HV', oque: en ? 'Surface and vegetation' : 'Superfície e vegetação',
      texto: en ? 'LHASA is not radar. If a slope slides, the radar sees it: vegetation is torn off (HV drops) and the ground gets rough with rocks and mud (HH rises).'
                : 'O LHASA não é radar. Se a encosta deslizar, o radar vê: a vegetação é arrancada (HV cai) e o chão fica áspero com pedras e lama (HH sobe).',
      valores: enc.filter(x => x.e.hv).slice(0, 1).map(x => `HV: ${n1(x.e.hv![0], en)} → ${n1(x.e.hv![1], en)} dB · HH: ${x.e.hh ? `${n1(x.e.hh[0], en)} → ${n1(x.e.hh[1], en)}` : '—'} dB (${dia(x.date, en)})`),
    },
  }
}

export function fichaMontanha(i: number, c: Ctx): Ficha | null {
  const f = c.montanha?.[i]; if (!f) return null
  const en = c.lang === 'en', gelo = f.tipo === 'gelo'
  const hh = f.hh_antes != null && f.hh_depois != null ? `HH: ${n1(f.hh_antes, en)} → ${n1(f.hh_depois, en)} dB` : null
  const hv = f.hv_antes != null && f.hv_depois != null ? `HV: ${n1(f.hv_antes, en)} → ${n1(f.hv_depois, en)} dB` : null
  return {
    cor: gelo ? '#0284C7' : '#9A5B13', tag: gelo ? (en ? 'Ice / snow' : 'Gelo / neve') : (en ? 'Slope' : 'Encosta'), estado: en ? 'Hypothesis' : 'Hipótese',
    titulo: f.local, sub: `NISAR GCOV · ${f.data ? dia(f.data, en) : ''}`,
    metrica: `${n2(f.area_km2, en)} km²`, delta: `${f.delta_db > 0 ? '+' : ''}${n1(f.delta_db, en)} dB`, grau: f.grau,
    causa: gelo ? (en ? 'Ice or snow got wet, melted or was torn away (avalanche, ice fall).' : 'Gelo ou neve ficou molhado, derreteu ou foi arrancado (avalanche, queda de gelo).')
                : (en ? 'Fresh debris on the slope: rocks, mud or ice from an avalanche or landslide.' : 'Material novo na encosta: pedras, lama ou gelo de uma avalanche ou deslizamento.'),
    resumo: gelo ? (en ? 'Both radar channels dropped together on a bright high-mountain surface.' : 'Os dois canais do radar caíram juntos numa superfície clara do alto da montanha.')
                 : (en ? 'The radar echo got much stronger: the ground became rougher.' : 'O eco do radar ficou bem mais forte: o chão ficou mais áspero.'),
    dados: [en ? `Area: ${n2(f.area_km2, en)} km²` : `Área: ${n2(f.area_km2, en)} km²`, ...(hh ? [hh] : []), ...(hv ? [hv] : [])],
    porque: [gelo ? (en ? 'Rule: HH and HV both fall 3 dB or more where the surface was bright (zone of glaciers)' : 'Regra: HH e HV caem 3 dB ou mais juntos onde a superfície era clara (zona de geleiras)')
                  : (en ? 'Rule: HH rises 4 dB and HV rises 2 dB on a mountain slope' : 'Regra: HH sobe 4 dB e HV sobe 2 dB em encosta de montanha')],
    outras: gelo ? (en ? ['Normal seasonal melt', 'Fresh wet snow'] : ['Degelo normal da estação', 'Neve nova molhada']) : (en ? ['Snow turning into ice', 'Radar geometry on very steep slopes'] : ['Neve virando gelo', 'Geometria do radar em encostas muito íngremes']),
    pol: {
      sigla: 'HH + HV', oque: gelo ? (en ? 'Wet ice absorbs the wave' : 'Gelo molhado absorve a onda') : (en ? 'Rough ground scatters more' : 'Chão áspero espalha mais'),
      texto: gelo ? (en ? 'Dry snow and ice let the L-band wave in and bounce it back. Liquid water absorbs it: when ice gets wet or melts, both HH and HV fall.' : 'Neve e gelo secos deixam a onda da banda L entrar e voltar. Água líquida absorve a onda: quando o gelo molha ou derrete, HH e HV caem juntos.')
                  : (en ? 'Rocks and blocks scatter the wave in all directions, so more of it comes back: HH and HV rise.' : 'Pedras e blocos espalham a onda em todas as direções e mais sinal volta: HH e HV sobem.'),
      valores: [hh, hv].filter(Boolean) as string[],
    },
  }
}

export function fichaPrevisao(a: Alert, en: boolean): Ficha {
  const cor = a.lvl === 'Alto' ? '#D92D20' : '#DC6803'
  return {
    cor, tag: en ? 'Forecast' : 'Previsão', estado: en ? 'Crossed data' : 'Dados cruzados',
    titulo: a.t, sub: a.l, metrica: a.badge ?? a.lvl, grau: a.p,
    causa: a.m, resumo: en ? 'A.R.K.O crossed several sources in the same area and over time.' : 'O A.R.K.O cruzou várias fontes na mesma área e ao longo do tempo.',
    dados: a.provas ?? [], porque: [], outras: en ? ['It is a rule-based hypothesis: confirm on the ground'] : ['É uma hipótese por regras: confirmar em campo'],
    pol: {
      sigla: a.ty === 'fogo' || a.ty === 'deslizamento' ? 'HV' : 'HH', oque: a.ty === 'fogo' || a.ty === 'deslizamento' ? (en ? 'Vegetation' : 'Vegetação') : (en ? 'Water and surface' : 'Água e superfície'),
      texto: a.ty === 'agua' ? (en ? 'Still water reflects the wave away like a mirror: HH drops where water appears. Two passes in a row with HH dropping at the same place show water staying or spreading.' : 'Água parada reflete a onda para longe, como espelho: o HH cai onde a água aparece. Duas passagens seguidas com HH caindo no mesmo lugar mostram água ficando ou se espalhando.')
        : a.ty === 'geleira' ? (en ? 'Wet ice lowers HH and HV; a lake next to it lowers HH strongly.' : 'Gelo molhado baixa HH e HV; um lago ao lado baixa muito o HH.')
        : (en ? 'Loss of leaves and branches lowers HV; rough, bare ground raises HH.' : 'Perda de folhas e galhos baixa o HV; chão áspero e exposto sobe o HH.'),
      valores: [],
    },
  }
}
