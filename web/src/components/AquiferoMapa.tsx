// v7.3 · "Retrato" do aquífero ano a ano, reconstruído a partir da gravidade (GRACE / GRACE-FO).
// Não é foto: cada quadrado tem ~110 km e mostra quanta água (cm) a região guardava naquele ano
// em relação à média de 2002–2020. Último quadro: projeção para 2030 se a tendência de cada quadrado continuar.
import { useEffect, useMemo, useState } from 'react'
import { fmt } from '../lib/rios'
import { Ajuda } from './Ajuda'

export interface MapaGrace { lons: number[]; lats: number[]; passo: number; anos: Record<string, (number | null)[][]>; meses?: Record<string, number | string> }

/** cidades de referência (lon, lat) para a pessoa se localizar no mapa */
const CIDADES: Record<string, [string, number, number][]> = {
  goias: [['Goiânia', -49.25, -16.68], ['Brasília', -47.88, -15.79], ['Rio Verde', -50.93, -17.79], ['Porangatu', -49.15, -13.44]],
  urucuia: [['Barreiras', -45.0, -12.15], ['L. E. Magalhães', -45.79, -12.09], ['Bom Jesus da Lapa', -43.42, -13.25]],
  guarani: [['Ribeirão Preto', -47.81, -21.18], ['Campo Grande', -54.62, -20.47], ['Assunção', -57.58, -25.26], ['Porto Alegre', -51.23, -30.03]],
  amazonia: [['Manaus', -60.02, -3.12], ['Santarém', -54.71, -2.44], ['Itaituba', -55.98, -4.28]],
  bengala: [['Daca', 90.41, 23.81], ['Calcutá', 88.36, 22.57], ['Rangpur', 89.25, 25.75]],
  india_nw: [['Nova Délhi', 77.21, 28.61], ['Lahore', 74.36, 31.52], ['Jaipur', 75.79, 26.91], ['Ludhiana', 75.86, 30.9]],
  mexico: [['Cid. do México', -99.13, 19.43], ['Toluca', -99.66, 19.29], ['Pachuca', -98.76, 20.1], ['Cuernavaca', -99.23, 18.92]],
  ogallala: [['Lubbock', -101.86, 33.58], ['Amarillo', -101.83, 35.22], ['Wichita', -97.34, 37.69], ['Denver', -104.99, 39.74]],
}

/** escala de cor por aquífero: satura no valor que cobre 95% dos quadrados (mínimo ±15 cm), arredondado de 10 em 10 */
function escala(m: MapaGrace) {
  const v: number[] = []
  Object.values(m.anos).forEach(g => g.forEach(r => r.forEach(x => { if (x != null) v.push(Math.abs(x)) })))
  v.sort((a, b) => a - b)
  return Math.max(15, Math.ceil((v[Math.floor(v.length * 0.95)] ?? 30) / 10) * 10)
}
function cor(v: number | null, LIM: number) {
  if (v == null) return '#E5E7EB'
  const x = Math.max(-1, Math.min(1, v / LIM))
  // vermelho (falta água) ↔ branco ↔ azul (sobra água)
  const a = Math.abs(x)
  const [r, g, b] = x < 0 ? [180, 35, 24] : [3, 105, 161]
  const mix = (c: number) => Math.round(255 + (c - 255) * a)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

function theil(x: number[], y: number[]) {
  const s: number[] = []
  for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) if (x[j] !== x[i]) s.push((y[j] - y[i]) / (x[j] - x[i]))
  s.sort((p, q) => p - q)
  const m = s.length ? s[Math.floor(s.length / 2)] : 0
  const r = y.map((v, i) => v - m * x[i]).sort((p, q) => p - q)
  return { m, b: r[Math.floor(r.length / 2)] }
}

