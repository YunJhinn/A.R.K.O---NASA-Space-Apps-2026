// A.R.K.O Rios · Aquíferos: a água debaixo da terra, vista do espaço pelo GRACE e GRACE-FO (2002 → hoje).
// Regra mais rígida que a dos rios: perder água subterrânea é quase irreversível em escala humana.
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import { fmt, theilSen } from '../lib/rios'
import { Ajuda } from './Ajuda'
import { AquiferoMapa, type MapaGrace } from './AquiferoMapa'
import { AquiferoAfundamento } from './AquiferoAfundamento'

type Bi = [string, string]
interface Aq { id: string; nome: string; onde: string; bbox: number[]; sobre: string; area_km2: number; tend_cm_ano: number; tend_km3_ano: number; proj2030_cm: number; serie: { d: string; cm: number }[]; anual: { ano: number; cm: number; n: number }[]; fonte: string; gerado: string; mapa?: MapaGrace; contexto?: { t: string; url: string } }
const IDS = ['goias', 'urucuia', 'guarani', 'amazonia', 'bengala', 'india_nw', 'mexico', 'brandemburgo', 'ogallala']
const NOME_EN: Record<string, string> = { goias: 'Groundwater of Goiás', urucuia: 'Urucuia Aquifer', guarani: 'Guarani Aquifer', amazonia: 'Greater Amazon Aquifer System (Alter do Chão)', bengala: 'Bengal Basin aquifers', india_nw: 'Northwest India aquifers', mexico: 'Valley of Mexico aquifer', brandemburgo: 'Brandenburg and Berlin aquifers', ogallala: 'Ogallala Aquifer (High Plains)' }

const CURTO: Record<string, [string, string]> = {
  goias: ['Goiás e DF', 'Goiás & DF'], urucuia: ['Urucuia', 'Urucuia'], guarani: ['Guarani', 'Guarani'], amazonia: ['Grande Amazônia', 'Greater Amazon'],
  bengala: ['Bengala', 'Bengal'], india_nw: ['Noroeste da Índia', 'NW India'], mexico: ['Vale do México', 'Valley of Mexico'],
  brandemburgo: ['Brandemburgo (Alemanha)', 'Brandenburg (Germany)'], ogallala: ['Ogallala (EUA)', 'Ogallala (USA)'],
}

/** indicadores que o analista acompanha, calculados igual para todos os aquíferos */
function indicadores(a: Aq) {
  const abaixo = a.serie.slice(-6).filter(p => {
    const ant = a.serie.filter(q => q.d.slice(5, 7) === p.d.slice(5, 7) && q.d < p.d).map(q => q.cm).sort((x, y) => x - y)
    return ant.length >= 5 && p.cm < ant[Math.floor(ant.length * 0.1)]
  }).length
  const anos = +a.serie[a.serie.length - 1].d.slice(0, 4) - +a.serie[0].d.slice(0, 4)
  const u12 = a.serie.slice(-12), media12 = u12.reduce((t, p) => t + p.cm, 0) / u12.length
  return { abaixo, perdido: a.tend_km3_ano * anos, media12, ultimo: a.serie[a.serie.length - 1], E: estado(a, abaixo) }
}

// rigor: limites de tendência (cm de água por ano) bem menores que os dos rios
function estado(a: Aq, abaixo: number) {
  const t = a.tend_cm_ano
  if (t <= -0.8 || (t <= -0.3 && abaixo >= 4)) return { v: 'critico' as const, t: ['Em risco: perdendo água', 'At risk: losing water'] as Bi, c: '#B42318', bg: '#FEF3F2', ic: '!!' }
  if (t <= -0.15 || abaixo >= 3) return { v: 'atencao' as const, t: ['Atenção: perda lenta', 'Watch: slow loss'] as Bi, c: '#B54708', bg: '#FFFAEB', ic: '!' }
  return { v: 'bom' as const, t: ['Estável ou ganhando', 'Stable or gaining'] as Bi, c: '#067647', bg: '#ECFDF3', ic: '✓' }
}

