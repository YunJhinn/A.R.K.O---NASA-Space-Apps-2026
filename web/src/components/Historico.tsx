// A.R.K.O Rios · tela principal: o que aconteceu com o rio em 40 anos (Landsat 1985 → hoje),
// a tendência se nada mudar e o que fazer para proteger a água.
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import { MapaTempo, Monitor } from './RioMonitor'
import { Ajuda } from './Ajuda'
import { RadarRio } from './RadarRio'
import { inflexao, type Inflexao } from '../lib/inflexao'
import { acoes, AJUDA, analisar, carregarContinuo, carregarRio, GRUPOS, meta, veredito, VEREDITO, type ContinuoJson, CONTEXTO, ESTADO, fmt, frase, METRICAS, RIOS, type Analise, type Metrica, type RioJson } from '../lib/rios'

type Bi = [string, string]

function Grafico({ a, en, cor, un }: { a: Analise; en: boolean; cor: string; un: string }) {
  const W = 760, H = 250, L = 46, R = 14, T = 16, B = 30
  const anos = a.pts.map(p => p[0]), a0 = anos[0], a1 = 2030
  const vals = [...a.pts.map(p => p[1]), a.base, a.proj2030]
  const vmax = Math.max(...vals) * 1.12, vmin = Math.min(0, Math.min(...vals))
  const x = (ano: number) => L + ((ano - a0) / (a1 - a0)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - vmin) / (vmax - vmin || 1)) * (H - T - B)
  const linha = a.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('')
  const ult = a.pts[a.pts.length - 1][0]
  const tY = (ano: number) => y(Math.max(0, a.tend.m * ano + a.tend.b))
  const ticks = Array.from({ length: 5 }, (_, i) => vmin + ((vmax - vmin) * i) / 4)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={en ? 'Yearly chart' : 'Gráfico por ano'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#EEF1F4" /><text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#667085">{fmt(v, en, v < 10 ? 1 : 0)}</text></g>)}
      {[1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025, 2030].filter(t => t >= a0).map(t => <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize={10} fill="#667085">{t}</text>)}
      <rect x={x(ult) + 2} y={T} width={x(2030) - x(ult) - 2} height={H - T - B} fill="#F5F3FF" />
      <text x={(x(ult) + x(2030)) / 2} y={T + 12} textAnchor="middle" fontSize={10} fontWeight={700} fill="#6941C6">{en ? 'if nothing changes' : 'se nada mudar'}</text>
      <line x1={L} x2={W - R} y1={y(a.base)} y2={y(a.base)} stroke="#98A2B3" strokeDasharray="2 4" />
      <text x={L + 4} y={y(a.base) - 4} fontSize={10} fill="#475467">{en ? 'how it was (' + a.baseTxt[1] + ')' : 'como era (' + a.baseTxt[0] + ')'}</text>
      <path d={linha} fill="none" stroke={cor} strokeWidth={2} />
      {a.pts.map(p => <circle key={p[0]} cx={x(p[0])} cy={y(p[1])} r={2.8} fill={cor}><title>{`${p[0]}: ${fmt(p[1], en)} ${un}`}</title></circle>)}
      <line x1={x(a.tend.de)} y1={tY(a.tend.de)} x2={x(ult)} y2={tY(ult)} stroke="#6941C6" strokeWidth={2} opacity={0.75} />
      <line x1={x(ult)} y1={tY(ult)} x2={x(2030)} y2={y(a.proj2030)} stroke="#6941C6" strokeWidth={2} strokeDasharray="5 4" />
      <circle cx={x(2030)} cy={y(a.proj2030)} r={4} fill="#6941C6" />
      <text x={x(2030) - 4} y={y(a.proj2030) - 8} textAnchor="end" fontSize={10.5} fontWeight={700} fill="#6941C6">2030: {fmt(a.proj2030, en)} {un}</text>
      {a.pico && <><circle cx={x(a.pico[0])} cy={y(a.pico[1])} r={5.5} fill="none" stroke="#B42318" strokeWidth={1.5} />
        <text x={x(a.pico[0])} y={y(a.pico[1]) - 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="#B42318">{en ? 'worst' : 'pior'} {a.pico[0]}</text></>}
    </svg>
  )
}

