// v7.10 · Cenários futuros: todos os rios e aquíferos numa lista, ordenados por quanto falta para cada um chegar
// ao seu ponto crítico se nada mudar. O alerta dispara quando a chegada prevista fica a 10 anos ou menos:
// é o aviso com ANOS de antecedência que permite agir antes (proteger nascentes, limitar poços, replantar margens).
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import { analisar, carregarRio, fmt, METRICAS, RIOS, type Metrica, type RioJson } from '../lib/rios'
import { inflexao } from '../lib/inflexao'
import { cenario, type Cenario } from '../lib/cenarios'
import { serieAnual } from './AquiferoHistorico'
import { Ajuda } from './Ajuda'
import { Nascentes, NASCENTES, lerNascente, type NascenteJson } from './Nascentes'

const AQ = ['goias', 'urucuia', 'guarani', 'amazonia', 'bengala', 'india_nw', 'mexico', 'brandemburgo', 'ogallala']
const JANELA = 10   // anos: o alerta acende quando o ponto crítico previsto está a 10 anos ou menos
type Nivel = 'alerta' | 'atencao' | 'monitorar' | 'ok'
interface Linha { id: string; lugar: string; tipo: 'rio' | 'aquifero' | 'nascente'; ind: string; un: string; critico: string; ritmo: string; C: Cenario; nivel: Nivel; ordem: number; disparo: number | null; view: 'historico' | 'aquiferos' | 'cenarios' }

function classifica(C: Cenario, agora: number): { nivel: Nivel; ordem: number; disparo: number | null } {
  if (C.jaPassou != null) return { nivel: 'alerta', ordem: -1000 + C.jaPassou - agora, disparo: C.jaPassou }
  if (C.noLimite) return { nivel: 'alerta', ordem: -500, disparo: agora }
  if (C.cruza != null) {
    const disparo = C.cruza - JANELA
    return { nivel: C.cruza - agora <= JANELA ? 'alerta' : C.cruza - agora <= 25 ? 'atencao' : 'monitorar', ordem: C.cruza - agora, disparo }
  }
  if (C.longe) return { nivel: 'monitorar', ordem: 900, disparo: null }
  return { nivel: 'ok', ordem: 1000, disparo: null }
}