export function AquiferoMapa({ id, m, bbox, ultimoMes, en }: { id: string; m: MapaGrace; bbox: number[]; ultimoMes: string; en: boolean }) {
  const anos = Object.keys(m.anos).sort()
  const LIM = useMemo(() => escala(m), [id])   // eslint-disable-line
  const ny = m.lats.length, nx = m.lons.length
  // projeção 2030: tendência robusta de cada quadrado nos últimos 15 anos completos
  const proj = useMemo(() => {
    const comp = anos.filter(y => !(typeof m.meses?.[y] === 'number' && (m.meses[y] as number) < 12)).slice(-15)   // só anos completos (ou últimos 12 meses)
    return m.lats.map((_, j) => m.lons.map((_, i) => {
      const xs: number[] = [], ys: number[] = []
      comp.forEach(y => { const v = m.anos[y][j][i]; if (v != null) { xs.push(+y); ys.push(v) } })
      if (xs.length < 8) return null
      const t = theil(xs, ys); return Math.round((t.m * 2030 + t.b) * 10) / 10
    }))
  }, [id])   // eslint-disable-line
  const quadros = [...anos, '2030']
  const [k, setK] = useState(quadros.length - 2)
  const [play, setPlay] = useState(false)
  useEffect(() => { setK(quadros.length - 2); setPlay(false) }, [id])   // eslint-disable-line
  useEffect(() => {
    if (!play) return
    const h = setInterval(() => setK(x => { if (x >= quadros.length - 1) { setPlay(false); return x } return x + 1 }), 700)
    return () => clearInterval(h)
  }, [play, quadros.length])
  const q = quadros[Math.min(k, quadros.length - 1)]
  const ehProj = q === '2030'
  const g = ehProj ? proj : m.anos[q]

  // geometria: quadrados de 1°, corrigidos pela latitude para não esticar o mapa
  const latM = (m.lats[0] + m.lats[ny - 1]) / 2
  const cw = 46, ch = cw / Math.cos((latM * Math.PI) / 180)
  const W = nx * cw, H = ny * ch
  const lon0 = m.lons[0] - m.passo / 2, lat0 = m.lats[0] + m.passo / 2
  const X = (lon: number) => ((lon - lon0) / m.passo) * cw
  const Y = (lat: number) => ((lat0 - lat) / m.passo) * ch

  // números do quadro: média dentro da caixa do aquífero, quadrados críticos, mudança vs 5 anos antes
  const dentro = (i: number, j: number) => m.lons[i] >= bbox[0] && m.lons[i] <= bbox[2] && m.lats[j] >= bbox[1] && m.lats[j] <= bbox[3]
  const media = (gg: (number | null)[][]) => {
    let s = 0, n = 0
    gg.forEach((row, j) => row.forEach((v, i) => { if (v != null && dentro(i, j)) { s += v * Math.cos((m.lats[j] * Math.PI) / 180); n += Math.cos((m.lats[j] * Math.PI) / 180) } }))
    return n ? s / n : null
  }
  let tot = 0, crit = 0
  g.forEach((row, j) => row.forEach((v, i) => { if (v != null && dentro(i, j)) { tot++; if (v <= -10) crit++ } }))
  const med = media(g)
  const antesK = ehProj ? anos.length - 1 : anos.indexOf(q) - 5
  const antesY = antesK >= 0 ? anos[antesK] : null
  const medAntes = antesY ? media(m.anos[antesY]) : null
  const dif = med != null && medAntes != null ? med - medAntes : null
  const u12 = !ehProj && q === anos[anos.length - 1] && typeof m.meses?.ultimo12 === 'string' ? (m.meses.ultimo12 as string) : null
  const nMes = !ehProj && typeof m.meses?.[q] === 'number' ? (m.meses[q] as number) : 12
  const parcial = !u12 && nMes < 12

  const consequencia = dif == null ? null : dif <= -3
    ? (en ? 'Less water underground means deeper wells and higher pumping costs, springs and streams drying out earlier in the dry season, and, where clay layers compact, ground that sinks for good (this is what the NISAR radar can measure).'
      : 'Menos água no subsolo significa poços cada vez mais fundos e bombeamento mais caro, nascentes e córregos secando mais cedo na estiagem e, onde há camadas de argila, chão que afunda para sempre (é isso que o radar NISAR consegue medir).')
    : dif >= 3 && med != null && med <= -10
      ? (en ? `It recovered a little since ${antesY}, but it is still ${fmt(Math.abs(med), en, 0)} cm below normal. Wetter years help, but they have not refilled what was lost.`
        : `Recuperou um pouco desde ${antesY}, mas segue ${fmt(Math.abs(med), en, 0)} cm abaixo do normal. Anos mais chuvosos ajudam, mas ainda não repuseram o que foi perdido.`)
    : dif >= 3
      ? (en ? 'The region gained water: wetter years recharged soil and aquifers. Recharge is slow and uneven: keep protecting recharge areas so the gain is not lost.'
        : 'A região ganhou água: anos mais chuvosos recarregaram solo e aquíferos. A recarga é lenta e desigual: proteger as áreas de recarga evita perder esse ganho.')
      : med != null && med <= -10
        ? (en ? `It stopped getting worse in these 5 years, but it is still ${fmt(Math.abs(med), en, 0)} cm below normal: the water lost was not recovered. Stable at a low level is not recovery.`
          : `Parou de piorar nestes 5 anos, mas segue ${fmt(Math.abs(med), en, 0)} cm abaixo do normal: a água perdida não voltou. Estável num nível baixo não é recuperação.`)
        : (en ? 'Small change: within what rain variability explains.' : 'Mudança pequena: dentro do que a variação das chuvas explica.')

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#0369A1' }}>{en ? 'Aquifer portrait, year by year' : 'Retrato do aquífero, ano a ano'}</div>
          <h3 className="m-0 mt-1 flex items-center text-[16px]">
            {en ? 'Where the water is missing, rebuilt from gravity' : 'Onde falta água, reconstruído a partir da gravidade'}
            <Ajuda txt={en ? 'No camera sees groundwater. This map is not a photo: it is rebuilt from the GRACE / GRACE-FO gravity data. Each square is about 110 km wide and shows how many cm of water the region held that year compared with the 2002–2020 average. Red = less water than normal, blue = more. The dashed box is the aquifer area used in the numbers. GRACE blurs the signal over ~300 km, so read regions, not individual wells.' : 'Nenhuma câmera enxerga a água subterrânea. Este mapa não é foto: é reconstruído com os dados de gravidade do GRACE / GRACE-FO. Cada quadrado tem ~110 km e mostra quantos cm de água a região guardava naquele ano em relação à média de 2002–2020. Vermelho = menos água que o normal, azul = mais. A caixa tracejada é a área do aquífero usada nos números. O GRACE "borra" o sinal em ~300 km: leia regiões, não poços.'} />
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" style={{ fontSize: 13 }} aria-label={play ? (en ? 'Pause' : 'Pausar') : 'Play'}
            onClick={() => { if (!play && k >= quadros.length - 1) setK(0); setPlay(!play) }}>{play ? '❚❚' : '▶'} {play ? (en ? 'Pause' : 'Pausar') : (en ? 'Play years' : 'Passar os anos')}</button>
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="overflow-x-auto">
            <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }} role="img"
              aria-label={en ? `Map of water stored in ${q}` : `Mapa da água guardada em ${q}`}>
              {g.map((row, j) => row.map((v, i) => (
                <rect key={`${i}-${j}`} x={i * cw} y={j * ch} width={cw - 1} height={ch - 1} rx={3} fill={cor(v, LIM)}>
                  <title>{v == null ? (en ? 'sea / no data' : 'mar / sem dado') : `${v > 0 ? '+' : ''}${fmt(v, en, 1)} cm`}</title>
                </rect>
              )))}
              <rect x={X(bbox[0])} y={Y(bbox[3])} width={X(bbox[2]) - X(bbox[0])} height={Y(bbox[1]) - Y(bbox[3])} fill="none" stroke="#101828" strokeWidth={2} strokeDasharray="6 4" rx={4} />
              {(CIDADES[id] ?? []).map(([n, lo, la]) => (
                <g key={n} transform={`translate(${X(lo)},${Y(la)})`}>
                  <circle r={4} fill="#101828" stroke="#fff" strokeWidth={1.5} />
                  <text x={6} y={4} fontSize={12} fontWeight={700} fill="#101828" stroke="#fff" strokeWidth={3} paintOrder="stroke">{n}</text>
                </g>
              ))}
              {ehProj && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={30} fontWeight={800} fill="#6941C6" opacity={0.18}>{en ? 'PROJECTION' : 'PROJEÇÃO'}</text>}
            </svg>
          </div>
          {/* escala de cor */}
          <div className="mx-auto mt-2 flex max-w-[560px] items-center gap-2 text-[11.5px]" style={{ color: '#475467' }}>
            <span>−{LIM} cm</span>
            <div className="h-2.5 flex-1 rounded" style={{ background: `linear-gradient(90deg, ${cor(-LIM, LIM)}, ${cor(0, LIM)}, ${cor(LIM, LIM)})` }} />
            <span>+{LIM} cm</span>
            <span className="ml-2 inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: cor(null, LIM) }} />{en ? 'sea' : 'mar'}</span>
          </div>
          {/* linha do tempo */}
          <div className="mx-auto mt-3 max-w-[560px]">
            <input type="range" min={0} max={quadros.length - 1} value={k} onChange={e => { setPlay(false); setK(+e.target.value) }} className="w-full" aria-label={en ? 'Year' : 'Ano'} />
            <div className="flex justify-between text-[11.5px]" style={{ color: '#667085' }}><span>{anos[0]}</span><span style={{ color: '#6941C6', fontWeight: 700 }}>2030 ({en ? 'projection' : 'projeção'})</span></div>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: ehProj ? '#F5F3FF' : '#F7FAFC', border: `1px solid ${ehProj ? '#DDD6FE' : '#E3E8EF'}` }}>
          <div className="text-[28px] font-extrabold leading-none" style={{ color: ehProj ? '#6941C6' : '#101828' }}>{q}</div>
          <div className="mt-1 text-[12px]" style={{ color: '#475467' }}>
            {ehProj ? (en ? 'projection if each square keeps its trend (last 15 years)' : 'projeção se cada quadrado mantiver a tendência (últimos 15 anos)')
              : u12 ? (en ? `last 12 months (${u12.replace('..', ' to ')})` : `últimos 12 meses (${u12.replace('..', ' a ')})`)
              : parcial ? (en ? `partial year: ${nMes} months with data` : `ano parcial: ${nMes} meses com dado`) : (en ? 'yearly average' : 'média do ano')}
          </div>
          <div className="mt-3 text-[13px] leading-relaxed" style={{ color: '#1E2A3A' }}>
            <div>{en ? 'Inside the aquifer area: ' : 'Dentro da área do aquífero: '}<b style={{ color: med != null && med < 0 ? '#B42318' : '#0369A1' }}>{med == null ? '—' : `${med > 0 ? '+' : ''}${fmt(med, en, 1)} cm`}</b></div>
            <div>{en ? 'Squares at −10 cm or worse: ' : 'Quadrados em −10 cm ou pior: '}<b>{crit} {en ? 'of' : 'de'} {tot}</b></div>
            {dif != null && antesY && (
              <div className="mt-2">{en ? `Change vs ${antesY}: ` : `Mudança desde ${antesY}: `}<b style={{ color: dif < 0 ? '#B42318' : '#067647' }}>{dif > 0 ? '+' : ''}{fmt(dif, en, 1)} cm</b>
                {' '}<span style={{ color: '#475467' }}>(≈ {fmt(Math.abs(dif) * 10, en, 0)} {en ? 'litres per m²' : 'litros por m²'})</span></div>
            )}
          </div>
          {consequencia && <p className="m-0 mt-3 text-[12.5px] leading-relaxed" style={{ color: '#3C4B5E' }}><b>{en ? 'What it means: ' : 'O que isso significa: '}</b>{consequencia}</p>}
          {ehProj && <p className="m-0 mt-2 text-[12px]" style={{ color: '#6941C6' }}>{en ? 'A warning, not a forecast: rain, pumping rules and recharge projects can change it.' : 'É um alerta, não uma previsão: chuva, regras de bombeamento e projetos de recarga podem mudar isso.'}</p>}
        </div>
      </div>
    </div>
  )
}