function Grafico({ a, en }: { a: Aq; en: boolean }) {
  const s = a.serie, W = 760, H = 240, L = 44, R = 14, T = 14, B = 26
  const ano = (d: string) => +d.slice(0, 4) + (+d.slice(5, 7) - 0.5) / 12
  const xs = s.map(p => ano(p.d)), x0 = xs[0], x1 = 2030.5
  const v = s.map(p => p.cm), lo = Math.min(...v, a.proj2030_cm) - 3, hi = Math.max(...v, a.proj2030_cm) + 3
  const x = (t: number) => L + ((t - x0) / (x1 - x0)) * (W - L - R)
  const y = (c: number) => T + (1 - (c - lo) / (hi - lo)) * (H - T - B)
  const mm = s.map((_, i) => { const w = s.slice(Math.max(0, i - 5), i + 7).map(p => p.cm); return w.reduce((p, q) => p + q, 0) / w.length })
  const { m, b } = theilSen(xs.filter((_, i) => i % 2 === 0).map((t, i) => [t, v[i * 2]] as [number, number]))
  const ult = xs[xs.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={en ? 'Water storage chart' : 'Gráfico da água armazenada'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#98A2B3" strokeDasharray="2 4" />
      
      {[lo, (lo + hi) / 2, hi].map(c => <text key={c} x={L - 5} y={y(c) + 3} textAnchor="end" fontSize={10} fill="#667085">{fmt(c, en, 0)}</text>)}
      {[2005, 2010, 2015, 2020, 2025, 2030].map(t => <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontSize={10} fill="#667085">{t}</text>)}
      <rect x={x(ult)} y={T} width={x(x1) - x(ult)} height={H - T - B} fill="#F5F3FF" />
      <path d={s.map((p, i) => `${i && ano(p.d) - ano(s[i - 1].d) < 0.3 ? 'L' : 'M'}${x(xs[i]).toFixed(1)},${y(p.cm).toFixed(1)}`).join('')} fill="none" stroke="#7DD3FC" strokeWidth={1.2} />
      <path d={mm.map((c, i) => `${i && xs[i] - xs[i - 1] < 0.3 ? 'L' : 'M'}${x(xs[i]).toFixed(1)},${y(c).toFixed(1)}`).join('')} fill="none" stroke="#0369A1" strokeWidth={2.2} />
      <line x1={x(x0)} y1={y(m * x0 + b)} x2={x(ult)} y2={y(m * ult + b)} stroke="#6941C6" strokeWidth={1.8} opacity={0.8} />
      <line x1={x(ult)} y1={y(m * ult + b)} x2={x(x1)} y2={y(m * x1 + b)} stroke="#6941C6" strokeWidth={2} strokeDasharray="5 4" />
      <circle cx={x(x1)} cy={y(m * x1 + b)} r={4} fill="#6941C6" />
      <text x={x(x1) - 4} y={y(m * x1 + b) - 8} textAnchor="end" fontSize={10.5} fontWeight={700} fill="#6941C6">2030: {fmt(m * x1 + b, en, 0)} cm</text>
      <text x={x(2017.9)} y={T + 10} textAnchor="middle" fontSize={9.5} fill="#98A2B3">{en ? 'gap between missions' : 'intervalo entre missões'}</text>
    </svg>
  )
}

export function Aquiferos() {
  const { s } = useApp()
  const en = s.lang === 'en', B = (x: Bi) => x[en ? 1 : 0]
  const [dados, setDados] = useState<Record<string, Aq>>({})
  const [id, setId] = useState('goias')
  const [ord, setOrd] = useState<'tend' | 'km3' | 'perda' | 'abaixo' | 'p2030'>('tend')
  useEffect(() => {
    IDS.forEach(i => fetch(DATA_BASE + 'aquiferos/' + i + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => d && setDados(x => ({ ...x, [i]: d }))).catch(() => {}))
  }, [])
  const ind = useMemo(() => Object.fromEntries(Object.values(dados).map(a => [a.id, indicadores(a)])) as Record<string, ReturnType<typeof indicadores>>, [dados])
  const linhas = useMemo(() => IDS.filter(i => dados[i]).sort((p, q) => {
    const A = dados[p], Bq = dados[q], ip = ind[p], iq = ind[q]
    return ord === 'tend' ? A.tend_cm_ano - Bq.tend_cm_ano : ord === 'km3' ? A.tend_km3_ano - Bq.tend_km3_ano : ord === 'perda' ? ip.perdido - iq.perdido : ord === 'abaixo' ? iq.abaixo - ip.abaixo : A.proj2030_cm - Bq.proj2030_cm
  }), [dados, ind, ord])
  const a = dados[id], I = ind[id]
  const sinal = (v: number, d = 2) => `${v > 0 ? '+' : ''}${fmt(v, en, d)}`
  const corV = (v: number) => (v < 0 ? '#B42318' : '#067647')
  const th = (k: typeof ord | null, t: string, ajuda: string) => (
    <th className="whitespace-nowrap px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>
      <span className="inline-flex items-center justify-end">
        {k ? <button type="button" onClick={() => setOrd(k)} style={{ color: ord === k ? '#0369A1' : undefined, textDecoration: ord === k ? 'underline' : undefined }}>{t}{ord === k ? ' ▾' : ''}</button> : t}
        <Ajuda txt={ajuda} />
      </span>
    </th>
  )

  return (
    <section className="view on" id="v-aquiferos" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Aquifers' : 'Aquíferos'}</h1>
          <div className="text-[12.5px]" style={{ color: '#667085' }}>GRACE / GRACE-FO · NISAR (BETA) · {en ? 'values vs 2002–2020 mean' : 'valores vs média 2002–2020'}</div>
        </div>
      </div>

      {/* 1 · painel comparativo: tudo que o analista acompanha, numa tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3">
          <h3 className="m-0 text-[15px]">{en ? 'All aquifers at a glance' : 'Todos os aquíferos de uma vez'}</h3>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: 760 }}>
            <thead><tr style={{ background: '#F9FAFB', borderTop: '1px solid #EAECF0', borderBottom: '1px solid #EAECF0' }}>
              <th className="sticky left-0 z-[1] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: '#475467', background: '#F9FAFB' }}>{en ? 'Aquifer' : 'Aquífero'}</th>
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}><span className="inline-flex items-center">{en ? 'Status' : 'Estado'}<Ajuda txt={en ? 'At risk: trend ≤ −0.8 cm/yr, or ≤ −0.3 with 4+ of the last 6 months below p10. Watch: ≤ −0.15 cm/yr or 3+ months below p10. Stricter than rivers: aquifer losses take decades to recover.' : 'Em risco: tendência ≤ −0,8 cm/ano, ou ≤ −0,3 com 4+ dos últimos 6 meses abaixo do p10. Atenção: ≤ −0,15 cm/ano ou 3+ meses abaixo do p10. Mais rígido que nos rios: perda em aquífero leva décadas para voltar.'} /></span></th>
              {th('tend', en ? 'Trend cm/yr' : 'Tendência cm/ano', en ? 'Robust trend (Theil–Sen) of water stored, in cm of water spread over the area, per year. The main indicator.' : 'Tendência robusta (Theil–Sen) da água guardada, em cm de água espalhados sobre a área, por ano. O indicador principal.')}
              {th('km3', 'km³/' + (en ? 'yr' : 'ano'), en ? 'Trend × area: volume gained or lost per year. 1 km³ = 1 trillion litres.' : 'Tendência × área: volume ganho ou perdido por ano. 1 km³ = 1 trilhão de litros.')}
              {th('perda', en ? 'Since 2002 km³' : 'Desde 2002 km³', en ? 'Volume per year × years of data: water gained or lost since the start of GRACE.' : 'Volume por ano × anos de dado: água ganha ou perdida desde o começo do GRACE.')}
              {th(null, en ? 'Last 12 mo cm' : 'Últ. 12 meses cm', en ? 'Average of the last 12 months vs the 2002–2020 average. Shows where the level is now.' : 'Média dos últimos 12 meses vs a média de 2002–2020. Mostra onde o nível está agora.')}
              {th('abaixo', en ? 'Months < p10' : 'Meses < p10', en ? 'How many of the last 6 months were below the 10th percentile of the same month in previous years. 3 or more = warning.' : 'Quantos dos últimos 6 meses ficaram abaixo do percentil 10 do mesmo mês nos anos anteriores. 3 ou mais = alerta.')}
              {th('p2030', en ? '2030 cm' : '2030 cm', en ? 'Trend extended to 2030 if nothing changes. A warning, not a forecast.' : 'Tendência estendida até 2030 se nada mudar. Alerta, não previsão.')}
            </tr></thead>
            <tbody>
              {linhas.map(i => {
                const A = dados[i], X = ind[i], on = i === id
                return (
                  <tr key={i} onClick={() => setId(i)} className="cursor-pointer" aria-selected={on}
                    style={{ background: on ? '#EFF8FF' : undefined, borderBottom: '1px solid #F2F4F7', boxShadow: on ? 'inset 3px 0 0 #0369A1' : undefined }}>
                    <td className="sticky left-0 z-[1] px-3 py-2 font-semibold" style={{ color: '#101828', background: on ? '#EFF8FF' : '#fff', minWidth: 130 }}>{B(CURTO[i] ?? [A.nome, A.nome])}</td>
                    <td className="whitespace-nowrap px-2 py-2"><span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: X.E.c }}><i className="inline-block h-2 w-2 rounded-full" style={{ background: X.E.c }} />{X.E.v === 'critico' ? (en ? 'At risk' : 'Em risco') : X.E.v === 'atencao' ? (en ? 'Watch' : 'Atenção') : (en ? 'Stable' : 'Estável')}</span></td>
                    <td className="px-2 py-2 text-right font-bold tabular-nums" style={{ color: corV(A.tend_cm_ano) }}>{sinal(A.tend_cm_ano)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: '#344054' }}>{sinal(A.tend_km3_ano, 1)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: '#344054' }}>{sinal(X.perdido, 0)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: corV(X.media12) }}>{sinal(X.media12, 1)}</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: X.abaixo >= 3 ? '#B42318' : '#344054', fontWeight: X.abaixo >= 3 ? 700 : 400 }}>{X.abaixo}/6</td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ color: '#6941C6' }}>{sinal(A.proj2030_cm, 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!a || !I ? <div className="card" style={{ padding: 20 }}>{en ? 'Loading GRACE data…' : 'Carregando dados do GRACE…'}</div> : <>
        {/* 2 · aquífero escolhido: identidade + série (o dado principal) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: `2px solid ${I.E.c}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" style={{ background: I.E.bg }}>
            <div className="min-w-0">
              <div className="text-[19px] font-extrabold leading-tight">{en ? NOME_EN[id] : a.nome}</div>
              <div className="mt-0.5 text-[12.5px]" style={{ color: '#344054' }}>{a.onde} · {a.serie[0].d.slice(0, 4)}–{I.ultimo.d.slice(0, 4)} · {en ? 'latest month' : 'último mês'} {I.ultimo.d.split('-').reverse().join('/')} · ≈ {fmt(a.area_km2 / 1000, en, 0)} {en ? 'thousand' : 'mil'} km²</div>
            </div>
            <div className="rounded-lg px-3 py-1.5 text-[15px] font-extrabold" style={{ background: '#fff', border: `2px solid ${I.E.c}`, color: I.E.c }}>{I.E.ic} {B(I.E.t)}</div>
          </div>
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: '#EAECF0' }}>
            {([
              [en ? 'Trend' : 'Tendência', `${sinal(a.tend_cm_ano)}`, 'cm/' + (en ? 'yr' : 'ano'), corV(a.tend_cm_ano)],
              [en ? 'Since ' + a.serie[0].d.slice(0, 4) : 'Desde ' + a.serie[0].d.slice(0, 4), sinal(I.perdido, 0), en ? 'km³ (trillion L)' : 'km³ (trilhões de L)', corV(I.perdido)],
              [en ? 'Months < p10 (last 6)' : 'Meses < p10 (últ. 6)', `${I.abaixo}`, en ? 'of 6' : 'de 6', I.abaixo >= 3 ? '#B42318' : '#067647'],
              [en ? 'If nothing changes, 2030' : 'Se nada mudar, 2030', sinal(a.proj2030_cm, 0), 'cm', '#6941C6'],
            ] as const).map(([t, v, u, c]) => (
              <div key={t} className="bg-white px-4 py-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{t}</div>
                <div className="text-[22px] font-extrabold tabular-nums leading-tight" style={{ color: c }}>{v} <span className="text-[12px] font-semibold">{u}</span></div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 flex items-center text-[14.5px]">{en ? 'Water stored, month by month (cm vs 2002–2020 average)' : 'Água guardada, mês a mês (cm vs média de 2002–2020)'}<Ajuda txt={en ? 'GRACE measures gravity: a region that loses water gets slightly lighter. Total water (soil + surface + groundwater).' : 'O GRACE mede a gravidade: uma região que perde água fica um pouco mais leve. Água total (solo + superfície + subterrânea).'} /></h3>
              <div className="flex flex-wrap gap-3 text-[11.5px]" style={{ color: '#475467' }}>
                <span><i className="mr-1 inline-block h-0.5 w-4 align-middle" style={{ background: '#7DD3FC' }} />{en ? 'month' : 'mês'}</span>
                <span><i className="mr-1 inline-block h-[3px] w-4 align-middle" style={{ background: '#0369A1' }} />{en ? '12-month mean' : 'média 12 meses'}</span>
                <span><i className="mr-1 inline-block h-0.5 w-4 align-middle" style={{ background: '#6941C6' }} />{en ? 'trend → 2030' : 'tendência → 2030'}</span>
              </div>
            </div>
            <div className="mt-2 overflow-x-auto"><div style={{ minWidth: 560 }}><Grafico a={a} en={en} /></div></div>
            {a.contexto && <p className="m-0 mt-1 text-[12px]" style={{ color: '#667085' }}>{en ? 'Context: ' : 'Contexto: '}<a href={a.contexto.url} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{a.contexto.t}</a></p>}
          </div>
        </div>

        {/* 3 · onde (mapa GRACE) e o chão (NISAR) */}
        {a.mapa && <AquiferoMapa id={id} m={a.mapa} bbox={a.bbox} ultimoMes={I.ultimo.d} en={en} />}
        <AquiferoAfundamento aq={id} en={en} />

        {/* 4 · apoio: recolhido por padrão para não tirar o foco dos números */}
        <div className="card" style={{ padding: 0 }}>
          <details className="border-b px-4 py-3" style={{ borderColor: '#EAECF0' }}>
            <summary className="cursor-pointer text-[14px] font-bold">{en ? 'Validation and honest limits' : 'Validação e limites honestos'} <span className="font-normal" style={{ color: '#067647' }}>· ✓ {en ? `NW India ${fmt(dados.india_nw?.tend_cm_ano ?? NaN, en, 1)} cm/yr vs 4.0 ± 1.0 published (Rodell et al. 2009)` : `NO da Índia ${fmt(dados.india_nw?.tend_cm_ano ?? NaN, en, 1)} cm/ano vs 4,0 ± 1,0 publicado (Rodell et al. 2009)`}</span></summary>
            <ul className="mb-0 mt-2 list-disc pl-5 text-[12.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>
              <li>{en ? 'Validation: same satellites, NASA scientists published −4.0 ± 1.0 cm/yr for 2002–2008 in northwest India.' : 'Validação: com os mesmos satélites, cientistas da NASA publicaram −4,0 ± 1,0 cm/ano para 2002–2008 no noroeste da Índia.'} <a href="https://doi.org/10.1038/nature08238" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>Nature 460 (2009)</a></li>
              <li>{en ? 'GRACE sees regions of ~300 km or more; small aquifers (Urucuia, Valley of Mexico, Brandenburg) are near this limit.' : 'O GRACE enxerga regiões de ~300 km ou mais; aquíferos pequenos (Urucuia, Vale do México, Brandemburgo) ficam perto desse limite.'}</li>
              <li>{en ? 'Total water (soil + surface + groundwater); separating groundwater needs soil-moisture models (next step).' : 'Água total (solo + superfície + subterrânea); separar só a subterrânea exige modelos de umidade do solo (próximo passo).'}</li>
              <li>{en ? 'Areas are approximate boxes, not exact aquifer limits. Water quality is not visible from space.' : 'As áreas são caixas aproximadas, não o limite exato. A qualidade da água não aparece do espaço.'}</li>
            </ul>
          </details>
          <div className="px-4 py-2.5 text-[11.5px]" style={{ color: '#667085' }}>{en ? 'Source' : 'Fonte'}: {a.fonte} · {en ? 'updated' : 'atualizado'} {a.gerado} · <a href="https://www.unesco.org/reports/wwdr/2022/en" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>UN WWDR 2022</a></div>
        </div>
      </>}
    </section>
  )
}