export function Cenarios() {
  const { s, go } = useApp()
  const en = s.lang === 'en', B = (x: [string, string]) => x[en ? 1 : 0]
  const [rios, setRios] = useState<Record<string, RioJson>>({})
  const [aqs, setAqs] = useState<Record<string, { id: string; nome: string; serie: { d: string; cm: number }[] }>>({})
  const [todos, setTodos] = useState(false)
  const [filtro, setFiltro] = useState<'tudo' | 'rio' | 'aquifero' | 'nascente'>('tudo')
  const [nasc, setNasc] = useState<NascenteJson[]>([])
  useEffect(() => {
    RIOS.forEach(r => carregarRio(DATA_BASE, r.id).then(d => d && setRios(x => ({ ...x, [r.id]: d }))))
    NASCENTES.forEach(i => fetch(DATA_BASE + 'nascentes/' + i + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => d && setNasc(x => [...x.filter(y => y.id !== d.id), d])).catch(() => {}))
    AQ.forEach(i => fetch(DATA_BASE + 'aquiferos/' + i + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => d && setAqs(x => ({ ...x, [i]: d }))).catch(() => {}))
  }, [])
  const agora = new Date().getFullYear()

  const linhas = useMemo(() => {
    const out: Linha[] = []
    RIOS.forEach(info => {
      const r = rios[info.id]; if (!r) return
      ;(Object.keys(METRICAS) as Metrica[]).forEach(m => {
        const x = analisar(r, m); if (!x) return
        const MM = METRICAS[m], lim = MM.bom === 'alto' ? x.base * 0.5 : Math.max(x.base * 2, x.base + 5)
        const per = B(x.baseTxt).replace('média ', '').replace(' average', '')
        const I = inflexao(x.pts.map(p => p[0]), x.pts.map(p => p[1]), MM.bom)
        const C = cenario(x.pts.map(p => p[0]), x.pts.map(p => p[1]), MM.bom, lim, I); if (!C) return
        const k = classifica(C, agora)
        out.push({ id: info.id + m, lugar: en ? info.nome_en : info.nome, tipo: 'rio', ind: B(MM.nome), un: MM.un,
          critico: `${fmt(lim, en, 1)} ${MM.un} (${MM.bom === 'alto' ? (en ? 'half of ' : 'metade de ') : x.base * 2 >= x.base + 5 ? (en ? 'double of ' : 'dobro de ') : '+5 · '}${per})`,
          ritmo: `${C.ritmo > 0 ? '+' : ''}${fmt(C.ritmo * 10, en, 1)} ${MM.un}/${en ? 'decade' : 'década'}${C.ritmoDe === 'inflexao' ? ` (${en ? 'since' : 'desde'} ${C.ritmoIni})` : ''}`,
          C, ...k, view: 'historico' })
      })
    })
    Object.values(aqs).forEach(a => {
      const A = serieAnual(a.serie)
      ;([['media', en ? 'Average level of the year' : 'Nível médio do ano', A.media], ['seca', en ? 'Dry season (lowest month)' : 'Seca do ano (mês mais baixo)', A.seca]] as const).forEach(([k0, nome, v]) => {
        const antes = v.slice(0, -3); if (antes.length < 5) return
        const iP = antes.indexOf(Math.min(...antes)), lim = antes[iP]
        const I = inflexao(A.anos, [...v], 'alto')
        const C = cenario(A.anos, [...v], 'alto', lim, I); if (!C) return
        const k = classifica(C, agora)
        out.push({ id: a.id + k0, lugar: a.nome, tipo: 'aquifero', ind: nome, un: 'cm', critico: `${fmt(lim, en, 1)} cm (${en ? 'worst before' : 'pior nível anterior'}, ${A.anos[iP]})`,
          ritmo: `${C.ritmo > 0 ? '+' : ''}${fmt(C.ritmo, en, 2)} cm/${en ? 'yr' : 'ano'}${C.ritmoDe === 'inflexao' ? ` (${en ? 'since' : 'desde'} ${C.ritmoIni})` : ''}`, C, ...k, view: 'aquiferos' })
      })
    })
    nasc.forEach(n => {
      const L = lerNascente(n)
      const ordem = L.nivel === 'ok' ? 1000 : (L.cruza ?? agora) - agora
      const C = { cruza: L.nivel === 'ok' ? null : L.cruza, faixa: null, jaPassou: L.atual <= n.critico ? L.ult.ano : null, noLimite: false, longe: false, horizonte: agora + 50 } as unknown as Cenario
      out.push({ id: 'n' + n.id, lugar: n.nome, tipo: 'nascente', ind: en ? 'Native vegetation within 5 km' : 'Vegetação nativa em 5 km', un: '%',
        critico: `${n.critico}% (${en ? 'A.R.K.O reference · Legal Reserve' : 'régua A.R.K.O · Reserva Legal'})`,
        ritmo: `${L.r > 0 ? '+' : ''}${fmt(L.r * 10, en, 1)} ${en ? 'pts/decade' : 'pts/década'} (${n.io[0].ano}–${L.ult.ano})`,
        C, nivel: L.nivel, ordem, disparo: L.disparo, view: 'cenarios' })
    })
    return out.sort((p, q) => p.ordem - q.ordem)
  }, [rios, aqs, nasc, en])   // eslint-disable-line

  const NIV: Record<Nivel, { t: string; c: string; bg: string }> = {
    alerta: { t: en ? 'Alert' : 'Alerta', c: '#B42318', bg: '#FEF3F2' },
    atencao: { t: en ? 'Watch' : 'Atenção', c: '#93370D', bg: '#FEF7C3' },
    monitorar: { t: en ? 'Monitor' : 'Monitorar', c: '#A15C07', bg: '#FEFBE8' },
    ok: { t: en ? 'No risk on the horizon' : 'Sem risco no horizonte', c: '#067647', bg: '#ECFDF3' },
  }
  const cont = (n: Nivel) => linhas.filter(l => l.nivel === n).length
  const vis = linhas.filter(l => (filtro === 'tudo' || l.tipo === filtro) && (todos || l.nivel !== 'ok'))
  const quando = (l: Linha) => l.C.jaPassou != null ? (en ? `already past (since ${l.C.jaPassou})` : `já passou (desde ${l.C.jaPassou})`)
    : l.C.noLimite ? (en ? 'at the limit now' : 'no limite agora')
    : l.C.cruza != null ? `~${l.C.cruza}${l.C.faixa ? ` (${l.C.faixa[0]}–${Number.isFinite(l.C.faixa[1]) ? l.C.faixa[1] : (en ? 'never' : 'nunca')})` : ''}`
    : l.C.longe ? (en ? `not before ${l.C.horizonte}` : `não antes de ${l.C.horizonte}`) : (en ? 'does not reach' : 'não chega')

  return (
    <section className="view on" id="v-cenarios" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1 className="flex items-center">{en ? 'Future scenarios' : 'Cenários futuros'}<Ajuda txt={en ? `For every river and aquifer indicator: the critical point (half of the original forest/water, double the turbidity/bare soil, or the worst aquifer level before), the current pace (after the inflection point if there is one) and when the critical point would be reached if nothing changes, with a likely range. The ALERT lights up when that year is ${JANELA} years away or less — years of lead time to act. Scenario, not forecast.` : `Para cada indicador de rio e aquífero: o ponto crítico (metade da mata/água original, o dobro da turbidez/solo exposto, ou o pior nível anterior do aquífero), o ritmo atual (depois do ponto de inflexão, se houver) e quando o ponto crítico seria atingido se nada mudar, com faixa provável. O ALERTA acende quando esse ano está a ${JANELA} anos ou menos — anos de antecedência para agir. Cenário, não previsão.`} /></h1>
          <div className="text-[12.5px]" style={{ color: '#667085' }}>{en ? `If nothing changes: when does each river and aquifer reach its critical point? · alert = ${JANELA} years or less` : `Se nada mudar: quando cada rio e aquífero chega ao seu ponto crítico? · alerta = ${JANELA} anos ou menos`}</div>
        </div>
      </div>

      <Nascentes />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['alerta', 'atencao', 'monitorar', 'ok'] as Nivel[]).map(n => (
          <div key={n} className="card" style={{ padding: 14, borderLeft: `4px solid ${NIV[n].c}`, background: NIV[n].bg }}>
            <div className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{NIV[n].t}</div>
            <div className="text-[26px] font-extrabold tabular-nums" style={{ color: NIV[n].c }}>{cont(n)}</div>
            <div className="text-[11.5px]" style={{ color: '#667085' }}>{n === 'alerta' ? (en ? `past the limit or ≤ ${JANELA} years` : `passou do limite ou ≤ ${JANELA} anos`) : n === 'atencao' ? (en ? '11–25 years' : '11–25 anos') : n === 'monitorar' ? (en ? 'more than 25 years' : 'mais de 25 anos') : (en ? 'not heading to the limit' : 'não vai em direção ao limite')}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #EAECF0' }}>
          <div className="flex gap-1.5">
            {([['tudo', en ? 'All' : 'Tudo'], ['rio', en ? 'Rivers' : 'Rios'], ['aquifero', en ? 'Aquifers' : 'Aquíferos'], ['nascente', en ? 'Headwaters' : 'Nascentes']] as const).map(([k, t]) => (
              <button key={k} type="button" onClick={() => setFiltro(k)} className="rounded-full px-3 py-1 text-[12.5px] font-semibold" style={{ background: filtro === k ? '#0B1F33' : '#fff', color: filtro === k ? '#fff' : '#101828', border: '1px solid #D0D5DD' }}>{t}</button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: '#475467' }}><input type="checkbox" checked={todos} onChange={e => setTodos(e.target.checked)} />{en ? 'show also "no risk"' : 'mostrar também "sem risco"'}</label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: 900 }}>
            <thead><tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0' }}>
              {[en ? 'Alert' : 'Alerta', en ? 'Place' : 'Lugar', en ? 'Indicator' : 'Indicador', en ? 'Critical point' : 'Ponto crítico', en ? 'Current pace' : 'Ritmo atual', en ? 'Reaches it (likely range)' : 'Chega lá (faixa provável)', en ? 'Alert from' : 'Alerta a partir de'].map(h => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {vis.map(l => (
                <tr key={l.id} onClick={() => (l.view === 'cenarios' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : go(l.view))} className="cursor-pointer" style={{ borderBottom: '1px solid #F2F4F7' }} title={en ? 'Open the history' : 'Abrir o histórico'}>
                  <td className="whitespace-nowrap px-3 py-2"><span className="rounded px-2 py-0.5 text-[11.5px] font-bold" style={{ background: NIV[l.nivel].bg, color: NIV[l.nivel].c }}>{NIV[l.nivel].t}</span></td>
                  <td className="px-3 py-2 font-semibold" style={{ color: '#101828' }}>{l.tipo === 'rio' ? '💧' : l.tipo === 'nascente' ? '🌱' : '⛲'} {l.lugar}</td>
                  <td className="px-3 py-2">{l.ind}</td>
                  <td className="px-3 py-2" style={{ color: '#475467' }}>{l.critico}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums" style={{ color: '#475467' }}>{l.ritmo}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums" style={{ color: NIV[l.nivel].c }}>{quando(l)}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{l.disparo == null ? '—' : l.disparo <= agora ? <b style={{ color: '#B42318' }}>{en ? 'now' : 'agora'}</b> : l.disparo}</td>
                </tr>
              ))}
              {!vis.length && <tr><td colSpan={7} className="px-3 py-6 text-center" style={{ color: '#667085' }}>{en ? 'Loading…' : 'Carregando…'}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="m-0 px-4 py-2 text-[11.5px]" style={{ color: '#667085' }}>{en ? `"Alert from" = the year the critical point gets ${JANELA} years away at the current pace. Scenario, not forecast: rain, policies and works change the course.` : `"Alerta a partir de" = o ano em que o ponto crítico fica a ${JANELA} anos de distância no ritmo atual. Cenário, não previsão: chuva, políticas e obras mudam o rumo.`}</p>
      </div>
    </section>
  )
}
