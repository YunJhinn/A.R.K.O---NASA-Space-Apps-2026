import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { MES, MAP_H, MAP_W } from '../../lib/demo'
import type { Ev, EvType, Info } from '../../lib/types'
import { cx, evMonth, kmf, lvlOf, pos, rgba } from '../../lib/util'
import { REAL_NAMES, projector } from '../../lib/real'
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
import { fogoResumo, pequena } from '../../lib/riscos'
import { recomendacao } from '../../lib/acao'
import { fichaFogo, fichaLhasa, fichaMontanha, fichaPrevisao, type Ficha } from '../../lib/detalhe'
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
    ? (step ? `${counts.todos} ${counts.todos === 1 ? 'foco real' : 'focos reais'} do NISAR · ${step.label} · clique em um foco para ver o que mudou` : `${counts.todos} ${counts.todos === 1 ? 'foco real' : 'focos reais'} do NISAR (${ds.rd.a} → ${ds.rd.b}) · clique em um foco para ver o que mudou`)
    : step ? `${counts.todos} focos detectados · ${step.label} · clique em um foco para ver o que mudou` : `${counts.todos} focos detectados em ${periodLabel()} · clique em um foco para ver o que mudou`
  const demoKpi = (k: string) => { const r = ds.region.kpi[s.preset].find(x => x[0] === k); return r ? { v: r[2], d: r[3].startsWith('—') ? '' : r[3].split(' ')[0] + ' ' + (r[3].split(' ')[1] ?? '') } : null }
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (s.focus === 'map') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [s.focus])
  return (
    <div className="card panel" id="mapPanel" ref={ref}>
      <div className="ph ph2">
        <div className="ttl"><h2>{t('Mudanças no rio e nas margens')}</h2><p>{t(sub)}</p></div>
        <div className="act">
          <SciButtons kind={s.type} compact />
          <div className="seg" role="group" aria-label={t('Colorir focos por')} title={t('Colorir por')}>
            {(['tipo', 'mes'] as const).map(c => <button key={c} className={cx(s.colorBy === c && 'on')} aria-pressed={s.colorBy === c} onClick={() => set({ colorBy: c })}>{t(c === 'tipo' ? 'Tipo' : 'Mês')}</button>)}
          </div>
          <div className="seg" role="group" aria-label={t('Camada')}>
            {s.src === 'real' && realBase(ds.realMeta.id)
              ? <><button className={cx(!s.radar && 'on')} aria-pressed={!s.radar} onClick={() => set({ radar: false })}>{t('Mapa')}</button><button className={cx(s.radar && 'on')} aria-pressed={s.radar} onClick={() => set({ radar: true })}>{t('Radar')}</button></>
              : <button className="on">{t('Radar')}</button>}<button onClick={() => go('comparar')}>{t('Antes / depois')}</button>
          </div>
        </div>
      </div>
      <div className="chiprow">
        <div className="chips chips2" role="group" aria-label={t('Filtrar por tipo de evento')}>
          {(['todos', 'fogo', 'agua', 'arvore', 'solo'] as const).filter(k => !(real && k === 'fogo' && !ds.riscos?.fogo)).map(k => {
            const on = s.type === k, col = k === 'todos' ? '#5F6670' : ds.types[k].c
            const kv = k === 'todos' ? null : real && k === 'fogo' ? { v: `${fogoResumo(ds.riscos!.fogo).risco.length} ${s.lang === 'en' ? 'risky' : 'de risco'}`, d: '' } : real ? { v: kmf(base.filter(e => e.k === k).reduce((a, e) => a + (e.a ?? 0), 0)), d: '' } : demoKpi(k)
            return (
              <button key={k} className={cx('chip', on && 'on', k === 'todos' && 'all')} aria-pressed={on} style={{ '--c': col, opacity: !on && kv && /^0([.,]0+)?( |$)/.test(kv.v) ? 0.5 : 1 } as CSSProperties} onClick={() => set({ type: k })}
                title={k === 'todos' ? undefined : t(`${counts[k] ?? 0} focos`)}>
                <span style={{ color: col, display: 'flex' }}><Icon k={k === 'todos' ? 'todos' : ds.types[k].ic} size={15} /></span>
                {t(k === 'todos' ? 'Todos' : ds.types[k].n)}
                {kv ? <><span className="v">{t(kv.v)}</span>{kv.d && <span className="dl">{t(kv.d)}</span>}</> : <span className="n">{counts.todos}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <ChangeMap ev={vis} />
      <Timeline />
    </div>
  )
}

function ChangeMap({ ev }: { ev: Ev[] }) {
  const { s, set, t, ds } = useApp()
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
  // pontos de risco (previsões, montanha, LHASA, FIRMS): cada um abre uma ficha com Resumo, Dados e Polarização
  const riskMk = (() => {
    if (!real) return []
    const pj = projector(ds.realMeta.imagem), r = ds.riscos, mt = ds.real.meta.montanha ?? []
    const mk: { id: string; lon: number; lat: number; ic: string; col: string; lbl: string; prev?: boolean; baixo?: boolean; x: number; y: number }[] = []
    const todos = s.type === 'todos'
    const push = (m: Omit<(typeof mk)[number], 'x' | 'y'>) => mk.push({ ...m, x: pj.X(m.lon), y: pj.Y(m.lat) })
    ds.alerts.filter(al => al.id?.startsWith('p-') && al.lon != null && (todos || al.ty === s.type)).forEach(al => push({ id: al.id!, lon: al.lon!, lat: al.lat!, ic: al.ty, col: al.lvl === 'Alto' ? '#D92D20' : '#DC6803', lbl: `${en ? 'Forecast' : 'Previsão'}: ${t(al.t)}`, prev: true }))
    if (todos) mt.forEach((f, i) => push({ id: `m-${i}`, lon: f.lon, lat: f.lat, ic: f.tipo === 'gelo' ? 'geleira' : 'deslizamento', col: f.tipo === 'gelo' ? '#0284C7' : '#9A5B13',
      lbl: f.tipo === 'gelo' ? (en ? 'Ice/snow changing' : 'Gelo/neve mudando') : (en ? 'New material on slope' : 'Material novo na encosta') }))
    if (todos) r?.deslizamento?.areas.forEach((a, i) => push({ id: `r-d-${i}`, lon: a.lon, lat: a.lat, ic: 'deslizamento', col: '#9A5B13', baixo: a.nivel === 'Baixo', lbl: `${en ? 'Landslide danger' : 'Perigo de deslizamento'} · ${(a.p * 100).toFixed(1)}%` }))
    if (todos || s.type === 'fogo') r?.fogo?.grupos.forEach((g, i) => { const pq = pequena(g); push({ id: `r-f-${i}`, lon: g.lon, lat: g.lat, ic: 'fogo', col: pq ? '#9AA0A8' : '#E2553A', baixo: pq, lbl: pq ? `${en ? 'Small burn' : 'Pequena queima'} · ${g.n} ${en ? 'spot(s)' : g.n === 1 ? 'foco' : 'focos'}` : `${en ? 'Risky fire' : 'Queimada de risco'} · ${g.n} ${en ? 'spots' : g.n === 1 ? 'foco' : 'focos'}` }) })
    return mk.filter(m => m.x >= 0 && m.x <= MAP_W && m.y >= 0 && m.y <= MAP_H)
  })()
  const selR = riskMk.find(m => m.id === s.sel)
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
        {real && ds.realMeta.evento && (() => {
          const ev0 = ds.realMeta.evento, pj = projector(ds.realMeta.imagem)
          return (
            <div className="pointer-events-none absolute z-[5]" style={{ ...pos(pj.X(ev0.lon), pj.Y(ev0.lat)), transform: 'translate(-50%,-50%) scale(var(--iz))' }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, border: '3px solid #FF3B30', background: 'rgba(255,59,48,.25)', boxShadow: '0 0 0 6px rgba(255,59,48,.18)' }} />
              <div style={{ position: 'absolute', left: 28, top: -4, whiteSpace: 'nowrap', background: '#FF3B30', color: '#fff', fontSize: 11.5, fontWeight: 800, borderRadius: 6, padding: '2px 7px' }}>
                ⚠ {ev0.tipo === 'enchente' ? (en ? `Flood · ${fmtDate(ev0.data)}` : `Enchente · ${fmtDate(ev0.data)}`) : (en ? `Collapse · ${fmtDate(ev0.data)}` : `Colapso · ${fmtDate(ev0.data)}`)}
              </div>
            </div>
          )
        })()}
        {riskMk.map(m => {
          const on = s.sel === m.id
          return (
            <button key={m.id} type="button" className="absolute z-[4]" aria-label={m.lbl} title={m.lbl}
              style={{ ...pos(m.x, m.y), transform: 'translate(-50%,-50%) scale(var(--iz))', width: m.prev ? 40 : m.baixo ? 26 : 34, height: m.prev ? 40 : m.baixo ? 26 : 34, zIndex: m.prev ? 6 : undefined, borderRadius: 99, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `${m.prev ? 3 : 2}px ${m.prev ? 'dashed' : 'solid'} ${m.col}`, background: 'rgba(255,255,255,.92)', opacity: m.baixo && !on ? 0.85 : 1, boxShadow: on ? `0 0 0 6px ${m.col}66` : `0 0 12px ${m.col}88`, cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); set({ sel: on ? null : m.id }) }}>
              <Icon k={m.ic} size={m.baixo ? 13 : 17} />
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
      {!real && (
        <button className="float prevtog" style={full ? { top: 66 } : undefined} aria-pressed={s.prev} onClick={e => { e.stopPropagation(); set({ prev: !s.prev }) }}>
          <span className={cx('switch', s.prev && 'on')} aria-hidden="true" />{t('Mostrar previsões')}
        </button>
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
      <div className="empty" style={{ display: ev.length || riskMk.length ? 'none' : 'flex' }}><div>{t('Nenhum foco desse tipo no período.')}<br />{t('Tente um período maior.')}</div></div>
      {sel && size.w > 0 && <Popup e={sel} W={size.w} H={size.h} px={ox + view.tx + (sel.x / MAP_W) * sw * view.z} py={oy + view.ty + (sel.y / MAP_H) * sh * view.z} />}
      {selR && size.w > 0 && <RiskPopup id={selR.id} W={size.w} H={size.h} px={ox + view.tx + (selR.x / MAP_W) * sw * view.z} py={oy + view.ty + (selR.y / MAP_H) * sh * view.z} />}
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
  const [tab, setTab] = useState<'resumo' | 'dados' | 'pol'>('resumo')
  const lang = s.lang as Lang, en = lang === 'en'
  const evd = real ? focusEvidence(e, ds.timeline, { vs: ds.real.meta.antes.data, date: ds.real.meta.depois.data }, lang) : null
  const phy = physics(e.k, lang)
  const fh = evd ? focusHypothesis(e.k, evd, e.a, ds.realMeta.id, lang, { lon: e.lon, lat: e.lat }, ds.realMeta.evento) : null
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
      {e.st !== 'prev' && (
        <div className="ptabs" role="tablist" aria-label={en ? 'Detail sections' : 'Seções do detalhe'}>
          {([['resumo', en ? 'Summary' : 'Resumo'], ['dados', en ? 'Data' : 'Dados'], ['pol', en ? 'Polarization' : 'Polarização']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={cx(tab === k && 'on')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      )}
      {(tab === 'resumo' || e.st === 'prev') && (
        <>
          {fh && (
            <div className="hyp"><b>🧪 {en ? 'Likely cause (hypothesis): ' : 'Causa provável (hipótese): '}</b>{fh.text}</div>
          )}
          <div className="why">{evd ? evd.plain : t(inf.why)}</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--mu)', display: 'flex', gap: 6, alignItems: 'center' }}>{t('Grau de mudança')}
                <span className="help" tabIndex={0} data-tip={t('Escala de 0 a 100 que compara os dois períodos. Acima de 50 é uma mudança alta.')}>?</span></span>
              <b style={{ color: 'var(--red2)' }}>{t(`${lvlOf(inf.g)} · ${inf.g}/100`)}</b>
            </div>
            <div className="gbar"><i style={{ width: `${inf.g}%` }} /></div>
          </div>
          {real && e.st !== 'prev' && <a className="plink" href={worldviewUrl(ds.realMeta.imagem, e.date ?? ds.timeline.at(-1)?.date)} target="_blank" rel="noreferrer">{en ? 'Confirm in the optical image (NASA Worldview) ↗' : 'Confirmar na imagem óptica (NASA Worldview) ↗'}</a>}
        </>
      )}
      {tab === 'dados' && e.st !== 'prev' && (
        <div className="pbody">
          {maxH >= 470 && (
            <div className="ba">
              <span><div style={{ background: 'linear-gradient(120deg,#EEF1F4,#C9D8E8 55%,#EEF1F4)' }} />{t(`Antes · ${before}`)}</span>
              <span><div style={{ background: `linear-gradient(120deg,#EEF1F4,${rgba(c, 0.55)} 55%,#EEF1F4)` }} />{t(`Depois · ${after}`)}</span>
            </div>
          )}
          {evd ? (
            <>
              <b>{en ? 'What the radar measured' : 'O que o radar mediu'}</b>
              {evd.measured.map(x => <div key={x} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span className="bul">›</span><span>{x}</span></div>)}
              {fh && fh.why.length > 0 && (<><b>{en ? 'Why this cause' : 'Por que essa causa'}</b>{fh.why.map(w => <div key={w} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span className="bul">›</span><span>{w}</span></div>)}</>)}
              <b>{en ? 'Same spot in other passes (≤ 2 km)' : 'Mesmo lugar em outras passagens (≤ 2 km)'}</b>
              {evd.spot.map(x => <div key={x} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span className="bul">›</span><span>{x}</span></div>)}
              {evd.reading && <div><b>{en ? 'From the data: ' : 'Pelos dados: '}</b>{evd.reading}</div>}
            </>
          ) : <div>{t(inf.why)}</div>}
          {phy && (
            <>
              <b>{en ? 'Other possible causes of this signal' : 'Outras causas possíveis desse sinal'}</b>
              {phy.could.map(h => <div key={h} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span className="bul">›</span><span>{h}</span></div>)}
              <div className="mut">{phy.notRadar}</div>
            </>
          )}
        </div>
      )}
      {tab === 'pol' && e.st !== 'prev' && pol && (
        <div className="pbody">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: pol.pol === 'HH' ? '#1C7ED6' : '#2F9E44', color: '#fff', fontWeight: 800, borderRadius: 6, padding: '2px 8px' }}>{pol.pol}</span>
            <b>{LL(lang, pol.what as [string, string])}</b>
          </div>
          <div>{evd ? evd.plainPol : pol.pol === 'HH'
            ? (en ? 'HH = sends and receives horizontal. Still water reflects like a mirror and returns little signal, so new water makes HH drop; when water leaves, HH rises again.' : 'HH = envia e recebe na horizontal. Água parada reflete como espelho e devolve pouco sinal: água nova faz o HH cair; quando a água sai, o HH volta a subir.')
            : pol.pol === 'HV' ? (en ? 'HV = sends horizontal, receives vertical. Mostly branches and leaves “rotate” the wave, so HV measures vegetation volume: less vegetation, lower HV.' : 'HV = envia na horizontal e recebe na vertical. Principalmente galhos e folhas “giram” a onda, então o HV mede o volume da vegetação: menos vegetação, HV mais baixo.')
            : (en ? 'This type comes from weather data, not radar.' : 'Este tipo vem de dados do tempo, não do radar.')}</div>
          {real && e.db != null && (e.k === 'agua' || e.k === 'solo' || e.k === 'arvore') && (
            <div className="mut">
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

/** Ficha de um ponto de risco: mesmo formato do card dos focos do radar */
function RiskPopup({ id, W, H, px, py }: { id: string; W: number; H: number; px: number; py: number }) {
  const { s, set, t, ds, go } = useApp()
  const en = s.lang === 'en'
  const [tab, setTab] = useState<'resumo' | 'dados' | 'pol'>('resumo')
  useEffect(() => setTab('resumo'), [id])
  const ctx = { region: ds.realMeta.id, timeline: ds.timeline, riscos: ds.riscos, montanha: ds.real.meta.montanha, lang: s.lang }
  const al = ds.alerts.find(a => a.id === id)
  const f: Ficha | null = id.startsWith('p-') && al ? fichaPrevisao(al, en)
    : id.startsWith('r-f-') ? fichaFogo(+id.slice(4), ctx)
    : id.startsWith('r-d-') ? fichaLhasa(+id.slice(4), ctx)
    : id.startsWith('m-') ? fichaMontanha(+id.slice(2), ctx) : null
  const box = useRef<HTMLDivElement>(null)
  const [ph, setPh] = useState(330)
  useLayoutEffect(() => { if (box.current) setPh(box.current.offsetHeight) })
  if (!f) return null
  const PW = Math.min(286, W - 24), maxH = H - 24, hh = Math.min(ph, maxH)
  let left = px > W * 0.55 ? px - 30 - PW : px + 30
  left = Math.max(12, Math.min(W - PW - 12, left))
  const top = Math.max(12, Math.min(H - hh - 12, py - hh / 2))
  const li = (x: string) => <div key={x} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span className="bul">›</span><span>{x}</span></div>
  return (
    <div className="pop" ref={box} role="dialog" aria-label={t('Detalhe do foco')} style={{ left, top, width: PW, maxHeight: maxH, overflowY: 'auto' }} onClick={ev => ev.stopPropagation()} onPointerDown={ev => ev.stopPropagation()} onWheel={ev => ev.stopPropagation()}>
      <button className="x" aria-label={t('Fechar detalhe')} onClick={() => set({ sel: null })}><Icon k="x" size={14} /></button>
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="tag" style={{ background: rgba(f.cor, 0.14), color: f.cor }}>{f.tag}</span>
        <span className="tag" style={{ background: 'rgba(251,191,36,.14)', color: '#F29900' }}>{f.estado}</span>
      </div>
      <div><h3>{t(f.titulo)}</h3><div className="sub">{t(f.sub)}</div></div>
      <div className="metric"><b>{f.metrica}</b>{f.delta && <span style={{ color: 'var(--red2)', fontSize: 12, fontWeight: 500 }}>{f.delta}</span>}</div>
      <div className="ptabs" role="tablist" aria-label={en ? 'Detail sections' : 'Seções do detalhe'}>
        {([['resumo', en ? 'Summary' : 'Resumo'], ['dados', en ? 'Data' : 'Dados'], ['pol', en ? 'Polarization' : 'Polarização']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={cx(tab === k && 'on')} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'resumo' && (
        <>
          <div className="hyp"><b>🧪 {en ? 'Likely cause (hypothesis): ' : 'Causa provável (hipótese): '}</b>{f.causa}</div>
          <div className="acao"><b>{en ? 'Suggested response' : 'Sugestão de resposta'}</b><span>{recomendacao(al ?? { ty: id.startsWith('r-f-') ? 'fogo' : id.startsWith('m-') && f.cor === '#0284C7' ? 'geleira' : 'deslizamento', lvl: f.grau >= 70 ? 'Alto' : f.grau >= 35 ? 'Médio' : 'Baixo' }, s.lang)}</span></div>
          <div className="why">{f.resumo}</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--mu)' }}>{en ? 'Danger level' : 'Nível de perigo'}</span>
              <b style={{ color: 'var(--red2)' }}>{t(`${lvlOf(f.grau)} · ${f.grau}/100`)}</b>
            </div>
            <div className="gbar"><i style={{ width: `${f.grau}%` }} /></div>
          </div>
          <a className="plink" href={worldviewUrl(ds.realMeta.imagem, ds.timeline.at(-1)?.date)} target="_blank" rel="noreferrer">{en ? 'Confirm in the optical image (NASA Worldview) ↗' : 'Confirmar na imagem óptica (NASA Worldview) ↗'}</a>
        </>
      )}
      {tab === 'dados' && (
        <div className="pbody">
          <b>{en ? 'What the data showed' : 'O que os dados mostraram'}</b>
          {f.dados.map(li)}
          {f.porque.length > 0 && <><b>{en ? 'Why this cause' : 'Por que essa causa'}</b>{f.porque.map(li)}</>}
          <b>{en ? 'Other possible causes' : 'Outras causas possíveis'}</b>
          {f.outras.map(li)}
        </div>
      )}
      {tab === 'pol' && (
        <div className="pbody">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: f.pol.sigla === 'HV' ? '#2F9E44' : '#1C7ED6', color: '#fff', fontWeight: 800, borderRadius: 6, padding: '2px 8px' }}>{f.pol.sigla}</span>
            <b>{f.pol.oque}</b>
          </div>
          <div>{f.pol.texto}</div>
          {f.pol.valores.length > 0 && <div className="mut">{f.pol.valores.map(v => <div key={v}>{v}</div>)}</div>}
        </div>
      )}
      <div className="btns"><button className="btn pri" onClick={() => go('comparar')}>{t('Comparar períodos')}</button></div>
    </div>
  )
}