function Swot({ r, en }: { r: RioJson; en: boolean }) {
  const s = r.swot?.serie ?? []
  if (s.length < 4) return null
  const W = 760, H = 150, L = 46, R = 14, T = 12, B = 26
  const ts = s.map(p => Date.parse(p.d)), t0 = Math.min(...ts), t1 = Math.max(...ts)
  const v = s.map(p => p.wse), lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo) * 0.15 || 0.5
  const x = (t: number) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R)
  const y = (w: number) => T + (1 - (w - lo + pad) / (hi - lo + 2 * pad)) * (H - T - B)
  const anos = Array.from(new Set(s.map(p => p.d.slice(0, 4))))
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 className="m-0 text-[15px]">{en ? 'River level now: SWOT (NASA/CNES), 2023 → today' : 'Nível do rio agora: SWOT (NASA/CNES), 2023 → hoje'}</h3>
      <p className="m-0 mb-2 mt-1 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? `Water surface height (m above sea level) at reach ${r.swot!.reach_id}${r.swot!.rio ? ' · ' + r.swot!.rio : ''}. Low points are the dry season: the lower they get year after year, the less water is left for the city.` : `Altura da água (m acima do nível do mar) no trecho ${r.swot!.reach_id}${r.swot!.rio ? ' · ' + r.swot!.rio : ''}. Os pontos baixos são a seca: quanto mais baixos ano após ano, menos água sobra para a cidade.`}</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="SWOT" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[lo, (lo + hi) / 2, hi].map(w => <g key={w}><line x1={L} x2={W - R} y1={y(w)} y2={y(w)} stroke="#EEF1F4" /><text x={L - 6} y={y(w) + 3} textAnchor="end" fontSize={10} fill="#667085">{fmt(w, en)}</text></g>)}
        {anos.map(a => { const t = Date.parse(a + '-01-01'); return t >= t0 && t <= t1 ? <text key={a} x={x(t)} y={H - 8} textAnchor="middle" fontSize={10} fill="#667085">{a}</text> : null })}
        <path d={s.map((p, i) => `${i ? 'L' : 'M'}${x(Date.parse(p.d)).toFixed(1)},${y(p.wse).toFixed(1)}`).join('')} fill="none" stroke="#2563EB" strokeWidth={1.4} opacity={0.6} />
        {s.map(p => <circle key={p.d} cx={x(Date.parse(p.d))} cy={y(p.wse)} r={2.2} fill="#2563EB"><title>{`${p.d}: ${fmt(p.wse, en, 2)} m`}</title></circle>)}
      </svg>
    </div>
  )
}

