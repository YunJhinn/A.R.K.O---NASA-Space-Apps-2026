import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { MES, MAP_H, MAP_W } from '../../lib/demo'
import type { Ev, EvType, Info } from '../../lib/types'
import { cx, evMonth, lvlOf, pos, rgba } from '../../lib/util'
import { REAL_NAMES } from '../../lib/real'
import { Icon } from '../Icon'
import { Heat, MapBase } from '../MapBase'
import { RealBackdrop, realBase } from '../RealBackdrop'
import { Timeline } from './Timeline'
import { useFocus } from '../../lib/useFocus'
import { fmtDate } from '../../lib/i18n'
import { dentro, projetar } from '../../lib/regions'
import { SciButtons } from '../SciModal'
import { L as LL, POL, worldviewUrl, type Lang } from '../../lib/science'
import { RULE, factor, focusEvidence, physics } from '../../lib/evidence'
import { focusHypothesis } from '../../lib/hypotheses'
import '../../styles/map-extra.css'

/** Escala aproximada: a barra da escala tem ~1/10 da largura do mapa */
const scaleKm = (b: { oeste: number; leste: number; norte: number; sul: number }) => {
  const km = (b.leste - b.oeste) * 111.32 * Math.cos((((b.norte + b.sul) / 2) * Math.PI) / 180) / 10
  const nice = km > 30 ? Math.round(km / 10) * 10 : Math.round(km)
  return `${nice} km`
}

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
        <div style={{ flex: 1 }}><h2>{t('Mapa de mudanças')}</h2><p>{t(sub)}</p><div style={{ marginTop: 8 }}><SciButtons kind={s.type} compact /></div></div>
        <div className="seg" role="group" aria-label={t('Camada')}>
          {s.src === 'real' && realBase(ds.realMeta.id)
            ? <><button className={cx(!s.radar && 'on')} aria-pressed={!s.radar} onClick={() => set({ radar: false })}>{t('Mapa')}</button><button className={cx(s.radar && 'on')} aria-pressed={s.radar} onClick={() => set({ radar: true })}>{t('Radar')}</button></>
            : <><button className="on">{t('Radar')}</button><button>{t('Satélite óptico')}</button></>}<button onClick={() => go('comparar')}>{t('Antes / depois')}</button>
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
  const en = s.lang === 'en'
  const { img, step } = useFocus()
  const m = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // zoom e arraste: z = escala, tx/ty = deslocamento (px) do palco
  const [view, setView] = useState({ z: 1, tx: 0, ty: 0 })
  const [full, setFull] = useState(false)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  useLayoutEffect(() => {
    const el = m.current; if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { set({ sel: null }); if (full && !document.fullscreenElement) setFull(false) } }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  }, [set, full])
  // tela cheia (API do navegador; se não houver, usa modo fixo por CSS)
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === m.current)
    document.addEventListener('fullscreenchange', on); return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  useEffect(() => { document.body.style.overflow = full ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [full])
  const enterFull = () => {
    const el = m.current
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => setFull(true))
    else setFull(true)
  }
  const exitFull = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setFull(false) }

  // palco: mantém a proporção do mapa (746:508) e centraliza
  const ar = MAP_W / MAP_H
  const sw = size.w && size.h ? Math.min(size.w, size.h * ar) : size.w
  const sh = sw / ar
  const ox = (size.w - sw) / 2, oy = (size.h - sh) / 2
  const clamp = (z: number, tx: number, ty: number) => ({ z, tx: Math.min(0, Math.max(sw - sw * z, tx)), ty: Math.min(0, Math.max(sh - sh * z, ty)) })
  const zoomAt = (z2: number, cx = sw / 2, cy = sh / 2) => setView(v => {
    const z = Math.min(6, Math.max(1, z2))
    return clamp(z, cx - (cx - v.tx) * (z / v.z), cy - (cy - v.ty) * (z / v.z))
  })
  useEffect(() => { setView(v => clamp(v.z, v.tx, v.ty)) }, [sw, sh]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setView({ z: 1, tx: 0, ty: 0 }) }, [ds.realMeta.id, s.src, s.region])
  const onWheel = (e: React.WheelEvent) => {
    if (!full && !e.ctrlKey) return // fora da tela cheia, só com Ctrl (não atrapalha a rolagem da página)
    e.preventDefault()
    const r = m.current!.getBoundingClientRect()
    zoomAt(view.z * (e.deltaY < 0 ? 1.25 : 0.8), e.clientX - r.left - ox, e.clientY - r.top - oy)
  }
  useEffect(() => {
    const el = m.current; if (!el) return
    const stop = (e: WheelEvent) => { if (full || e.ctrlKey) e.preventDefault() }
    el.addEventListener('wheel', stop, { passive: false }); return () => el.removeEventListener('wheel', stop)
  }, [full])
  const onDown = (e: React.PointerEvent) => {
    if (view.z <= 1 || (e.target as HTMLElement).closest('button,a,input,select,.float,.mctl,.pop,.legend')) return
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    setView(v => clamp(v.z, d.tx + dx, d.ty + dy))
  }
  const onUp = () => { setTimeout(() => { drag.current = null }, 0) }

  const mc = (e: Ev) => (s.colorBy === 'mes' && e.st !== 'prev' ? evMonth(e.d)[3] : ds.types[e.k].c)
  const sel = ev.find(e => e.id === s.sel)
  const heats = !real && s.colorBy !== 'mes' && !step
    ? (Object.entries(ds.region.heat) as [EvType, [number, number, number]][]).filter(([k]) => s.type === 'todos' || s.type === k)
      .map(([k, [x, y, r]]) => { const n = ev.filter(e => e.k === k && e.st !== 'prev').length; return n ? <Heat key={k} x={x} y={y} r={r} color={rgba(ds.types[k].c, 0.18 + n * 0.05)} /> : null })
    : null
  const drawn = real && realBase(ds.realMeta.id)
  const stage: CSSProperties = {
    position: 'absolute', left: ox, top: oy, width: sw, height: sh, transformOrigin: '0 0',
    transform: `translate(${view.tx}px,${view.ty}px) scale(${view.z})`, transition: drag.current ? 'none' : 'transform .25s ease',
    ['--iz' as string]: 1 / view.z, cursor: view.z > 1 ? (drag.current ? 'grabbing' : 'grab') : undefined,
    backgroundImage: drawn ? 'none' : `url(${img})`, backgroundSize: '100% 100%',
  }
  return (
    <div className={cx('map', full && 'mapfull')} id="map" ref={m} onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      onClick={() => { if (drag.current?.moved) return; if (s.sel) set({ sel: null }) }}>
      <div className="stage" style={stage}>
        {drawn && <RealBackdrop img={img} />}
        <MapBase bg={false} className="layer" style={{ position: 'absolute', inset: 0 }}>
          {heats}
        </MapBase>
        {ev.map(e => {
          const c = mc(e)
          if (e.st === 'cl') return <button key={e.id} className="mk cl" style={{ ...pos(e.x, e.y), background: c }} aria-label={t(`${e.n} focos de ${ds.types[e.k].s.toLowerCase()} perto de ${e.pl}`)}>{e.n}</button>
          return (
            <button key={e.id} className={cx('mk', e.st, s.sel === e.id && 'sel')} data-id={e.id}
              style={{ ...pos(e.x, e.y), ...(e.st === 'obs' ? { background: c, color: '#FFFFFF' } : { color: c }), boxShadow: s.sel === e.id ? '' : `0 0 12px ${rgba(c, 0.5)}` }}
              aria-label={t(`${e.st === 'prev' ? 'Previsão' : ds.types[e.k].s} em ${e.pl}`)}
              onClick={ev2 => { ev2.stopPropagation(); if (!drag.current?.moved) set({ sel: e.id }) }}>
              <Icon k={ds.types[e.k].ic} size={14} />
            </button>
          )
        })}
        <Pin />
      </div>
      {full && (
        <button className="float mapback" onClick={e => { e.stopPropagation(); exitFull() }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          {en ? 'Back' : 'Voltar'}
        </button>
      )}
      <button className="float prevtog" style={full ? { top: 66 } : undefined} aria-pressed={s.prev} onClick={e => { e.stopPropagation(); set({ prev: !s.prev }) }}>
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
          · {step ? fmtDate(step.date) : t(`${ds.rd.a} → ${ds.rd.b} ${ds.rd.y}`)} · {t(ds.realMeta.nome)} · NASA-ISRO / ASF DAAC
        </div>
      )}
      <div className="mctl" onClick={e => e.stopPropagation()}>
        <div className="grp">
          <button aria-label={t('Aproximar')} title={en ? 'Zoom in' : 'Aproximar'} disabled={view.z >= 6} onClick={() => zoomAt(view.z * 1.5)}><Icon k="mais" size={16} /></button>
          <button aria-label={t('Afastar')} title={en ? 'Zoom out' : 'Afastar'} disabled={view.z <= 1} onClick={() => zoomAt(view.z / 1.5)}><Icon k="menos" size={16} /></button>
        </div>
        <button className="one" aria-label={t('Centralizar')} title={en ? 'Reset view' : 'Voltar ao mapa inteiro'} onClick={() => setView({ z: 1, tx: 0, ty: 0 })}><Icon k="alvo" size={16} /></button>
        <button className="one" aria-label={t('Camadas')} aria-pressed={s.radar} title={t(s.radar ? 'Esconder o radar' : 'Mostrar o radar')} onClick={() => set({ radar: !s.radar })}><Icon k="camadas" size={16} /></button>
        <button className="one" aria-label={full ? (en ? 'Exit full screen' : 'Sair da tela cheia') : (en ? 'Full screen' : 'Tela cheia')} title={full ? (en ? 'Exit full screen' : 'Sair da tela cheia') : (en ? 'Full screen' : 'Tela cheia')} onClick={() => (full ? exitFull() : enterFull())}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {full ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
          </svg>
        </button>
      </div>
      {view.z > 1 && <div className="float zoomhint">{en ? `Zoom ${view.z.toFixed(1)}× · drag to move` : `Zoom ${view.z.toFixed(1).replace('.', ',')}× · arraste para mover`}</div>}
      <Legend />
      <div className="scale">{real ? scaleKm(ds.realMeta.imagem) : '350 km'}<i /></div>
      <div className="attr">{t(real ? `Radar NISAR GCOV banda L · ${step ? fmtDate(step.date) : `${ds.rd.b} ${ds.rd.y}`} · NASA-ISRO / ASF DAAC` : 'Dados ilustrativos · base Natural Earth · radar NISAR')}</div>
      <div className="empty" style={{ display: ev.length ? 'none' : 'flex' }}><div>{t('Nenhum foco desse tipo no período.')}<br />{t('Tente um período maior.')}</div></div>
      {sel && size.w > 0 && <Popup e={sel} W={size.w} H={size.h} px={ox + view.tx + (sel.x / MAP_W) * sw * view.z} py={oy + view.ty + (sel.y / MAP_H) * sh * view.z} />}
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
    <div id="pinmark" className="pointer-events-none absolute z-[6]" style={{ ...pos(x, y), transform: 'translate(-50%,-100%)' }}>
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

function Popup({ e, W, H, px, py }: { e: Ev; W: number; H: number; px: number; py: number }) {
  const { s, set, t, ds, go } = useApp()
  const real = s.src === 'real'
  const c = ds.types[e.k].c
  const [more, setMore] = useState<'causas' | 'pol' | null>(null)
  const lang = s.lang as Lang, en = lang === 'en'
  const evd = real ? focusEvidence(e, ds.timeline, { vs: ds.real.meta.antes.data, date: ds.real.meta.depois.data }, lang) : null
  const phy = physics(e.k, lang)
  const fh = evd ? focusHypothesis(e.k, evd, e.a, ds.realMeta.id, lang) : null
  const n1 = (x: number) => (en ? x.toFixed(1) : x.toFixed(1).replace('.', ','))
  const pol = POL[e.k]
  const inf: Info = ds.info[e.id] ?? {
    t: e.pl, sub: e.st === 'prev' ? 'Previsão para os próximos dias' : 'Foco detectado pelo radar', m: e.st === 'prev' ? 'Risco em análise' : `${e.n * 4} km²`,
    d: e.st === 'prev' ? '' : '▲ vs. anterior', g: e.st === 'prev' ? 50 : 40 + e.n, st: e.st === 'prev' ? 'Previsto' : 'Observado',
    why: e.st === 'prev' ? 'Combinação de dados do radar e do tempo indica possibilidade do evento. Veja o alerta ao lado.' : `O radar detectou ${ds.types[e.k].s.toLowerCase()} nesta área no período escolhido.`,
  }
  const box = useRef<HTMLDivElement>(null)
  const [ph, setPh] = useState(330)
  useLayoutEffect(() => { if (box.current) setPh(box.current.offsetHeight) })
  const PW = Math.min(276, W - 24)
  const maxH = H - 24
  const hh = Math.min(ph, maxH)
  let left = px > W * 0.55 ? px - 26 - PW : px + 26
  left = Math.max(12, Math.min(W - PW - 12, left))
  const top = Math.max(12, Math.min(H - hh - 12, py - hh / 2))
  const before = real ? (e.date ? ds.timeline.find(p => p.date === e.date)?.vs ?? ds.rd.a : ds.rd.a) : s.preset === '7d' ? '27 out' : '11 set'
  const after = real ? e.date ?? ds.rd.b : '10 nov'
  return (
    <div className="pop" ref={box} role="dialog" aria-label={t('Detalhe do foco')} style={{ left, top, width: PW, maxHeight: maxH, overflowY: 'auto' }} onClick={ev => ev.stopPropagation()} onPointerDown={ev => ev.stopPropagation()} onWheel={ev => ev.stopPropagation()}>
      <button className="x" aria-label={t('Fechar detalhe')} onClick={() => set({ sel: null })}><Icon k="x" size={14} /></button>
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="tag" style={{ background: rgba(c, 0.14), color: c }}>{t(ds.types[e.k].s)}</span>
        <span className="tag" style={{ background: 'rgba(251,191,36,.14)', color: '#F29900' }}>{t(inf.st)}</span>
      </div>
      <div><h3>{t(inf.t)}</h3><div className="sub">{t(inf.sub)}</div></div>
      <div className="metric"><b>{t(inf.m)}</b><span style={{ color: 'var(--red2)', fontSize: 12, fontWeight: 500 }}>{t(inf.d)}</span></div>
      {e.st !== 'prev' && maxH >= 470 && (
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
      {e.st !== 'prev' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={cx('btn', more === 'causas' && 'pri')} style={{ flex: 1, fontSize: 12, padding: '7px 6px' }} aria-expanded={more === 'causas'} onClick={() => setMore(more === 'causas' ? null : 'causas')}>🔎 {en ? 'Likely causes' : 'Causas prováveis'}</button>
          <button className={cx('btn', more === 'pol' && 'pri')} style={{ flex: 1, fontSize: 12, padding: '7px 6px' }} aria-expanded={more === 'pol'} onClick={() => setMore(more === 'pol' ? null : 'pol')}>📡 {en ? 'Polarization' : 'Polarização'}</button>
        </div>
      )}
      {more === 'causas' && (
        <div style={{ background: '#EAF2FF', border: '1px solid #BCD3F7', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
          {fh && (
            <div style={{ background: '#FFF8EB', border: '1px solid #F5D58A', borderRadius: 8, padding: '7px 9px', marginBottom: 6 }}>
              <b style={{ color: '#B45309' }}>🧪 {en ? 'Hypothesis for this focus: ' : 'Hipótese para este foco: '}</b>{fh.text}
              {fh.why.length > 0 && <div style={{ marginTop: 3 }}><b style={{ fontSize: 11.5 }}>{en ? 'Based on:' : 'Com base em:'}</b>{fh.why.map(w => <div key={w} style={{ display: 'flex', gap: 5, fontSize: 11.5 }}><span style={{ color: '#B45309', fontWeight: 800 }}>›</span><span>{w}</span></div>)}</div>}
              <div style={{ color: '#5B6B7F', fontSize: 11, marginTop: 3 }}>{en ? 'A hypothesis, not a conclusion: confirm in the optical image below.' : 'É hipótese, não conclusão: confirme na imagem óptica abaixo.'}</div>
            </div>
          )}
          {evd ? (
            <>
              <div style={{ background: '#fff', borderRadius: 8, padding: '7px 9px', marginBottom: 6 }}><b>💬 {en ? 'In plain words: ' : 'Em palavras simples: '}</b>{evd.plain}</div>
              <b style={{ display: 'block', marginBottom: 3 }}>{en ? 'What the radar measured here (scientific data)' : 'O que o radar mediu aqui (dados científicos)'}</b>
              {evd.measured.map(x => <div key={x} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: '#2563EB', fontWeight: 800 }}>›</span><span>{x}</span></div>)}
              <b style={{ display: 'block', margin: '6px 0 3px' }}>{en ? 'Same spot in other passes (≤ 2 km)' : 'Mesmo lugar em outras passagens (≤ 2 km)'}</b>
              {evd.spot.map(x => <div key={x} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: '#2563EB', fontWeight: 800 }}>›</span><span>{x}</span></div>)}
              {evd.reading && <div style={{ marginTop: 3 }}><b>{en ? 'From the data: ' : 'Pelos dados: '}</b>{evd.reading}</div>}
            </>
          ) : (
            <div style={{ marginBottom: 4 }}>{real ? (en ? 'This type is not measured by the radar.' : 'Este tipo não é medido pelo radar.') : (en ? 'Example mode: simulated data, no real measurement. Below is only the radar physics.' : 'Modo Exemplo: dados simulados, sem medição real. Abaixo está só a física do radar.')}</div>
          )}
          {phy && (
            <>
              <b style={{ display: 'block', margin: '6px 0 3px' }}>{en ? 'What can produce this signal' : 'O que pode gerar esse sinal'}</b>
              {phy.could.map(h => <div key={h} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: '#2563EB', fontWeight: 800 }}>›</span><span>{h}</span></div>)}
              <div style={{ color: '#5B6B7F', marginTop: 4 }}>{phy.notRadar}</div>
            </>
          )}
          {real && <a href={worldviewUrl(ds.realMeta.imagem, e.date ?? ds.timeline.at(-1)?.date)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6, fontWeight: 800, color: '#2563EB' }}>{en ? 'Check which one in the optical image (NASA Worldview) ↗' : 'Conferir qual foi na imagem óptica (NASA Worldview) ↗'}</a>}
        </div>
      )}
      {more === 'pol' && pol && (
        <div style={{ background: '#F3F5F8', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.45 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: pol.pol === 'HH' ? '#1C7ED6' : '#2F9E44', color: '#fff', fontWeight: 800, borderRadius: 6, padding: '2px 8px' }}>{pol.pol}</span>
            <b>{LL(lang, pol.what as [string, string])}</b>
          </div>
          {pol.pol === 'HH'
            ? <span>{en ? 'HH = sends and receives horizontal. Still water reflects like a mirror and returns little signal, so new water makes HH drop; when water leaves, HH rises again.' : 'HH = envia e recebe na horizontal. Água parada reflete como espelho e devolve pouco sinal: água nova faz o HH cair; quando a água sai, o HH volta a subir.'}</span>
            : pol.pol === 'HV' ? <span>{en ? 'HV = sends horizontal, receives vertical. Mostly branches and leaves “rotate” the wave, so HV measures vegetation volume: less vegetation, lower HV.' : 'HV = envia na horizontal e recebe na vertical. Principalmente galhos e folhas “giram” a onda, então o HV mede o volume da vegetação: menos vegetação, HV mais baixo.'}</span>
            : <span>{en ? 'This type comes from weather data, not radar.' : 'Este tipo vem de dados do tempo, não do radar.'}</span>}
          {evd && <div style={{ marginTop: 6, background: '#fff', borderRadius: 8, padding: '7px 9px' }}><b>💬 {en ? 'In plain words: ' : 'Em palavras simples: '}</b>{evd.plainPol}</div>}
          {real && e.db != null && (e.k === 'agua' || e.k === 'solo' || e.k === 'arvore') && (
            <div style={{ marginTop: 6, background: '#fff', borderRadius: 8, padding: '6px 8px' }}>
              <b>{en ? 'In this focus: ' : 'Neste foco: '}</b>
              {en ? `${pol.pol} ${e.k === 'solo' ? 'rose' : 'dropped'} ${n1(e.db)} dB (echo ${n1(factor(e.db))}× ${e.k === 'solo' ? 'stronger' : 'weaker'}). Rule: ${RULE[e.k][1]}.` : `${pol.pol} ${e.k === 'solo' ? 'subiu' : 'caiu'} ${n1(e.db)} dB (eco ${n1(factor(e.db))}× ${e.k === 'solo' ? 'mais forte' : 'mais fraco'}). Regra: ${RULE[e.k][0]}.`}
              {e.hh && <div>HH: {n1(e.hh[0])} → {n1(e.hh[1])} dB</div>}
              {e.hv && <div>HV: {n1(e.hv[0])} → {n1(e.hv[1])} dB</div>}
            </div>
          )}
        </div>
      )}
      <div className="btns"><button className="btn pri" onClick={() => go('comparar')}>{t('Comparar períodos')}</button><button className="btn">{t('Compartilhar')}</button></div>
    </div>
  )
}
