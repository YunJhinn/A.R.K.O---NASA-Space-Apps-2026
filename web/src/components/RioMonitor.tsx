// v7.1 · A.R.K.O Rios: (1) mapa do rio no tempo, 1985 → última imagem; (2) monitor contínuo (HLS, a cada 2–5 dias)
// com a faixa normal de cada mês e as imagens recentes que saíram do normal (alerta para agir).
import { useEffect, useMemo, useRef, useState } from 'react'
import { DATA_BASE } from '../lib/store'
import { Ajuda } from './Ajuda'
import { AJUDA, anomalias, CONSEQ, fmt, mesNome, METRICAS, normalDoMes, type Analise, type ContinuoJson, type Metrica, type RioJson } from '../lib/rios'

const dias = (d: string) => Math.round((Date.now() - Date.parse(d)) / 864e5)
const dataBR = (d: string, en: boolean) => { const [y, m, dd] = d.split('-'); return en ? `${mesNome(+m, true)} ${+dd}, ${y}` : `${dd}/${m}/${y}` }

/** O trecho do rio ano a ano (Landsat) + a imagem mais recente (HLS), com as medidas daquele ano ao lado */
export function MapaTempo({ r, c, en, an }: { r: RioJson; c: ContinuoJson | null; en: boolean; an: Partial<Record<Metrica, Analise | null>> }) {
  const quadros = useMemo(() => {
    const q = r.serie.filter(a => a.foto).map(a => ({ k: String(a.ano), rot: String(a.ano), foto: a.foto!, ano: a }))
    if (c?.ultima) q.push({ k: 'ultima', rot: en ? `Latest · ${dataBR(c.ultima.d, en)}` : `Última · ${dataBR(c.ultima.d, en)}`, foto: c.ultima.foto, ano: undefined as never })
    return q
  }, [r, c, en])
  const [i, setI] = useState(quadros.length - 1)
  const [play, setPlay] = useState(false)
  useEffect(() => { setI(quadros.length - 1); setPlay(false) }, [r.id, quadros.length])
  const t = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!play) return
    t.current = window.setInterval(() => setI(x => (x + 1 >= quadros.length ? (setPlay(false), x) : x + 1)), 650)
    return () => window.clearInterval(t.current)
  }, [play, quadros.length])
  if (quadros.length < 2) return null
  const q = quadros[Math.min(i, quadros.length - 1)]
  const ult = q.k === 'ultima' ? c!.cenas.filter(x => x.d === c!.ultima!.d) : []
  const val = (k: Metrica) => (q.k === 'ultima' ? ult.find(x => x[k] != null)?.[k] : q.ano?.[k])
  const ks = (Object.keys(METRICAS) as Metrica[]).filter(k => r.serie.some(a => a[k] != null))
  const [x0, y0, x1, y1] = r.bbox
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-[15px]">{en ? 'Timeline: the river year by year (1985 → latest image)' : 'Linha do tempo: o rio ano a ano (1985 → última imagem)'}</h3>
          <p className="m-0 mt-1 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'Drag the bar or press play. Each year is a real cloud-free Landsat image of the same ~20 km stretch; the last frame is the newest HLS image (every 2–5 days). On the right: the state in that year, what changed since 5 years before, what it causes and where it is heading.' : 'Arraste a barra ou aperte o play. Cada ano é uma imagem Landsat real, sem nuvem, do mesmo trecho de ~20 km; o último quadro é a imagem HLS mais nova (a cada 2–5 dias). Ao lado: o estado naquele ano, o que mudou desde 5 anos antes, o que isso causa e para onde vai.'}</p>
        </div>
        <span className="rounded px-2 py-1 text-[11.5px] font-bold" style={{ background: '#F2F4F7', color: '#475467' }}>{fmt(Math.abs(y0), en, 2)}°{y0 < 0 ? 'S' : 'N'}–{fmt(Math.abs(y1), en, 2)}°{y1 < 0 ? 'S' : 'N'} · {fmt(Math.abs(x0), en, 2)}°{x0 < 0 ? 'W' : 'E'}–{fmt(Math.abs(x1), en, 2)}°{x1 < 0 ? 'W' : 'E'}</span>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '1 / 1', background: '#0B1220' }}>
            <img src={DATA_BASE + 'rios/' + q.foto} alt={q.rot} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute left-2 top-2 rounded px-2.5 py-1 text-[14px] font-extrabold" style={{ background: q.k === 'ultima' ? '#0B78C4' : '#000b', color: '#fff' }}>{q.rot}</span>
            <span className="absolute bottom-2 right-2 rounded px-2 py-0.5 text-[10.5px]" style={{ background: '#000a', color: '#fff' }}>{q.k === 'ultima' ? `HLS · ${c!.ultima!.sat}` : (q.ano?.imagens[0]?.split(' ')[1] ?? 'Landsat')}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" className="btn" style={{ width: 44, flex: 'none' }} aria-label={play ? 'Pause' : 'Play'} onClick={() => { if (!play && i >= quadros.length - 1) setI(0); setPlay(!play) }}>{play ? '❚❚' : '▶'}</button>
            <input type="range" min={0} max={quadros.length - 1} value={i} onChange={e => { setPlay(false); setI(+e.target.value) }} aria-label={en ? 'Year' : 'Ano'} style={{ flex: 1 }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px]" style={{ color: '#667085' }}><span>{quadros[0].rot}</span><span>{en ? 'today' : 'hoje'}</span></div>
        </div>
        <div className="grid content-start gap-2">
          {(() => {
            // época escolhida × época de comparação (5 anos antes, ou o 1º ano disponível)
            const anoSel = q.k === 'ultima' ? +c!.ultima!.d.slice(0, 4) : +q.k
            const ehUlt = q.k === 'ultima'
            const cands = ehUlt ? [] : r.serie.filter(a => a.ano <= anoSel - 5)
            const ref = cands.length ? cands[cands.length - 1] : null
            const mesU = ehUlt ? +c!.ultima!.d.slice(5, 7) : 0
            return (
              <>
                <div className="text-[12.5px] font-bold" style={{ color: '#344054' }}>
                  {en ? `State in ${ehUlt ? 'the latest image' : q.k}` : `Estado em ${ehUlt ? 'a última imagem' : q.k}`}{ref ? (en ? ` · change since ${ref.ano}` : ` · mudança desde ${ref.ano}`) : ehUlt ? (en ? ` · compared with the normal for ${mesNome(mesU, true)}` : ` · comparada com o normal de ${mesNome(mesU, false)}`) : ''}
                </div>
                {ks.map(k => {
                  const M = METRICAS[k], v = val(k), v0 = ref?.[k]
                  const nm = ehUlt && c ? normalDoMes(c, k, mesU, +c.ultima!.d.slice(0, 4)) : null
                  const d = v != null && v0 != null ? v - v0 : null
                  const rel = d != null && v0 ? (d / Math.abs(v0)) * 100 : null
                  const foraN = nm && v != null ? (M.bom === 'baixo' ? v > nm.p90 : v < nm.p10) : false
                  const piorou = ehUlt ? foraN : d != null && rel != null && Math.abs(rel) >= 10 && (M.bom === 'baixo' ? d > 0 : d < 0)
                  const melhorou = ehUlt ? false : d != null && rel != null && Math.abs(rel) >= 10 && !piorou
                  const A = an[k]
                  return (
                    <div key={k} className="rounded-lg p-3" style={{ background: piorou ? '#FEF3F2' : melhorou ? '#ECFDF3' : '#F7FAFC', border: '1px solid ' + (piorou ? '#FECDCA' : melhorou ? '#A6F4C5' : '#E3E8EF') }}>
                      <div className="flex items-center text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#475467' }}>{M.nome[en ? 1 : 0]}<Ajuda txt={AJUDA[k][en ? 1 : 0]} /></div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[19px] font-extrabold" style={{ color: M.cor }}>{v != null ? `${fmt(v, en)} ${M.un}` : '—'}</span>
                        {nm && <span className="text-[12px]" style={{ color: foraN ? '#B42318' : '#067647' }}>{en ? 'normal' : 'normal'}: {fmt(nm.p10, en)}–{fmt(nm.p90, en)} {M.un} · <b>{foraN ? (en ? 'outside' : 'fora') : (en ? 'within' : 'dentro')}</b></span>}
                        {d != null && <span className="text-[12.5px] font-bold" style={{ color: piorou ? '#B42318' : melhorou ? '#067647' : '#475467' }}>{d > 0 ? '▲' : d < 0 ? '▼' : '='} {fmt(Math.abs(d), en)} {M.un}{rel != null ? ` (${rel > 0 ? '+' : ''}${fmt(rel, en, 0)}%)` : ''}</span>}
                      </div>
                      {(piorou || melhorou) && <p className="m-0 mt-1 text-[12px] leading-snug" style={{ color: '#344054' }}>{(piorou ? CONSEQ[k].pior : CONSEQ[k].melhor)[en ? 1 : 0]}</p>}
                      {A && <p className="m-0 mt-1 text-[11.5px]" style={{ color: '#6941C6' }}>{en ? 'If the trend continues, 2030:' : 'Se a tendência continuar, 2030:'} <b>{fmt(A.proj2030, en)} {M.un}</b></p>}
                    </div>
                  )
                })}
              </>
            )
          })()}
          {q.k === 'ultima' && <p className="m-0 text-[12px]" style={{ color: '#5B6B7F' }}>{en ? 'The latest image is a single day (HLS); the yearly frames are dry-season medians, so compare it with the normal for its month in the monitor below.' : 'A última imagem é de um dia só (HLS); os anos são medianas da estação seca, então compare-a com o normal do mês no monitor abaixo.'}</p>}
        </div>
      </div>
    </div>
  )
}