export function Historico() {
  const { s, ds } = useApp()
  const en = s.lang === 'en', B = (x: Bi) => x[en ? 1 : 0]
  const inicial = 'tapajos'
  const [rid, setRid] = useState(inicial)
  const [rio, setRio] = useState<RioJson | null | 'erro'>(null)
  const [k, setK] = useState<Metrica>('turbidez')
  const [cont, setCont] = useState<ContinuoJson | null>(null)
  useEffect(() => { setRio(null); setCont(null); carregarRio(DATA_BASE, rid).then(d => setRio(d ?? 'erro')); carregarContinuo(DATA_BASE, rid).then(setCont) }, [rid])
  const ok = rio && rio !== 'erro' ? rio : null
  const metricas = (Object.keys(METRICAS) as Metrica[]).filter(m => ok?.serie.some(a => a[m] != null))
  useEffect(() => { if (ok && !metricas.includes(k)) setK(metricas[0]) }, [ok?.id])   // eslint-disable-line
  const an = useMemo(() => Object.fromEntries(metricas.map(m => [m, ok ? analisar(ok, m) : null])) as Partial<Record<Metrica, Analise | null>>, [ok, metricas.join()])
  // v7.7 · ponto de inflexão de cada medida (ano em que o padrão de longo prazo mudou)
  const inf = useMemo(() => Object.fromEntries(metricas.map(m => {
    const x = an[m]; return [m, x ? inflexao(x.pts.map(p => p[0]), x.pts.map(p => p[1]), METRICAS[m].bom) : null]
  })) as Partial<Record<Metrica, Inflexao | null>>, [an])   // eslint-disable-line
  const a = an[k], M = METRICAS[k], info = RIOS.find(r => r.id === rid)!
  const ctx = CONTEXTO[rid]
  const anos = ok ? `${ok.serie[0]?.ano}–${ok.serie[ok.serie.length - 1]?.ano}` : ''
  const nImg = ok ? ok.serie.reduce((n, x) => n + x.imagens.length, 0) : 0
  const temRegiao = info.regiao && ds.realIndex.some(m => m.id === info.regiao)

  return (
    <section className="view on" id="v-historico" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'River history · 40 years from space' : 'Histórico do rio · 40 anos vistos do espaço'}</h1>
          <div className="answer"><span className="dot" style={{ background: '#2563EB' }} />
            <span>{en ? 'What happened to the water that supplies the city, why, and where it is heading if nothing changes.' : 'O que aconteceu com a água que abastece a cidade, por quê, e para onde vai se nada mudar.'}</span>
          </div>
        </div>
      </div>

      {/* escolha do rio, por grupo */}
      <div className="grid gap-2">
        {GRUPOS.map(g => (
          <div key={g.k} className="flex flex-wrap items-center gap-2">
            <span className="w-[70px] text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: '#667085' }}>{B(g.t)}</span>
            {RIOS.filter(r => r.grupo === g.k).map(r => (
              <button key={r.id} type="button" onClick={() => setRid(r.id)} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                style={{ background: r.id === rid ? '#1D4ED8' : '#fff', color: r.id === rid ? '#fff' : '#1E2A3A', border: '1px solid ' + (r.id === rid ? '#1D4ED8' : '#D0D5DD') }}>
                💧 {en ? r.nome_en : r.nome}
              </button>
            ))}
          </div>
        ))}
      </div>

      {!ok ? (
        <div className="card" style={{ padding: 20 }}>{rio === 'erro' ? (en ? 'No data for this river yet.' : 'Ainda não há dados para este rio.') : (en ? 'Loading 40 years of images…' : 'Carregando 40 anos de imagens…')}</div>
      ) : (
        <>
          {/* FICHA: em 5 segundos, qual rio, qual período, se corre risco, por quê e o que fazer */}
          {(() => {
            const V = veredito(an), VV = VEREDITO[V.v]
            const ult = cont?.ultima
            const metas = (Object.values(an).filter(Boolean) as Analise[]).map(x => ({ x, alvo: meta(x) })).filter(m => m.alvo != null && (m.x.estado === 'alerta' || m.x.estado === 'atencao'))
            return (
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: `2px solid ${VV.c}` }}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ background: VV.bg }}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#475467' }}>{en ? 'You are looking at' : 'Você está vendo'}</div>
                    <div className="text-[20px] font-extrabold leading-tight" style={{ color: '#101828' }}>{en ? info.nome_en : info.nome}</div>
                    <div className="mt-0.5 text-[13px]" style={{ color: '#344054' }}>
                      {en ? 'Period' : 'Período'}: <b>{anos}</b>{ult ? <> · {en ? 'latest image' : 'última imagem'}: <b>{ult.d.split('-').reverse().join('/')}</b> ({ult.sat})</> : null} · {en ? 'supplies' : 'abastece'} {ok.cidade}
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-2 text-center" style={{ background: '#fff', border: `2px solid ${VV.c}` }}>
                    <div className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: '#475467' }}>{en ? 'Conservation status' : 'Estado de conservação'}</div>
                    <div className="text-[17px] font-extrabold" style={{ color: VV.c }}>{VV.ic} {B(VV.t)}</div>
                  </div>
                </div>
                <div className="grid gap-4 px-5 py-4 lg:grid-cols-3">
                  <div>
                    <div className="mb-1 text-[12.5px] font-bold" style={{ color: '#101828' }}>{en ? 'Why' : 'Por quê'}</div>
                    {V.ruins.length ? <ul className="m-0 list-disc space-y-1 pl-4 text-[13px] leading-snug" style={{ color: '#344054' }}>{V.ruins.slice(0, 3).map(x => <li key={x.k}>{frase(x, en)}</li>)}</ul>
                      : <p className="m-0 text-[13px]" style={{ color: '#344054' }}>{en ? 'No measure is getting worse beyond its normal variation. Keep monitoring and protecting the banks.' : 'Nenhuma medida está piorando além da variação normal. Continue acompanhando e protegendo as margens.'}</p>}
                  </div>
                  <div>
                    <div className="mb-1 text-[12.5px] font-bold" style={{ color: '#101828' }}>{en ? 'Probable cause' : 'Causa provável'}</div>
                    <p className="m-0 text-[13px] leading-snug" style={{ color: '#344054' }}>{ctx ? B(ctx.causa).split('. ').slice(0, 2).join('. ') + '.' : ok.pressao}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-[12.5px] font-bold" style={{ color: '#101828' }}>{en ? 'What to do now' : 'O que fazer agora'}</div>
                    <ul className="m-0 list-none space-y-1 p-0 text-[13px] leading-snug" style={{ color: '#344054' }}>{acoes(ok, an, en).slice(0, 2).map(x => <li key={x.quem}><b style={{ color: '#026AA2' }}>{x.quem}:</b> {x.o_que}</li>)}</ul>
                    {metas.length > 0 && <div className="mt-2 rounded-lg p-2 text-[12.5px]" style={{ background: '#F0F9FF', border: '1px solid #B9E6FE', color: '#065986' }}>
                      <b>{en ? 'Recovery goal' : 'Meta de recuperação'}:</b> {metas.map(m => `${METRICAS[m.x.k].nome[en ? 1 : 0]} ${en ? 'back to' : 'voltar a'} ${fmt(m.alvo!, en)} ${METRICAS[m.x.k].un} (${en ? 'as in' : 'como em'} ${m.x.melhorJanela![0]}–${m.x.melhorJanela![1]})`).join('; ')}
                    </div>}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* v7.7 · PROCESSOS LENTOS: o que some um rio aos poucos. O alerta é a mudança de padrão (ponto de inflexão),
              que dá ANOS de antecedência para agir, e não horas como num alerta de enchente. */}
          <div className="card" style={{ padding: 18 }}>
            <h3 className="m-0 flex items-center text-[15px]">{en ? 'Slow processes · long-term reading' : 'Processos lentos · leitura de longo prazo'}<Ajuda txt={en ? 'Silting and loss of riverbank forest happen slowly and can make a river disappear. The early signal is a CHANGE OF PATTERN: the year from which the trend started to behave differently (inflection point). Detecting it gives years of lead time to act — protect banks, control erosion, replant — instead of reacting to a disaster.' : 'Assoreamento e perda de mata nas margens acontecem devagar e podem fazer um rio desaparecer. O sinal antecipado é a MUDANÇA DE PADRÃO: o ano a partir do qual a tendência passou a se comportar diferente (ponto de inflexão). Detectá-la dá anos de antecedência para agir — proteger margens, conter erosão, replantar — em vez de reagir a um desastre.'} /></h3>
            <div className="mt-2 grid gap-2 lg:grid-cols-3">
              {([
                [en ? 'Silting / erosion' : 'Assoreamento / erosão', ['turbidez', 'solo_exposto'] as Metrica[], en ? 'sediment in the water and bare soil on the banks' : 'sedimento na água e solo exposto nas margens'],
                [en ? 'Riverbank forest' : 'Mata nas margens', ['mata_ciliar'] as Metrica[], en ? 'the forest that holds soil and filters runoff' : 'a mata que segura o solo e filtra a enxurrada'],
                [en ? 'Water volume' : 'Volume de água', (['agua_km2', 'gelo_km2'] as Metrica[]), en ? 'open water (or ice that feeds the river)' : 'água aberta (ou gelo que alimenta o rio)'],
              ] as const).map(([titulo, ks, sub]) => {
                const itens = ks.filter(m => an[m])
                if (!itens.length) return null
                const linhas = itens.map(m => {
                  const x = an[m]!, I = inf[m], MM = METRICAS[m]
                  const ruim = MM.bom === 'baixo' ? x.tend.m > 0 : x.tend.m < 0
                  const forte = x.estado === 'alerta' || x.estado === 'atencao' || Math.abs(x.tend.m * 10) >= Math.abs(x.base || 1) * 0.03
                  const piorouPadrao = I?.sig && (MM.bom === 'baixo' ? I.depois > I.antes : I.depois < I.antes)
                  return { m, x, I, MM, ruim: ruim && forte, piorouPadrao }
                })
                const alerta = linhas.some(l => l.piorouPadrao), atencao = linhas.some(l => l.ruim)
                const cor = alerta ? '#B42318' : atencao ? '#B54708' : '#067647', bg = alerta ? '#FEF3F2' : atencao ? '#FFFAEB' : '#ECFDF3'
                return (
                  <div key={titulo} className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${cor}33` }}>
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-[13.5px]" style={{ color: '#101828' }}>{titulo}</b>
                      <span className="rounded px-2 py-0.5 text-[11px] font-bold" style={{ background: '#fff', color: cor }}>{alerta ? (en ? 'pattern worsened' : 'padrão piorou') : atencao ? (en ? 'slowly worsening' : 'piorando aos poucos') : (en ? 'stable / improving' : 'estável / melhorando')}</span>
                    </div>
                    <div className="text-[11.5px]" style={{ color: '#667085' }}>{sub}</div>
                    <ul className="m-0 mt-1.5 list-none space-y-1 p-0 text-[12.5px] leading-snug" style={{ color: '#344054' }}>
                      {linhas.map(l => (
                        <li key={l.m}>
                          <b>{B(l.MM.nome)}</b>: {en ? 'pace' : 'ritmo'} {l.x.tend.m > 0 ? '+' : ''}{fmt(l.x.tend.m * 10, en, 1)} {l.MM.un}/{en ? 'decade' : 'década'}.{' '}
                          {l.I?.sig
                            ? <>{en ? `Pattern changed in ${l.I.ano}` : `O padrão mudou em ${l.I.ano}`} ({fmt(l.I.antes * 10, en, 1)} → {fmt(l.I.depois * 10, en, 1)}).{l.I.anosAtePior != null && <> <b style={{ color: '#B42318' }}>{en ? `If it continues, passes the worst value ever recorded in ~${fmt(l.I.anosAtePior, en, 0)} years.` : `Se continuar, passa do pior valor já registrado em ~${fmt(l.I.anosAtePior, en, 0)} anos.`}</b></>}</>
                            : (en ? `Same pace since ${l.x.pts[0][0]}.` : `Mesmo ritmo desde ${l.x.pts[0][0]}.`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            <p className="m-0 mt-2 text-[11.5px]" style={{ color: '#667085' }}>{en ? 'Inflection = year that best splits the series into two different trends (Theil–Sen), accepted only if each part has 6+ years and the change is large and consistent. Projection, not forecast.' : 'Inflexão = o ano que melhor divide a série em duas tendências diferentes (Theil–Sen), aceito só se cada trecho tem 6+ anos e a mudança é grande e consistente. Projeção, não previsão.'}</p>
          </div>

          {/* PAINÉIS: um por medida, com "?" explicando o que é */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {metricas.map(m => {
              const x = an[m]; if (!x) return null
              const E = ESTADO[x.estado], MM = METRICAS[m], alvo = meta(x)
              const sp = x.pts.slice(-20), lo = Math.min(...sp.map(p => p[1])), hi = Math.max(...sp.map(p => p[1]))
              const tend = (MM.bom === 'baixo' ? x.tend.m < 0 : x.tend.m > 0) ? (en ? 'improving' : 'melhorando') : Math.abs(x.tend.m) < Math.abs(x.base) * 0.005 ? (en ? 'stable' : 'estável') : (en ? 'worsening' : 'piorando')
              return (
                <div key={m} role="button" tabIndex={0} onClick={() => setK(m)} onKeyDown={e => e.key === 'Enter' && setK(m)} className="card text-left" style={{ padding: 14, outline: m === k ? '2px solid #1D4ED8' : 'none', cursor: 'pointer' }}>
                  <div className="flex items-center text-[12px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{B(MM.nome)}<Ajuda txt={B(AJUDA[m])} /></div>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="text-[22px] font-extrabold leading-none" style={{ color: MM.cor }}>{fmt(x.agora, en)} <span className="text-[13px] font-bold">{MM.un}</span></div>
                    <svg viewBox="0 0 80 26" width={80} height={26} aria-hidden="true"><path d={sp.map((p, i) => `${i ? 'L' : 'M'}${(i / Math.max(1, sp.length - 1)) * 78 + 1},${25 - ((p[1] - lo) / (hi - lo || 1)) * 23}`).join('')} fill="none" stroke={MM.cor} strokeWidth={1.6} /></svg>
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: '#475467' }}>{en ? 'was' : 'era'} {fmt(x.base, en)} {MM.un} · {x.var > 0 ? '+' : ''}{fmt(x.var, en, 0)}% · {en ? 'trend' : 'tendência'}: {tend}</div>
                  {(() => { const I = inf[m]; if (!I?.sig) return <div className="mt-1 text-[11.5px]" style={{ color: '#667085' }}>{en ? 'Same pattern since' : 'Mesmo padrão desde'} {x.pts[0][0]}</div>
                    const piora = MM.bom === 'baixo' ? I.depois > I.antes : I.depois < I.antes
                    return <div className="mt-1 text-[11.5px] font-semibold" style={{ color: piora ? '#B42318' : '#067647' }}>{en ? 'Inflection' : 'Inflexão'} {I.ano}: {fmt(I.antes * 10, en, 1)} → {fmt(I.depois * 10, en, 1)} {MM.un}/{en ? 'decade' : 'década'}</div> })()}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-block rounded px-2 py-0.5 text-[11.5px] font-bold" style={{ background: E.bg, color: E.c }}>{B(E.t)}</span>
                    {alvo != null && <span className="text-[11.5px]" style={{ color: '#065986' }}>{en ? 'goal' : 'meta'}: {fmt(alvo, en)} {MM.un}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <MapaTempo r={ok} c={cont} en={en} an={an} />

          {/* gráfico principal */}
          {a && (
            <div className="card" style={{ padding: 20 }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: M.cor }}>{B(M.nome)} · {anos}</div>
                  <h2 style={{ margin: '2px 0 4px', fontSize: 18 }}>{en ? info.nome_en : info.nome}</h2>
                  <p className="m-0 text-[14px] leading-snug" style={{ color: '#1E2A3A' }}>{frase(a, en)}</p>
                </div>
                {temRegiao && <button type="button" className="btn" style={{ fontSize: 13 }} onClick={() => document.getElementById('radar-rio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{en ? 'See the river now (NISAR radar) ↓' : 'Ver o rio agora (radar NISAR) ↓'}</button>}
              </div>
              <div className="mt-3 overflow-x-auto"><div style={{ minWidth: 560 }}><Grafico a={a} en={en} cor={M.cor} un={M.un} /></div></div>
              <p className="m-0 mt-2 text-[12.5px]" style={{ color: '#5B6B7F' }}>{B(M.o_que)} {en ? `Purple line: trend (last 15 years; whole series for ice), robust Theil–Sen; dashed: where it goes by 2030 if nothing changes. It is a projection, not a certainty.` : `Linha roxa: tendência (últimos 15 anos; série inteira para o gelo), método robusto de Theil–Sen; tracejada: onde chega em 2030 se nada mudar. É uma projeção, não uma certeza.`}</p>
            </div>
          )}

          <Monitor c={cont} en={en} k0={k} />

          <RadarRio info={info} c={cont} en={en} />

          {/* causa provável + o que fazer */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="card" style={{ padding: 18 }}>
              <h3 className="m-0 text-[15px]">{en ? 'Probable cause (hypothesis)' : 'Causa provável (hipótese)'}</h3>
              <p className="m-0 mt-2 text-[13.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>{ctx ? B(ctx.causa) : ''}</p>
              {ctx?.fonte && <a href={ctx.fonte.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12.5px]" style={{ color: '#2563EB' }}>{en ? 'Source: ' : 'Fonte: '}{ctx.fonte.t}</a>}
              <p className="m-0 mt-3 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? `Main pressure: ${ok.pressao}.` : `Principal pressão: ${ok.pressao}.`}</p>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 className="m-0 text-[15px]">{en ? 'How to protect this water' : 'Como proteger esta água'}</h3>
              <ul className="m-0 mt-2 list-none space-y-2 p-0">
                {acoes(ok, an, en).map(x => (
                  <li key={x.quem} className="rounded-lg p-2.5 text-[13px] leading-snug" style={{ background: '#F0F9FF', border: '1px solid #B9E6FE' }}>
                    <b style={{ color: '#026AA2' }}>{x.quem}:</b> {x.o_que}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Swot r={ok} en={en} />

          <div className="card" style={{ padding: 16 }}>
            <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: '#5B6B7F' }}>
              {en ? `How it was measured: ${nImg} cloud-free Landsat images (dry season, ${anos}), in a ~20 km box over the stretch that supplies ${ok.cidade}. For each year, up to 3 images; the value is their median. Source: ${ok.fonte}.` : `Como foi medido: ${nImg} imagens Landsat sem nuvem (estação seca, ${anos}), numa caixa de ~20 km sobre o trecho que abastece ${ok.cidade}. Em cada ano, até 3 imagens; o valor é a mediana delas. Fonte: ${ok.fonte}.`}
              {' '}{en ? 'Limits: Landsat 5, 7 and 8/9 have slightly different sensors; one image per year can catch an unusual day; turbidity here is a reflectance index, not a lab measurement.' : 'Limites: Landsat 5, 7 e 8/9 têm sensores um pouco diferentes; uma imagem por ano pode pegar um dia fora do comum; a turbidez aqui é um índice de reflectância, não uma medida de laboratório.'}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
