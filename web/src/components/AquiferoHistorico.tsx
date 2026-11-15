// v7.6 · Histórico do aquífero: o mesmo formato do Histórico do rio, para o monitoramento contínuo da água subterrânea.
// Três indicadores por ano (nível médio, seca do ano, recarga do ano), ponto de inflexão em cada um,
// a seca de cada ano comparada com a seca típica e o monitor dos últimos 24 meses contra o normal de cada mês.
import { useMemo } from 'react'
import { fmt } from '../lib/rios'
import { inflexao, type Inflexao } from '../lib/inflexao'
import { Ajuda } from './Ajuda'

type Ponto = { d: string; cm: number }
const MES = { pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }
const sg = (v: number, en: boolean, d = 1) => `${v > 0 ? '+' : ''}${fmt(v, en, d)}`

function serieAnual(serie: Ponto[]) {
  const por: Record<number, number[]> = {}
  serie.forEach(p => { (por[+p.d.slice(0, 4)] ??= []).push(p.cm) })
  const anos = Object.keys(por).map(Number).filter(y => por[y].length >= 10).sort((a, b) => a - b)
  return {
    anos,
    media: anos.map(y => por[y].reduce((t, v) => t + v, 0) / por[y].length),
    seca: anos.map(y => Math.min(...por[y])),
    recarga: anos.map(y => Math.max(...por[y]) - Math.min(...por[y])),
  }
}

function Spark({ x, y, inf, cor }: { x: number[]; y: number[]; inf: Inflexao | null; cor: string }) {
  const W = 220, H = 54, P = 4
  const lo = Math.min(...y), hi = Math.max(...y), X = (v: number) => P + ((v - x[0]) / (x[x.length - 1] - x[0] || 1)) * (W - 2 * P)
  const Y = (v: number) => P + (1 - (v - lo) / (hi - lo || 1)) * (H - 2 * P)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 54, display: 'block' }} aria-hidden="true">
      {inf?.sig && <><rect x={X(inf.ano)} y={0} width={W - X(inf.ano)} height={H} fill={inf.costura ? '#F2F4F7' : '#FEF3F2'} /><line x1={X(inf.ano)} x2={X(inf.ano)} y1={0} y2={H} stroke={inf.costura ? '#98A2B3' : '#D92D20'} strokeDasharray="3 3" /></>}
      <path d={y.map((v, i) => `${i ? 'L' : 'M'}${X(x[i]).toFixed(1)},${Y(v).toFixed(1)}`).join('')} fill="none" stroke={cor} strokeWidth={2} />
      {y.map((v, i) => <circle key={i} cx={X(x[i])} cy={Y(v)} r={1.8} fill={cor} />)}
    </svg>
  )
}