/** Série imagem a imagem com a faixa normal de cada mês, e a lista do que saiu do normal recentemente */
export function Monitor({ c, en, k0 }: { c: ContinuoJson | null; en: boolean; k0: Metrica }) {
  const ks = useMemo(() => (Object.keys(METRICAS) as Metrica[]).filter(k => c?.cenas.some(x => x[k] != null)), [c])
  const [k, setK] = useState<Metrica>(k0)
  useEffect(() => { setK(ks.includes(k0) ? k0 : ks[0]) }, [k0, ks.join()])   // eslint-disable-line
  const an = useMemo(() => (c ? anomalias(c, 120) : []), [c])
  if (!c || !c.cenas.length || !k) return null
  const M = METRICAS[k]
  const pts = c.cenas.filter(x => x[k] != null)
  const W = 760, H = 230, L = 46, R = 12, T = 14, B = 26
  const t0 = Date.parse(pts[0].d), t1 = Date.parse(pts[pts.length - 1].d)
  const vals = pts.map(x => x[k] as number), vmax = Math.max(...vals) * 1.08
  const x = (d: string) => L + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / (vmax || 1)) * (H - T - B)
  const anos = Array.from(new Set(pts.map(p => p.d.slice(0, 4))))
  // faixa normal do mês ao longo do último ano (para mostrar o "corredor" esperado)
  const ultAno = +pts[pts.length - 1].d.slice(0, 4)
  const faixa = Array.from({ length: 12 }, (_, i) => {
    const d = `${ultAno}-${String(i + 1).padStart(2, '0')}-15`; const n = normalDoMes(c, k, i + 1, ultAno)
    return n && Date.parse(d) >= t0 ? { d, ...n } : null
  }).filter(Boolean) as { d: string; p10: number; p50: number; p90: number }[]
  const last = pts[pts.length - 1], nLast = normalDoMes(c, k, +last.d.slice(5, 7), +last.d.slice(0, 4))
  const ruimAlto = M.bom === 'baixo'
  const foraLast = nLast ? (ruimAlto ? (last[k] as number) > nLast.p90 : (last[k] as number) < nLast.p10) : false
  const anK = an.filter(a => a.k === k)
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-[15px]">{en ? 'Continuous monitor: every new image (HLS, NASA, every 2–5 days)' : 'Monitor contínuo: cada imagem nova (HLS, NASA, a cada 2–5 dias)'}</h3>
          <p className="m-0 mt-1 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? `${pts.length} cloud-free images since ${pts[0].d.slice(0, 4)}. Grey band: the normal range for each month (10th–90th percentile of previous years). A point outside the band on the bad side becomes an alert.` : `${pts.length} imagens sem nuvem desde ${pts[0].d.slice(0, 4)}. Faixa cinza: o normal de cada mês (percentis 10 a 90 dos anos anteriores). Ponto fora da faixa, para o lado ruim, vira alerta.`}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ks.map(m => <button key={m} type="button" onClick={() => setK(m)} className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: m === k ? METRICAS[m].cor : '#fff', color: m === k ? '#fff' : '#344054', border: '1px solid ' + (m === k ? METRICAS[m].cor : '#D0D5DD') }}>{METRICAS[m].nome[en ? 1 : 0]}</button>)}
        </div>
      </div>

      {/* estado da última imagem: é o que pede ação agora */}
      <div className="mt-3 rounded-xl p-3 text-[13.5px]" style={{ background: foraLast ? '#FEF3F2' : '#ECFDF3', border: `1px solid ${foraLast ? '#FECDCA' : '#A6F4C5'}`, color: foraLast ? '#912018' : '#05603A' }}>
        <b>{en ? 'Latest image' : 'Última imagem'}: {dataBR(last.d, en)} ({last.sat}, {en ? `${dias(last.d)} days ago` : `há ${dias(last.d)} dias`})</b> · {M.nome[en ? 1 : 0]} {fmt(last[k] as number, en)} {M.un}
        {nLast && <> · {en ? `normal for ${mesNome(+last.d.slice(5, 7), true)}` : `normal de ${mesNome(+last.d.slice(5, 7), false)}`}: {fmt(nLast.p10, en)}–{fmt(nLast.p90, en)} {M.un} → <b>{foraLast ? (en ? 'OUTSIDE normal: check it' : 'FORA do normal: verificar') : (en ? 'within normal' : 'dentro do normal')}</b></>}
      </div>

      <div className="mt-3 overflow-x-auto"><div style={{ minWidth: 560 }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={en ? 'Image by image chart' : 'Gráfico imagem a imagem'} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[0, vmax / 2, vmax].map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#EEF1F4" /><text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#667085">{fmt(v, en, 1)}</text></g>)}
          {anos.map(a => { const d = a + '-01-01'; return Date.parse(d) >= t0 ? <text key={a} x={x(d)} y={H - 8} textAnchor="middle" fontSize={10} fill="#667085">{a}</text> : null })}
          {faixa.length > 1 && <path d={faixa.map((f, i) => `${i ? 'L' : 'M'}${x(f.d)},${y(f.p90)}`).join('') + faixa.slice().reverse().map(f => `L${x(f.d)},${y(f.p10)}`).join('') + 'Z'} fill="#98A2B3" opacity={0.25} />}
          {pts.map(p => {
            const n = normalDoMes(c, k, +p.d.slice(5, 7), +p.d.slice(0, 4)); const v = p[k] as number
            const fora = n ? (ruimAlto ? v > n.p90 : v < n.p10) : false
            return <circle key={p.d + p.sat} cx={x(p.d)} cy={y(v)} r={fora ? 3.2 : 2.2} fill={fora ? '#D92D20' : M.cor} opacity={fora ? 0.95 : 0.55}><title>{`${dataBR(p.d, en)} · ${p.sat}: ${fmt(v, en)} ${M.un}`}</title></circle>
          })}
          <circle cx={x(last.d)} cy={y(last[k] as number)} r={6} fill="none" stroke="#0B78C4" strokeWidth={2} />
        </svg>
      </div></div>

      <h4 className="mb-1.5 mt-3 text-[13.5px]">{en ? 'Out of normal in the last 120 days' : 'Fora do normal nos últimos 120 dias'} ({anK.length})</h4>
      {anK.length ? (
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {anK.slice(0, 6).map(a => (
            <li key={a.d + a.sat} className="rounded-lg px-3 py-2 text-[12.5px]" style={{ background: '#FEF3F2', border: '1px solid #FECDCA', color: '#7A271A' }}>
              <b>{dataBR(a.d, en)} · {a.sat}:</b> {a.txt[en ? 1 : 0]} · {fmt(a.v, en)} {METRICAS[a.k].un}
            </li>
          ))}
        </ul>
      ) : <p className="m-0 text-[12.5px]" style={{ color: '#05603A' }}>{en ? 'No image outside the normal range for this measure.' : 'Nenhuma imagem fora do normal nessa medida.'}</p>}
      <p className="m-0 mt-2 text-[11.5px]" style={{ color: '#667085' }}>{en ? `Source: ${c.fonte}. Updated ${dataBR(c.atualizado, en)}. Single-day images vary with clouds, haze and river stage; one point out of normal is a reason to check, two in a row is a reason to act.` : `Fonte: ${c.fonte}. Atualizado em ${dataBR(c.atualizado, en)}. Imagens de um dia variam com névoa e nível do rio; um ponto fora do normal é motivo para verificar, dois seguidos são motivo para agir.`}</p>
    </div>
  )
}
