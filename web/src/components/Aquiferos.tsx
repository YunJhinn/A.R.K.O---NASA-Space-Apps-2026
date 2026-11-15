// A.R.K.O Rios · Aquíferos: a água debaixo da terra, vista do espaço pelo GRACE e GRACE-FO (2002 → hoje).
// Regra mais rígida que a dos rios: perder água subterrânea é quase irreversível em escala humana.
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import { fmt, theilSen } from '../lib/rios'
import { Ajuda } from './Ajuda'

type Bi = [string, string]
interface Aq { id: string; nome: string; onde: string; bbox: number[]; sobre: string; area_km2: number; tend_cm_ano: number; tend_km3_ano: number; proj2030_cm: number; serie: { d: string; cm: number }[]; anual: { ano: number; cm: number; n: number }[]; fonte: string; gerado: string }
const IDS = ['goias', 'urucuia', 'guarani', 'amazonia', 'bengala', 'india_nw', 'ogallala']
const NOME_EN: Record<string, string> = { goias: 'Groundwater of Goiás', urucuia: 'Urucuia Aquifer', guarani: 'Guarani Aquifer', amazonia: 'Greater Amazon Aquifer System (Alter do Chão)', bengala: 'Bengal Basin aquifers', india_nw: 'Northwest India aquifers', ogallala: 'Ogallala Aquifer (High Plains)' }

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
      <text x={L + 4} y={H - B - 6} fontSize={10} fill="#475467">{en ? 'dotted line = 2002–2020 average (zero)' : 'linha pontilhada = média de 2002–2020 (zero)'}</text>
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
  useEffect(() => {
    IDS.forEach(i => fetch(DATA_BASE + 'aquiferos/' + i + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => d && setDados(x => ({ ...x, [i]: d }))).catch(() => {}))
  }, [])
  const a = dados[id]
  // meses recentes abaixo do normal (p10 do mesmo mês nos anos anteriores): sinal de alerta rápido
  const abaixo = useMemo(() => {
    if (!a) return 0
    return a.serie.slice(-6).filter(p => {
      const ant = a.serie.filter(q => q.d.slice(5, 7) === p.d.slice(5, 7) && q.d < p.d).map(q => q.cm).sort((x, y) => x - y)
      return ant.length >= 5 && p.cm < ant[Math.floor(ant.length * 0.1)]
    }).length
  }, [a])
  const E = a ? estado(a, abaixo) : null
  const anosS = a ? (+a.serie[a.serie.length - 1].d.slice(0, 4) - +a.serie[0].d.slice(0, 4)) : 0
  const perdido = a ? a.tend_km3_ano * anosS : 0
  const ultimo = a?.serie[a.serie.length - 1]

  return (
    <section className="view on" id="v-aquiferos" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Aquifers · the water under our feet' : 'Aquíferos · a água debaixo dos nossos pés'}</h1>
          <div className="answer"><span className="dot" style={{ background: '#0369A1' }} />
            <span>{en ? 'Groundwater holds about 99% of the liquid fresh water on Earth. Once an aquifer is emptied or polluted, recovery takes decades to centuries, so the alert here is stricter than for rivers.' : 'A água subterrânea guarda cerca de 99% da água doce líquida da Terra. Quando um aquífero é esvaziado ou contaminado, a recuperação leva décadas ou séculos; por isso o alerta aqui é mais rígido que o dos rios.'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {IDS.map(i => (
          <button key={i} type="button" onClick={() => setId(i)} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
            style={{ background: i === id ? '#0369A1' : '#fff', color: i === id ? '#fff' : '#1E2A3A', border: '1px solid ' + (i === id ? '#0369A1' : '#D0D5DD') }}>
            ⛲ {en ? NOME_EN[i] : dados[i]?.nome ?? i}
          </button>
        ))}
      </div>

      {!a || !E ? <div className="card" style={{ padding: 20 }}>{en ? 'Loading GRACE data…' : 'Carregando dados do GRACE…'}</div> : <>
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: `2px solid ${E.c}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ background: E.bg }}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#475467' }}>{en ? 'You are looking at' : 'Você está vendo'}</div>
              <div className="text-[20px] font-extrabold leading-tight">{en ? NOME_EN[id] : a.nome}</div>
              <div className="mt-0.5 text-[13px]" style={{ color: '#344054' }}>{a.onde} · {en ? 'period' : 'período'}: <b>{a.serie[0].d.slice(0, 4)}–{ultimo!.d.slice(0, 4)}</b> · {en ? 'latest month' : 'último mês'}: <b>{ultimo!.d.split('-').reverse().join('/')}</b> · {en ? 'area' : 'área'} ≈ {fmt(a.area_km2 / 1000, en, 0)} {en ? 'thousand' : 'mil'} km²</div>
            </div>
            <div className="rounded-xl px-4 py-2 text-center" style={{ background: '#fff', border: `2px solid ${E.c}` }}>
              <div className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: '#475467' }}>{en ? 'Conservation status' : 'Estado de conservação'}</div>
              <div className="text-[17px] font-extrabold" style={{ color: E.c }}>{E.ic} {B(E.t)}</div>
            </div>
          </div>
          <div className="grid gap-3 px-5 py-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="rounded-lg p-3" style={{ background: '#F7FAFC', border: '1px solid #E3E8EF' }}>
              <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{en ? 'Trend' : 'Tendência'}<Ajuda txt={en ? 'How many centimetres of water (spread over the whole area) the region gains or loses per year, measured by gravity. Negative = the ground is holding less water every year.' : 'Quantos centímetros de água (espalhados sobre toda a área) a região ganha ou perde por ano, medidos pela gravidade. Negativo = o chão guarda menos água a cada ano.'} /></div>
              <div className="text-[22px] font-extrabold" style={{ color: a.tend_cm_ano < 0 ? '#B42318' : '#067647' }}>{a.tend_cm_ano > 0 ? '+' : ''}{fmt(a.tend_cm_ano, en, 2)} <span className="text-[13px]">cm/{en ? 'yr' : 'ano'}</span></div>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#F7FAFC', border: '1px solid #E3E8EF' }}>
              <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{en ? `Water ${perdido < 0 ? 'lost' : 'gained'} since ${a.serie[0].d.slice(0, 4)}` : `Água ${perdido < 0 ? 'perdida' : 'ganha'} desde ${a.serie[0].d.slice(0, 4)}`}<Ajuda txt={en ? 'Trend × years × area. 1 km³ = 1 trillion litres, enough for about 25 million people for a year at 110 litres per person per day.' : 'Tendência × anos × área. 1 km³ = 1 trilhão de litros, o suficiente para cerca de 25 milhões de pessoas por um ano, a 110 litros por pessoa por dia.'} /></div>
              <div className="text-[22px] font-extrabold" style={{ color: perdido < 0 ? '#B42318' : '#067647' }}>{fmt(Math.abs(perdido), en, 0)} <span className="text-[13px]">km³</span></div>
              <div className="text-[12px]" style={{ color: '#475467' }}>≈ {fmt(Math.abs(perdido), en, 0)} {en ? 'trillion litres' : 'trilhões de litros'}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#F7FAFC', border: '1px solid #E3E8EF' }}>
              <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{en ? 'Last 6 months below normal' : 'Últimos 6 meses abaixo do normal'}<Ajuda txt={en ? 'How many of the last 6 months were below the 10th percentile of the same month in previous years. 3 or more is already a warning: aquifers do not recover fast.' : 'Quantos dos últimos 6 meses ficaram abaixo do percentil 10 do mesmo mês nos anos anteriores. 3 ou mais já é alerta: aquífero não se recupera rápido.'} /></div>
              <div className="text-[22px] font-extrabold" style={{ color: abaixo >= 3 ? '#B42318' : '#067647' }}>{abaixo} <span className="text-[13px]">{en ? 'of 6' : 'de 6'}</span></div>
            </div>
            <div className="rounded-lg p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
              <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{en ? 'If nothing changes, 2030' : 'Se nada mudar, 2030'}<Ajuda txt={en ? 'Robust trend (Theil–Sen) over all months, extended to 2030. A warning, not a forecast.' : 'Tendência robusta (Theil–Sen) de todos os meses, estendida até 2030. É um alerta, não uma previsão.'} /></div>
              <div className="text-[22px] font-extrabold" style={{ color: '#6941C6' }}>{fmt(a.proj2030_cm, en, 0)} <span className="text-[13px]">cm</span></div>
              <div className="text-[12px]" style={{ color: '#475467' }}>{en ? 'vs 2002–2020 average' : 'vs média de 2002–2020'}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 className="m-0 flex items-center text-[15px]">{en ? 'Water stored under and on the ground, month by month (GRACE / GRACE-FO)' : 'Água guardada no chão e debaixo dele, mês a mês (GRACE / GRACE-FO)'}<Ajuda txt={en ? 'GRACE satellites measure Earth’s gravity: when a region loses water it becomes slightly lighter. The value is the total water (soil + surface + groundwater) in cm, compared with the 2002–2020 average. Light line: each month; dark line: 12-month average (takes out the rainy/dry season).' : 'Os satélites GRACE medem a gravidade da Terra: quando uma região perde água, fica um pouco mais leve. O valor é a água total (solo + superfície + subterrânea) em cm, comparada com a média de 2002–2020. Linha clara: cada mês; linha escura: média de 12 meses (tira o efeito da estação de chuva e seca).'} /></h3>
          <p className="m-0 mb-2 mt-1 text-[13px]" style={{ color: '#3C4B5E' }}>{a.sobre}</p>
          <div className="overflow-x-auto"><div style={{ minWidth: 560 }}><Grafico a={a} en={en} /></div></div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="card" style={{ padding: 18 }}>
            <h3 className="m-0 text-[15px]">{en ? 'How to protect this aquifer' : 'Como proteger este aquífero'}</h3>
            <ul className="m-0 mt-2 list-none space-y-2 p-0 text-[13px] leading-snug">
              {([
                [en ? 'Water agencies' : 'Órgãos de água', en ? 'Register and limit wells (permits), measure what is pumped and stop new wells where the trend is negative.' : 'Cadastrar e limitar poços (outorga), medir o que é bombeado e não liberar poços novos onde a tendência é negativa.'],
                [en ? 'States and cities' : 'Estados e prefeituras', en ? 'Protect recharge areas (native vegetation on plateaus and around springs) and forbid polluting activities on top of them.' : 'Proteger as áreas de recarga (vegetação nativa nas chapadas e em volta das nascentes) e proibir atividades poluidoras em cima delas.'],
                [en ? 'Farming' : 'Agricultura', en ? 'Efficient irrigation (drip, scheduling by soil moisture) and fewer pivots where the aquifer is falling.' : 'Irrigação eficiente (gotejamento, irrigar pela umidade do solo) e menos pivôs onde o aquífero está caindo.'],
                [en ? 'Everyone' : 'Todos', en ? 'Reuse water, capture rain and recharge the ground: infiltration ditches, permeable pavements, parks.' : 'Reusar água, captar chuva e devolver ao solo: valas de infiltração, calçadas permeáveis, parques.'],
              ] as const).map(([q, o]) => <li key={q} className="rounded-lg p-2.5" style={{ background: '#F0F9FF', border: '1px solid #B9E6FE' }}><b style={{ color: '#026AA2' }}>{q}:</b> {o}</li>)}
            </ul>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 className="m-0 text-[15px]">{en ? 'Does it match reality? (validation)' : 'Bate com a realidade? (validação)'}</h3>
            <p className="m-0 mt-2 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>{en ? `For northwest India, A.R.K.O measures ${fmt(dados.india_nw?.tend_cm_ano ?? NaN, en, 1)} cm of water per year (2002–today). NASA scientists published 4.0 ± 1.0 cm per year for 2002–2008 with the same satellites (Rodell et al., Nature, 2009).` : `No noroeste da Índia, o A.R.K.O mede ${fmt(dados.india_nw?.tend_cm_ano ?? NaN, en, 1)} cm de água por ano (2002–hoje). Cientistas da NASA publicaram 4,0 ± 1,0 cm por ano para 2002–2008 com os mesmos satélites (Rodell et al., Nature, 2009).`}</p>
            <a href="https://doi.org/10.1038/nature08238" target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12.5px]" style={{ color: '#2563EB' }}>Rodell, Velicogna & Famiglietti · Nature 460 (2009)</a>
            <h4 className="mb-1 mt-3 text-[13.5px]">{en ? 'Honest limits' : 'Limites honestos'}</h4>
            <ul className="m-0 list-disc pl-5 text-[12.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>
              <li>{en ? 'GRACE sees regions of ~300 km or more; small aquifers (like Urucuia) are near this limit.' : 'O GRACE enxerga regiões de ~300 km ou mais; aquíferos pequenos (como o Urucuia) ficam perto desse limite.'}</li>
              <li>{en ? 'It measures total water (soil + surface + groundwater). Separating only the groundwater needs soil-moisture models; next step.' : 'Ele mede a água total (solo + superfície + subterrânea). Separar só a subterrânea exige modelos de umidade do solo; é o próximo passo.'}</li>
              <li>{en ? 'Areas are approximate boxes over each aquifer, not its exact boundary. Quality (contamination) is not visible from space.' : 'As áreas são caixas aproximadas sobre cada aquífero, não o limite exato. A qualidade (contaminação) não aparece do espaço.'}</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <p className="m-0 text-[12px]" style={{ color: '#5B6B7F' }}>{en ? 'Source' : 'Fonte'}: {a.fonte}. {en ? 'Updated' : 'Atualizado'}: {a.gerado}. {en ? 'The daily robot downloads the new month when GFZ publishes it.' : 'O robô diário baixa o mês novo quando o GFZ publica.'} · <a href="https://www.unesco.org/reports/wwdr/2022/en" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>UN World Water Development Report 2022 (groundwater)</a></p>
        </div>
      </>}
    </section>
  )
}