export function AquiferoHistorico({ serie, en }: { serie: Ponto[]; en: boolean }) {
  const A = useMemo(() => serieAnual(serie), [serie])
  const ind = useMemo(() => ([
    { k: 'media', nome: en ? 'Average level of the year' : 'Nível médio do ano', v: A.media, cor: '#0369A1',
      ajuda: en ? 'Mean of the 12 months of water stored (cm vs 2002–2020). The main indicator: is the reserve going down year after year?' : 'Média dos 12 meses da água guardada (cm vs 2002–2020). O indicador principal: a reserva está descendo ano após ano?' },
    { k: 'seca', nome: en ? 'Dry season of the year (lowest month)' : 'Seca do ano (mês mais baixo)', v: A.seca, cor: '#B54708',
      ajuda: en ? 'Lowest month of each year. If the dry season keeps getting lower than usual, springs and wells start failing first.' : 'O mês mais baixo de cada ano. Se a seca fica cada vez mais funda que o normal, nascentes e poços são os primeiros a falhar.' },
    { k: 'recarga', nome: en ? 'Recharge of the year (wet − dry)' : 'Recarga do ano (cheia − seca)', v: A.recarga, cor: '#067647',
      ajuda: en ? 'How much water came back in the rainy season (highest minus lowest month). A shrinking recharge means less rain is reaching the aquifer (deforestation, sealed soil, drought).' : 'Quanta água voltou na época de chuva (mês mais alto menos o mais baixo). Recarga encolhendo = menos chuva chegando ao aquífero (desmatamento, solo impermeabilizado, seca).' },
  ].map(m => {
    const base = m.v.filter((_, i) => A.anos[i] <= 2020), normal = base.reduce((t, v) => t + v, 0) / Math.max(1, base.length)
    return { ...m, normal, ult: m.v[m.v.length - 1], inf: inflexao(A.anos, m.v, 'alto') }
  })), [A, en])

  const principal = ind.find(m => m.inf?.sig && !m.inf.costura && m.inf.depois < m.inf.antes) ?? ind.find(m => m.inf?.sig) ?? null
  const fraseInf = (m: typeof ind[number]) => {
    const i = m.inf!; const pior = i.depois < i.antes
    const x = Math.abs(i.antes) > 0.05 ? Math.abs(i.depois / i.antes) : null
    return en
      ? `${m.nome}: in ${i.ano} the pattern changed — from ${sg(i.antes, en, 2)} to ${sg(i.depois, en, 2)} cm/year${x && pior && x >= 1.5 ? ` (${fmt(x, en, 1)}× faster)` : ''}.`
      : `${m.nome}: em ${i.ano} o padrão mudou — de ${sg(i.antes, en, 2)} para ${sg(i.depois, en, 2)} cm/ano${x && pior && x >= 1.5 ? ` (${fmt(x, en, 1)}× mais rápido)` : ''}.`
  }

  // monitor: últimos 24 meses contra a faixa normal do mesmo mês (p10–p90 dos anos anteriores)
  const mon = useMemo(() => serie.slice(-24).map(p => {
    const ant = serie.filter(q => q.d.slice(5, 7) === p.d.slice(5, 7) && q.d < p.d).map(q => q.cm).sort((a, b) => a - b)
    const q = (f: number) => ant[Math.min(ant.length - 1, Math.floor(ant.length * f))]
    return { ...p, p10: q(0.1), p50: q(0.5), p90: q(0.9), fora: ant.length >= 5 && p.cm < q(0.1) }
  }), [serie])
  const foraN = mon.filter(m => m.fora).length

  // seca de cada ano vs a seca típica (mediana dos mínimos)
  const secaTip = [...A.seca].sort((a, b) => a - b)[Math.floor(A.seca.length / 2)]
  const secaP10 = [...A.seca].sort((a, b) => a - b)[Math.floor(A.seca.length * 0.1)]

  const W = 760, H = 150, L = 34, R = 8, T = 10, Bm = 22
  const sx = (i: number, n: number) => L + (i + 0.5) * ((W - L - R) / n)
  const dif = A.seca.map(v => v - secaTip), dmx = Math.max(...dif.map(Math.abs), 1)
  const a0 = A.anos[0], a1 = A.anos[A.anos.length - 1], bw = (W - L - R) / (a1 - a0 + 1)
  const ax = (ano: number) => L + (ano - a0 + 0.5) * bw   // posição pelo ano real (buracos aparecem)
  const dy = (v: number) => T + ((dmx - v) / (2 * dmx)) * (H - T - Bm)
  const mlo = Math.min(...mon.flatMap(m => [m.cm, m.p10 ?? m.cm])) - 2, mhi = Math.max(...mon.flatMap(m => [m.cm, m.p90 ?? m.cm])) + 2
  const my = (v: number) => T + (1 - (v - mlo) / (mhi - mlo)) * (H - T - Bm)

  return (
    <>
      {/* leitura do histórico: o padrão, a inflexão e a consequência */}
      <div className="card" style={{ padding: 18 }}>
        <h3 className="m-0 flex items-center text-[15px]">{en ? 'History reading' : 'Leitura do histórico'}<Ajuda txt={en ? 'Slow processes (aquifer depletion, silting, loss of vegetation in recharge areas) do not trigger a one-day alert. The signal is a CHANGE OF PATTERN: the year from which the trend started to behave differently. We look for that year in each indicator and only accept it if the change is large and consistent.' : 'Processos lentos (esvaziamento do aquífero, assoreamento, perda de vegetação nas áreas de recarga) não disparam alerta num dia. O sinal é a MUDANÇA DE PADRÃO: o ano a partir do qual a tendência passou a se comportar diferente. Procuramos esse ano em cada indicador e só aceitamos se a mudança for grande e consistente.'} /></h3>
        <div className="mt-2 grid gap-2 text-[13.5px] leading-snug lg:grid-cols-3">
          <div className="rounded-lg p-3" style={{ background: '#F8FAFC', border: '1px solid #E4E7EC' }}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{en ? 'Inflection point' : 'Ponto de inflexão'}</div>
            {ind.some(m => m.inf?.sig)
              ? ind.filter(m => m.inf?.sig).map(m => <div key={m.k} className="mt-1">{fraseInf(m)}{m.inf!.costura && <span style={{ color: '#667085' }}> {en ? '(coincides with the GRACE → GRACE-FO switch: confirm)' : '(coincide com a troca de satélite GRACE → GRACE-FO: confirmar)'}</span>}</div>)
              : <div className="mt-1">{en ? 'No significant change of pattern since 2002: the pace is the same throughout the series.' : 'Nenhuma mudança de padrão significativa desde 2002: o ritmo é o mesmo em toda a série.'}</div>}
          </div>
          <div className="rounded-lg p-3" style={{ background: principal?.inf?.anosAtePior != null ? '#FEF3F2' : '#F8FAFC', border: `1px solid ${principal?.inf?.anosAtePior != null ? '#FECDCA' : '#E4E7EC'}` }}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{en ? 'If the new pace continues' : 'Se o novo ritmo continuar'}</div>
            <div className="mt-1">{principal?.inf?.anosAtePior != null
              ? (en ? <>In about <b>{fmt(principal.inf.anosAtePior, en, 1)} years</b>, "{principal.nome.toLowerCase()}" goes below the <b>worst value ever recorded</b> ({principal.inf.anoPior}: {fmt(principal.inf.pior, en, 1)} cm).</> : <>Em cerca de <b>{fmt(principal.inf.anosAtePior, en, 1)} anos</b>, o "{principal.nome.toLowerCase()}" passa do <b>pior valor já registrado</b> ({principal.inf.anoPior}: {fmt(principal.inf.pior, en, 1)} cm).</>)
              : principal?.inf?.sig && principal.inf.depois >= principal.inf.antes
                ? (en ? 'The change was for the better: keep monitoring to confirm it holds.' : 'A mudança foi para melhor: seguir monitorando para confirmar que se mantém.')
                : (en ? 'No accelerated worsening detected.' : 'Nenhuma piora acelerada detectada.')}</div>
            <div className="mt-1 text-[11.5px]" style={{ color: '#667085' }}>{en ? 'Projection, not forecast.' : 'Projeção, não previsão.'}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: foraN >= 3 ? '#FFFAEB' : '#F8FAFC', border: `1px solid ${foraN >= 3 ? '#FEDF89' : '#E4E7EC'}` }}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{en ? 'Last 24 months' : 'Últimos 24 meses'}</div>
            <div className="mt-1"><b>{foraN}</b> {en ? 'months below the normal range of their month (p10).' : 'meses abaixo da faixa normal do próprio mês (p10).'} {foraN >= 3 ? (en ? 'Recurrent: watch.' : 'Recorrente: atenção.') : (en ? 'Within the usual.' : 'Dentro do habitual.')}</div>
          </div>
        </div>
      </div>

      {/* painéis por indicador */}
      <div className="grid gap-3 md:grid-cols-3">
        {ind.map(m => (
          <div key={m.k} className="card" style={{ padding: 14 }}>
            <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{m.nome}<Ajuda txt={m.ajuda} /></div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tabular-nums" style={{ color: m.cor }}>{sg(m.ult, en)} cm</span>
              <span className="text-[12px]" style={{ color: '#667085' }}>{A.anos[A.anos.length - 1]} · {en ? 'normal' : 'normal'} {sg(m.normal, en)}</span>
            </div>
            <Spark x={A.anos} y={m.v} inf={m.inf} cor={m.cor} />
            <div className="mt-1 text-[12px]" style={{ color: m.inf?.sig && !m.inf.costura && m.inf.depois < m.inf.antes ? '#B42318' : '#475467' }}>
              {m.inf?.sig
                ? <>{en ? 'Inflection' : 'Inflexão'} {m.inf.ano}{m.inf.costura ? '*' : ''}: {sg(m.inf.antes, en, 2)} → <b>{sg(m.inf.depois, en, 2)}</b> cm/{en ? 'yr' : 'ano'}</>
                : <>{en ? 'Same pattern since' : 'Mesmo padrão desde'} {A.anos[0]}</>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* seca de cada ano vs seca típica (o exemplo das Cataratas do Iguaçu) */}
        <div className="card" style={{ padding: 16 }}>
          <h3 className="m-0 flex items-center text-[14.5px]">{en ? 'Each year’s dry season vs the typical one' : 'A seca de cada ano vs a seca típica'}<Ajuda txt={en ? 'Bar = lowest month of the year minus the typical lowest month (median of all years). Red = drier than 90% of the years. Several red bars in a row = the dry season is changing pattern.' : 'Barra = mês mais baixo do ano menos o mês mais baixo típico (mediana de todos os anos). Vermelho = mais seca que 90% dos anos. Várias barras vermelhas seguidas = a seca está mudando de padrão.'} /></h3>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 6 }} role="img" aria-label={en ? 'Dry season per year' : 'Seca por ano'}>
            <line x1={L} x2={W - R} y1={dy(0)} y2={dy(0)} stroke="#98A2B3" />
            {(() => {   // anos sem dado completo (troca de satélite, meses faltando): faixa cinza, para não parecer série contínua
              const out = []
              for (let i = 1; i < A.anos.length; i++) if (A.anos[i] - A.anos[i - 1] > 1) {
                const a = ax(A.anos[i - 1] + 1) - bw / 2, b = ax(A.anos[i] - 1) + bw / 2
                out.push(<g key={'gap' + i}><rect x={a} y={T} width={b - a} height={H - T - Bm} fill="#F2F4F7" /><text x={(a + b) / 2} y={T + 12} textAnchor="middle" fontSize={9.5} fill="#98A2B3">{en ? 'no complete data' : 'sem dado completo'}</text></g>)
              }
              return out
            })()}
            {dif.map((v, i) => {
              const w = bw * 0.75, x = ax(A.anos[i]) - w / 2
              const ruim = A.seca[i] <= secaP10
              return <g key={i}><rect x={x} y={Math.min(dy(0), dy(v))} width={w} height={Math.abs(dy(v) - dy(0))} fill={ruim ? '#D92D20' : v < 0 ? '#F79009' : '#7CD4FD'} rx={2}><title>{A.anos[i]}: {sg(v, en)} cm</title></rect>
                {(A.anos[i] % 3 === 0 || i === dif.length - 1) && <text x={ax(A.anos[i])} y={H - 6} textAnchor="middle" fontSize={10} fill="#667085">{A.anos[i]}</text>}</g>
            })}
            <text x={L - 4} y={dy(0) + 3} textAnchor="end" fontSize={10} fill="#667085">0</text>
          </svg>
          <p className="m-0 mt-1 text-[11.5px]" style={{ color: '#667085' }}>{en ? 'typical dry month' : 'mês seco típico'}: {sg(secaTip, en)} cm · <span style={{ color: '#D92D20' }}>■</span> {en ? 'drier than 90% of years' : 'mais seca que 90% dos anos'}</p>
        </div>

        {/* monitor contínuo */}
        <div className="card" style={{ padding: 16 }}>
          <h3 className="m-0 flex items-center text-[14.5px]">{en ? 'Continuous monitor · last 24 months' : 'Monitor contínuo · últimos 24 meses'}<Ajuda txt={en ? 'Dots = each month. Band = normal range of that same month in previous years (p10–p90). A dot below the band = that month was unusually low for the time of year.' : 'Pontos = cada mês. Faixa = o normal daquele mesmo mês nos anos anteriores (p10–p90). Ponto abaixo da faixa = aquele mês ficou baixo demais para a época do ano.'} /></h3>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 6 }} role="img" aria-label={en ? 'Last 24 months vs normal' : 'Últimos 24 meses vs normal'}>
            <path d={mon.map((m, i) => `${i ? 'L' : 'M'}${sx(i, mon.length).toFixed(1)},${my(m.p90 ?? m.cm).toFixed(1)}`).join('') + mon.slice().reverse().map((m, i) => `L${sx(mon.length - 1 - i, mon.length).toFixed(1)},${my(m.p10 ?? m.cm).toFixed(1)}`).join('') + 'Z'} fill="#E0F2FE" />
            <path d={mon.map((m, i) => `${i ? 'L' : 'M'}${sx(i, mon.length).toFixed(1)},${my(m.cm).toFixed(1)}`).join('')} fill="none" stroke="#0369A1" strokeWidth={1.5} />
            {mon.map((m, i) => <circle key={m.d} cx={sx(i, mon.length)} cy={my(m.cm)} r={3.2} fill={m.fora ? '#D92D20' : '#0369A1'}><title>{m.d}: {sg(m.cm, en)} cm</title></circle>)}
            {mon.map((m, i) => (i % 4 === 0 || i === mon.length - 1) && <text key={'t' + m.d} x={sx(i, mon.length)} y={H - 6} textAnchor="middle" fontSize={10} fill="#667085">{MES[en ? 'en' : 'pt'][+m.d.slice(5, 7) - 1]}/{m.d.slice(2, 4)}</text>)}
          </svg>
          <p className="m-0 mt-1 text-[11.5px]" style={{ color: '#667085' }}><span style={{ color: '#7DD3FC' }}>■</span> {en ? 'normal for the month (p10–p90)' : 'normal do mês (p10–p90)'} · <span style={{ color: '#D92D20' }}>●</span> {en ? 'below normal' : 'abaixo do normal'}</p>
        </div>
      </div>
    </>
  )
}
