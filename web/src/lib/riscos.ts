// v6 · riscos em tempo quase real: deslizamento (NASA LHASA) e queimadas (NASA FIRMS), gravados pelo robô em riscos.json
import type { Alert, FocoMontanha, RiscosJson } from './types'

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const dia = (iso: string, en: boolean) => {
  const d = new Date(iso.length <= 10 ? iso + 'T12:00Z' : iso)
  return en ? `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` : `${d.getUTCDate()} ${MES[d.getUTCMonth()]}`
}
const pct = (p: number, en: boolean) => (p * 100).toFixed(p < 0.1 ? 1 : 0).replace('.', en ? '.' : ',') + '%'
const lvlEn = { Alto: 'High', 'Médio': 'Medium', Baixo: 'Low' } as const

export function riskAlerts(r: RiscosJson | undefined, lang: string): Alert[] {
  if (!r) return []
  const en = lang === 'en', out: Alert[] = []
  const d = r.deslizamento
  d?.areas.forEach((a, i) => { if (a.nivel !== 'Baixo') out.push({
    id: `r-d-${i}`, lvl: a.nivel, p: Math.round(a.p * 100), ty: 'deslizamento', src: 'ext', lon: a.lon, lat: a.lat,
    t: en ? 'Landslide danger' : 'Perigo de deslizamento', l: a.lugar,
    m: en
      ? `${pct(a.p, en)} chance of a rain-triggered landslide (NASA LHASA model, satellite rain + soil + slope), over ~${a.km2} km².`
      : `Chance de ${pct(a.p, en)} de deslizamento por chuva (modelo LHASA da NASA: chuva por satélite, solo e relevo), em ~${a.km2.toLocaleString('pt-BR')} km².`,
    pz: `NASA LHASA · ${dia(d.data, en)}`,
    badge: `${en ? lvlEn[a.nivel] : a.nivel} · ${pct(a.p, en)}`,
  }) })
  const f = r.fogo
  f?.grupos.map((g, i) => ({ g, i })).filter(x => x.g.nivel !== 'Baixo').slice(0, 5).forEach(({ g, i }) => out.push({
    id: `r-f-${i}`, lvl: g.nivel, p: 0, ty: 'fogo', src: 'ext', lon: g.lon, lat: g.lat,
    t: en ? 'Active fire' : 'Queimada ativa', l: g.lugar,
    m: en
      ? `${g.n} heat spots seen by satellite in the last ${f.janela_h} h (latest ${dia(g.ultimo, en)}, ${g.ultimo.slice(11, 16)} UTC).`
      : `${g.n} ${g.n === 1 ? 'foco de calor visto' : 'focos de calor vistos'} por satélite nas últimas ${f.janela_h} h (último em ${dia(g.ultimo, en)}, ${g.ultimo.slice(11, 16)} UTC).`,
    pz: 'NASA FIRMS · VIIRS',
    badge: `${en ? lvlEn[g.nivel] : g.nivel} · ${g.n} ${en ? (g.n === 1 ? 'spot' : 'spots') : g.n === 1 ? 'foco' : 'focos'}`,
  }))
  return out
}

/** Frases curtas do que está sendo monitorado agora, mesmo quando não há alerta */
export function riskMonitor(r: RiscosJson | undefined, lang: string) {
  if (!r) return null
  const en = lang === 'en'
  const d = r.deslizamento, f = r.fogo
  const dm = d?.areas.filter(a => a.nivel !== 'Baixo') ?? []
  const des = d && (dm.length
    ? (en ? `${dm.length} area(s) in danger` : `${dm.length} ${dm.length === 1 ? 'área em perigo' : 'áreas em perigo'}`)
    : (en ? `low danger (max ${pct(d.max ?? 0, en)})` : `perigo baixo (máx. ${pct(d.max ?? 0, en)})`))
  const fog = f && (en ? `${f.focos} heat spot${f.focos === 1 ? '' : 's'} in ${f.janela_h} h` : `${f.focos} ${f.focos === 1 ? 'foco' : 'focos'} em ${f.janela_h} h`)
  return {
    des: d ? { txt: des!, src: `NASA LHASA · ${dia(d.data, en)}`, url: d.url, old: !!d.desatualizado } : null,
    fog: f ? { txt: fog!, src: 'NASA FIRMS', url: f.url, old: !!f.desatualizado } : null,
  }
}

/** v7 · montanha (NISAR): gelo/neve mudando e material novo na encosta. São hipóteses a confirmar. */
export function mountainAlerts(list: FocoMontanha[] | undefined, antes: string, depois: string, lang: string): Alert[] {
  if (!list?.length) return []
  const en = lang === 'en', a = dia(antes, en), b = dia(depois, en)
  return list.map((f, i) => {
    const gelo = f.tipo === 'gelo'
    const lvl = f.area_km2 >= (gelo ? 5 : 2) ? 'Alto' : 'Médio'
    const db = Math.abs(f.delta_db).toFixed(0)
    const km = en ? `${f.area_km2.toFixed(2)} km²` : `${f.area_km2.toFixed(2).replace('.', ',')} km²`
    return {
      id: `m-${i}`, lvl, p: f.grau, ty: gelo ? 'geleira' : 'deslizamento', src: 'NISAR', lon: f.lon, lat: f.lat, l: f.local,
      t: gelo ? (en ? 'Ice or snow changing' : 'Gelo ou neve mudando') : (en ? 'New material on the slope' : 'Material novo na encosta'),
      m: gelo
        ? (en ? `Radar signal fell ${db} dB over ${km} between ${a} and ${b}: wet, melting or removed ice/snow (hypothesis to confirm).`
              : `O sinal do radar caiu ${db} dB em ${km} entre ${a} e ${b}: gelo ou neve molhada, derretendo ou arrancada (hipótese a confirmar).`)
        : (en ? `Radar signal rose ${db} dB over ${km} between ${a} and ${b}: rougher ground, like avalanche or landslide debris (hypothesis to confirm).`
              : `O sinal do radar subiu ${db} dB em ${km} entre ${a} e ${b}: chão mais áspero, como restos de avalanche ou deslizamento (hipótese a confirmar).`),
      pz: `NASA-ISRO NISAR · ${b}`,
      badge: `${en ? lvlEn[lvl] : lvl} · NISAR`,
    }
  })
}
