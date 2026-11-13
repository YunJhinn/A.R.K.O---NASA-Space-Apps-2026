import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { MES, MAP_H, MAP_W } from '../../lib/demo'
import type { Ev, EvType, Info } from '../../lib/types'
import { cx, evMonth, lvlOf, pos, rgba } from '../../lib/util'
import { REAL_NAMES } from '../../lib/real'
import { Icon } from '../Icon'
import { Heat, MapBase } from '../MapBase'
import { Timeline } from './Timeline'
import { useFocus } from '../../lib/useFocus'
import { fmtDate } from '../../lib/i18n'
import { dentro, projetar } from '../../lib/regions'

export function MapPanel() {
  const { s, set, t, ds, go, inRange, periodLabel } = useApp()
  const real = s.src === 'real'
  const { ev: vis, base: tlBase, step } = useFocus()
  const base = tlBase ?? ds.ev.filter(e => e.st !== 'prev' && inRange(e.d))
  const counts: Record<string, number> = { todos: 0 }
  base.forEach(e => { const w = real ? 1 : e.n * 4; counts[e.k] = (counts[e.k] ?? 0) + w; counts.todos += w })
  const sub = real
    ? (step ? `${counts.todos} focos reais do NISAR · ${step.label} · clique em um foco para ver o que mudou` : `${counts.todos} focos reais do NISAR (${ds.rd.a} → ${ds.rd.b}) · clique em um foco para ver o que mudou`)
    : step ? `${counts.todos} focos detectados · ${step.label} · clique em um foco para ver o que mudou` : `${counts.todos} focos detectados em ${periodLabel()} · clique em um foco para ver o que mudou`
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (s.focus === 'map') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [s.focus])
  return (
    <div className="card panel" id="mapPanel" ref={ref}>
      <div className="ph">
        <div style={{ flex: 1 }}><h2>{t('Mapa de mudanças')}</h2><p>{t(sub)}</p></div>
        <div className="seg" role="group" aria-label={t('Camada')}>
          <button className="on">{t('Radar')}</button><button>{t('Satélite óptico')}</button><button onClick={() => go('comparar')}>{t('Antes / depois')}</button>
        </div>
      </div>
      <div className="chiprow">
        <div className="chips" role="group" aria-label={t('Filtrar por tipo de evento')}>
          {(['todos', 'fogo', 'agua', 'arvore', 'solo'] as const).map(k => {
            const on = s.type === k, col = k === 'todos' ? '#5F6670' : ds.types[k].c
            return (
              <button key={k} className={cx('chip', on && 'on', k === 'todos' && 'all')} aria-pressed={on} style={{ '--c': col } as CSSProperties} onClick={() => set({ type: k })}>
                <span style={{ color: col, display: 'flex' }}><Icon k={k === 'todos' ? 'todos' : ds.types[k].ic} size={15} /></span>
                {t(k === 'todos' ? 'Todos' : ds.types[k].n)}<span className="n">{counts[k] ?? 0}</span>
              </button>
            )
          })}
        </div>
        <div className="cmode">{t('Colorir por')}
          <div className="seg" role="group" aria-label={t('Colorir focos por')}>
            {(['tipo', 'mes'] as const).map(c => <button key={c} className={cx(s.colorBy === c && 'on')} aria-pressed={s.colorBy === c} onClick={() => set({ colorBy: c })}>{t(c === 'tipo' ? 'Tipo' : 'Mês')}</button>)}
          </div>
        </div>
      </div>
      <ChangeMap ev={vis} />
      <Timeline />
    </div>
  )
}

function ChangeMap({ ev }: { ev: Ev[] }) {
  const { s, set, t, ds, setSrc } = useApp()
  const real = s.src === 'real'
  const { img, step } = useFocus()
  const m = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = m.current; if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') set({ sel: null }) }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  }, [set])
  const mc = (e: Ev) => (s.colorBy === 'mes' && e.st !== 'prev' ? evMonth(e.d)[3] : ds.types[e.k].c)
  const sel = ev.find(e => e.id === s.sel)
  const heats = !real && s.colorBy !== 'mes' && !step
    ? (Object.entries(ds.region.heat) as [EvType, [number, number, number]][]).filter(([k]) => s.type === 'todos' || s.type === k)
      .map(([k, [x, y, r]]) => { const n = ev.filter(e => e.k === k && e.st !== 'prev').length; return n ? <Heat key={k} x={x} y={y} r={r} color={rgba(ds.types[k].c, 0.18 + n * 0.05)} /> : null })
    : null
  return (
    <div className="map" id="map" ref={m} style={{ backgroundImage: `url(${img})` }} onClick={() => s.sel && set({ sel: null })}>
      <MapBase bg={false} className="layer" style={{ position: 'absolute', inset: 0 }}>
        {heats}
      </MapBase>
      <button className="float prevtog" aria-pressed={s.prev} onClick={e => { e.stopPropagation(); set({ prev: !s.prev }) }}>
        <span className={cx('switch', s.prev && 'on')} aria-hidden="true" />{t('Mostrar previsões')}
      </button>
      <div className="float" id="srcWrap" style={{ left: '50%', top: 14, transform: 'translateX(-50%)', padding: '4px 4px 4px 10px', display: 'flex', gap: 8, alignItems: 'center', zIndex: 30 }} onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>{t('Dados')}</span>
        <div className="seg" id="srcSeg" role="group" aria-label={t('Fonte dos dados do mapa')} style={{ border: 0, padding: 0, background: 'transparent' }}>
          <button className={cx(!real && 'on')} aria-pressed={!real} onClick={() => setSrc('demo')}>{t('Exemplo')}</button>
          <button className={cx(real && 'on')} aria-pressed={real} onClick={() => setSrc('real')}>{t('NISAR real')}</button>
        </div>
      </div>
      {real && (
        <div className="float" id="srcBadge" style={{ left: '50%', top: 62, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 10px', whiteSpace: 'nowrap', zIndex: 3 }} onClick={e => e.stopPropagation()}>
          <span className="dot" style={{ background: 'var(--acc)' }} /><b style={{ fontWeight: 600 }}>{t('Radar NISAR real')}</b>
          {t(step ? `· ${fmtDate(step.date)} · rio Madeira (AM) · NASA-ISRO / ASF DAAC` : `· ${ds.rd.a} → ${ds.rd.b} ${ds.rd.y} · rio Madeira (AM) · NASA-ISRO / ASF DAAC`)}
        </div>
      )}
      <div className="mctl" onClick={e => e.stopPropagation()}>
        <div className="grp"><button aria-label={t('Aproximar')}><Icon k="mais" size={16} /></button><button aria-label={t('Afastar')}><Icon k="menos" size={16} /></button></div>
        <button className="one" aria-label={t('Centralizar')}><Icon k="alvo" size={16} /></button>
        <button className="one" aria-label={t('Camadas')}><Icon k="camadas" size={16} /></button>
      </div>
      {ev.map(e => {
        const c = mc(e)
        if (e.st === 'cl') return <button key={e.id} className="mk cl" style={{ ...pos(e.x, e.y), background: c }} aria-label={t(`${e.n} focos de ${ds.types[e.k].s.toLowerCase()} perto de ${e.pl}`)}>{e.n}</button>
        return (
          <button key={e.id} className={cx('mk', e.st, s.sel === e.id && 'sel')} data-id={e.id}
            style={{ ...pos(e.x, e.y), ...(e.st === 'obs' ? { background: c, color: '#FFFFFF' } : { color: c }), boxShadow: s.sel === e.id ? '' : `0 0 12px ${rgba(c, 0.5)}` }}
            aria-label={t(`${e.st === 'prev' ? 'Previsão' : ds.types[e.k].s} em ${e.pl}`)}
            onClick={ev2 => { ev2.stopPropagation(); set({ sel: e.id }) }}>
            <Icon k={ds.types[e.k].ic} size={14} />
          </button>
        )
      })}
      <Pin />
      <Legend />
      <div className="scale">{real ? '37 km' : '350 km'}<i /></div>
      <div className="attr">{t(real ? `Radar NISAR GCOV banda L · ${step ? fmtDate(step.date) : `${ds.rd.b} ${ds.rd.y}`} · NASA-ISRO / ASF DAAC` : 'Dados ilustrativos · base Natural Earth · radar NISAR')}</div>
      <div className="empty" style={{ display: ev.length ? 'none' : 'flex' }}><div>{t('Nenhum foco desse tipo no período.')}<br />{t('Tente um período maior.')}</div></div>
      {sel && size.w > 0 && <Popup e={sel} W={size.w} H={size.h} />}
    </div>
  )
}

/** Pino do lugar buscado na lupa */
function Pin() {
  const { s, set, t, ds } = useApp()
  if (!s.pin) return null
  const b = s.src === 'real' ? ds.real.meta.imagem : ds.region.bounds
  if (!dentro(b, s.pin.lon, s.pin.lat)) return null
  const { x, y } = projetar(b, s.pin.lon, s.pin.lat)
  return (
    <div className="pointer-events-none absolute z-[6]" style={{ ...pos(x, y), transform: 'translate(-50%,-100%)' }}>
      <div className="pointer-events-auto mb-1 flex items-center gap-2 whitespace-nowrap rounded-md bg-white px-2.5 py-1.5 text-[12px] font-extrabold text-[#0F2A44] shadow-[0_6px_16px_rgba(0,0,0,.35)]">
        {s.pin.label}
        <button aria-label={t('Fechar')} className="text-[var(--mu)]" onClick={e => { e.stopPropagation(); set({ pin: null }) }}>✕</button>
      </div>
      <svg width="34" height="44" viewBox="0 0 34 44" className="mx-auto block drop-shadow-[0_4px_6px_rgba(0,0,0,.45)]" aria-hidden="true">
        <path d="M17 43s14-14.6 14-25.5A14 14 0 0 0 3 17.5C3 28.4 17 43 17 43z" fill="#E03131" stroke="#fff" strokeWidth="2.5" />
        <circle cx="17" cy="17" r="5.5" fill="#fff" />
      </svg>
      <span className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 animate-ping rounded-full bg-[#E03131]/60" />
    </div>
  )
}

function Legend() {
  const { s, t, ds, inRange } = useApp()
  const [open, setOpen] = useState(false)
  const real = s.src === 'real'
  let body
  if (real && s.colorBy !== 'mes') {
    body = <><b>{t('Legenda')}</b>{(['agua', 'arvore', 'solo'] as const).map(k => <span key={k}><Icon k={k} size={14} />{t(REAL_NAMES[k])}</span>)}<span style={{ color: 'var(--mu)' }}>{t(`Mudança entre ${ds.rd.a} e ${ds.rd.b}`)}</span></>
  } else if (s.colorBy === 'mes') {
    const used = new Set(ds.ev.filter(e => e.st !== 'prev' && inRange(e.d)).map(e => evMonth(e.d)[0]))
    body = <><b>{t('Mês da detecção')}</b>{MES.map(m => <span key={m[0]} style={{ opacity: used.has(m[0]) ? 1 : 0.35 }}><i className="dot" style={{ background: m[3], width: 10, height: 10 }} />{t(`${m[1]} 2026`)}</span>)}<span style={{ color: 'var(--mu)' }}>{t('O ícone continua mostrando o tipo')}</span></>
  } else {
    body = <><b>{t('Legenda')}</b>{(['fogo', 'agua', 'arvore', 'solo'] as const).map(k => <span key={k}><Icon k={k} size={14} />{t(ds.types[k].s)}</span>)}<span><i className="dot" style={{ width: 14, height: 14, border: '1.5px dashed #5F6670', margin: '0 4px' }} />{t('Previsão (alerta)')}</span></>
  }
  return <div className={cx('float legend', open && 'open')} onClick={e => { e.stopPropagation(); setOpen(!open) }}>{body}</div>
}

function Popup({ e, W, H }: { e: Ev; W: number; H: number }) {
  const { s, set, t, ds, go } = useApp()
  const real = s.src === 'real'
  const c = ds.types[e.k].c
  const inf: Info = ds.info[e.id] ?? {
    t: e.pl, sub: e.st === 'prev' ? 'Previsão para os próximos dias' : 'Foco detectado pelo radar', m: e.st === 'prev' ? 'Risco em análise' : `${e.n * 4} km²`,
    d: e.st === 'prev' ? '' : '▲ vs. anterior', g: e.st === 'prev' ? 50 : 40 + e.n, st: e.st === 'prev' ? 'Previsto' : 'Observado',
    why: e.st === 'prev' ? 'Combinação de dados do radar e do tempo indica possibilidade do evento. Veja o alerta ao lado.' : `O radar detectou ${ds.types[e.k].s.toLowerCase()} nesta área no período escolhido.`,
  }
  const px = (e.x / MAP_W) * W, py = (e.y / MAP_H) * H
  const left = px > W * 0.55 ? px - 26 - 276 : px + 26
  const top = Math.max(12, Math.min(H - 330, py - 150))
  const before = real ? (e.date ? ds.timeline.find(p => p.date === e.date)?.vs ?? ds.rd.a : ds.rd.a) : s.preset === '7d' ? '27 out' : '11 set'
  const after = real ? e.date ?? ds.rd.b : '10 nov'
  return (
    <div className="pop" role="dialog" aria-label={t('Detalhe do foco')} style={{ left, top }} onClick={ev => ev.stopPropagation()}>
      <button className="x" aria-label={t('Fechar detalhe')} onClick={() => set({ sel: null })}><Icon k="x" size={14} /></button>
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="tag" style={{ background: rgba(c, 0.14), color: c }}>{t(ds.types[e.k].s)}</span>
        <span className="tag" style={{ background: 'rgba(251,191,36,.14)', color: '#F29900' }}>{t(inf.st)}</span>
      </div>
      <div><h3>{t(inf.t)}</h3><div className="sub">{t(inf.sub)}</div></div>
      <div className="metric"><b>{t(inf.m)}</b><span style={{ color: 'var(--red2)', fontSize: 12, fontWeight: 500 }}>{t(inf.d)}</span></div>
      {e.st !== 'prev' && (
        <div className="ba">
          <span><div style={{ background: 'linear-gradient(120deg,#EEF1F4,#C9D8E8 55%,#EEF1F4)' }} />{t(`Antes · ${before}`)}</span>
          <span><div style={{ background: `linear-gradient(120deg,#EEF1F4,${rgba(c, 0.55)} 55%,#EEF1F4)` }} />{t(`Depois · ${after}`)}</span>
        </div>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
          <span style={{ color: 'var(--mu)', display: 'flex', gap: 6, alignItems: 'center' }}>{t('Grau de mudança')}
            <span className="help" tabIndex={0} data-tip={t('Escala de 0 a 100 que compara os dois períodos. Acima de 50 é uma mudança alta.')}>?</span></span>
          <b style={{ color: 'var(--red2)' }}>{t(`${lvlOf(inf.g)} · ${inf.g}/100`)}</b>
        </div>
        <div className="gbar"><i style={{ width: `${inf.g}%` }} /></div>
      </div>
      <div className="why"><b>{t('O que isso significa?')}</b>{t(inf.why)}</div>
      <div className="btns"><button className="btn pri" onClick={() => go('comparar')}>{t('Comparar períodos')}</button><button className="btn">{t('Compartilhar')}</button></div>
    </div>
  )
}
