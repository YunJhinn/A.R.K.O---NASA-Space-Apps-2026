import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { useApp } from '../../lib/store'
import { useSteps } from '../../lib/useFocus'
import { fmtDate } from '../../lib/i18n'
import { cx } from '../../lib/util'
import { Icon } from '../Icon'

/**
 * Linha do tempo embaixo do mapa.
 * - NISAR real: um ponto por passagem do satélite (data/linha_tempo.json, cresce sozinho a cada ~12 dias)
 * - Exemplo: uma barra por semana
 * Dois modos:
 * - "Uma data": o mapa mostra só os focos da data escolhida; o play passa de data em data
 * - "Período": a pessoa escolhe início e fim (clicando ou arrastando) e o mapa mostra todos os focos do trecho;
 *   o play vai acumulando os focos do início até o fim
 */
export function Timeline() {
  const { s, set, t } = useApp()
  const steps = useSteps()
  const real = s.src === 'real'
  const n = steps.length
  const r = s.tl
  const mode = s.tlMode
  const [playing, setPlaying] = useState(false)
  const target = useRef(0)
  const drag = useRef<{ anchor: number; moved: boolean } | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  // animação
  useEffect(() => {
    if (!playing) return
    if (!r || r.b >= target.current) { setPlaying(false); return }
    const id = setTimeout(() => set({ tl: mode === 'uma' ? { a: r.b + 1, b: r.b + 1 } : { a: r.a, b: r.b + 1 }, sel: null }), real ? 1300 : 420)
    return () => clearTimeout(id)
  }, [playing, r, mode, real, set])
  useEffect(() => { setPlaying(false); setPending(null) }, [s.src, s.region, mode])

  if (!n) return null
  // início de cada passo: no exemplo cada barra é uma semana (fim − 6 dias)
  const startOf = (i: number) => {
    if (real) return steps[i].date
    const d = new Date(steps[i].date + 'T12:00'); d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  }
  const max = Math.max(1, ...steps.map(x => x.value))
  const pick = (a: number, b: number) => set({ tl: { a: Math.min(a, b), b: Math.max(a, b) }, sel: null })

  const play = () => {
    if (playing) { setPlaying(false); return }
    if (mode === 'uma') {
      const start = r && r.b < n - 1 ? r.b : 0
      target.current = n - 1
      pick(start, start)
    } else {
      // período: anima do início até o fim escolhido (ou a linha toda)
      const a = r && r.a !== r.b ? r.a : 0
      target.current = r && r.a !== r.b ? r.b : n - 1
      pick(a, a)
    }
    setPending(null)
    setPlaying(true)
  }

  // escolher com o mouse ou o dedo: clique (uma data), clique-clique ou arrastar (período)
  const idxAt = (e: RPointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-i]') as HTMLElement | null
    return el ? +el.dataset.i! : null
  }
  const onDown = (e: RPointerEvent) => {
    const i = idxAt(e); if (i == null) return
    setPlaying(false)
    if (mode === 'uma') { pick(i, i); return }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { anchor: i, moved: false }
    if (pending == null) pick(i, i)
  }
  const onMove = (e: RPointerEvent) => {
    const d = drag.current; if (!d) return
    const i = idxAt(e); if (i == null || i === d.anchor && !d.moved) return
    d.moved = true; setPending(null); pick(d.anchor, i)
  }
  const onUp = (e: RPointerEvent) => {
    const d = drag.current; drag.current = null
    if (!d || d.moved || mode === 'uma') return
    const i = idxAt(e) ?? d.anchor
    if (pending != null && pending !== i) { pick(pending, i); setPending(null) }
    else { setPending(i); pick(i, i) }
  }

  const label = r == null ? t('Período inteiro')
    : real ? (r.a === r.b ? t(`Passagem de ${fmtDate(steps[r.b].date)}`) : t(`Passagens de ${fmtDate(steps[r.a].date, false)} a ${fmtDate(steps[r.b].date)}`))
      : (r.a === r.b ? t(`Semana até ${fmtDate(steps[r.b].date)}`) : t(`De ${fmtDate(startOf(r.a), false)} a ${fmtDate(steps[r.b].date)}`))
  const hint = mode === 'uma' ? 'Mostra só os focos da data escolhida'
    : pending != null ? 'Agora clique na data final do período' : 'Clique no início e no fim, ou arraste'

  return (
    <div className="tlx mt-3 rounded-lg px-4 pb-3 pt-3 text-white"
      style={{ background: 'linear-gradient(160deg,#071427 0%,#0C2342 55%,#102D55 100%)', boxShadow: '0 12px 28px rgba(5,16,34,.30), inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 0 1px rgba(120,170,230,.16)' }}>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={play} aria-label={t(playing ? 'Pausar' : 'Tocar animação')}
          className="grid h-9 w-9 flex-none place-items-center rounded-full border border-white/25 bg-white/10 transition hover:bg-white/20">
          {playing
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <Icon k="play" size={14} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#C8DEFA]">{t('Linha do tempo')}</div>
          <div className={cx('text-[11.5px]', pending != null ? 'font-bold text-[#FFD43B]' : 'text-[#C8DEFA]/75')}>{t(real ? 'Passagens reais do NISAR' : 'Semanas de exemplo')} · {t(hint)}</div>
        </div>
        {/* modo: uma data × período */}
        <div className="flex rounded-md border border-white/20 bg-white/5 p-0.5 text-[12px] font-bold" role="group" aria-label={t('Modo da linha do tempo')}>
          {(['uma', 'periodo'] as const).map(m => (
            <button key={m} aria-pressed={mode === m} onClick={() => { set({ tlMode: m, tl: null, sel: null }) }}
              className={cx('rounded px-2.5 py-1 transition', mode === m ? 'bg-white text-[#0C2342]' : 'text-[#C8DEFA] hover:bg-white/10')}>
              {t(m === 'uma' ? 'Uma data' : 'Período')}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] font-extrabold">
          <i className={cx('h-2 w-2 rounded-full bg-[#FFD43B]', playing && 'animate-pulse')} />{label}
        </span>
        {r != null && (
          <button onClick={() => { setPlaying(false); setPending(null); set({ tl: null, sel: null }) }}
            className="rounded border border-white/20 px-3 py-1.5 text-[12px] font-bold text-[#C8DEFA] transition hover:bg-white/10">{t('Ver tudo')}</button>
        )}
      </div>

      {/* barras: uma por passagem (real) ou por semana (exemplo). Arraste no modo Período */}
      <div className={cx('mt-3 flex select-none items-end touch-none', real ? 'gap-3' : 'gap-[3px]')} role="group" aria-label={t('Escolher data na linha do tempo')}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        {steps.map((st, i) => {
          const inR = r != null && i >= r.a && i <= r.b
          const edge = r != null && (i === r.a || i === r.b)
          const h = Math.max(4, (st.value / max) * (real ? 46 : 38))
          return (
            <button key={st.key} data-i={i} type="button"
              title={st.hasImg ? fmtDate(st.date) : t('Passagem sem canal de vegetação (modo SHSV)')}
              aria-pressed={inR} aria-label={fmtDate(st.date)}
              className={cx('group flex flex-1 flex-col items-center justify-end', real ? 'gap-1.5' : 'gap-0', pending === i && 'animate-pulse')}>
              {real && <span className={cx('text-[11px] font-extrabold', inR ? 'text-white' : 'text-[#C8DEFA]/70')}>{st.value}</span>}
              <span className={cx('pointer-events-none w-full rounded-t-[3px] transition-all', !st.hasImg && 'border border-dashed border-white/40 bg-transparent')}
                style={st.hasImg ? {
                  height: h,
                  background: inR ? (edge || mode === 'uma' ? '#FFD43B' : '#F5C542') : r == null ? 'linear-gradient(180deg,#4FA9E8,#1C7ED6)' : 'rgba(79,169,232,.35)',
                  boxShadow: inR ? '0 0 12px rgba(255,212,59,.45)' : undefined,
                } : { height: 10 }} />
              {real && <span className={cx('pointer-events-none whitespace-nowrap text-[11px] font-bold', inR ? 'text-[#FFD43B]' : 'text-[#C8DEFA]/80')}>{fmtDate(st.date, false)}</span>}
            </button>
          )
        })}
      </div>

      {/* controles precisos */}
      {mode === 'uma' ? (
        <input type="range" min={0} max={n - 1} step={1} value={r?.b ?? n - 1} aria-label={t('Arraste para escolher a data')}
          onChange={e => { setPlaying(false); pick(+e.target.value, +e.target.value) }} className="mt-2 w-full accent-[#FFD43B]" />
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-[#C8DEFA]">
          <span className="font-bold">{t('De')}</span>
          <select value={r?.a ?? 0} onChange={e => { setPlaying(false); setPending(null); pick(+e.target.value, Math.max(+e.target.value, r?.b ?? n - 1)) }}
            className="rounded border border-white/20 bg-[#0C2342] px-2 py-1 font-bold text-white">
            {steps.map((st, i) => <option key={st.key} value={i}>{fmtDate(startOf(i))}</option>)}
          </select>
          <span className="font-bold">{t('Até')}</span>
          <select value={r?.b ?? n - 1} onChange={e => { setPlaying(false); setPending(null); pick(Math.min(+e.target.value, r?.a ?? 0), +e.target.value) }}
            className="rounded border border-white/20 bg-[#0C2342] px-2 py-1 font-bold text-white">
            {steps.map((st, i) => <option key={st.key} value={i}>{fmtDate(st.date)}</option>)}
          </select>
          <span className="ml-auto">{t(real ? `${n} passagens do NISAR · próxima a cada ~12 dias` : 'Jun → Nov 2026')}</span>
        </div>
      )}
      {mode === 'uma' && (real
        ? <div className="mt-0.5 text-[11px] text-[#C8DEFA]/70">{t(`${n} passagens do NISAR · próxima a cada ~12 dias`)}</div>
        : <div className="months mt-0.5 flex justify-between text-[11px] text-[#C8DEFA]/70">{['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'].map(m => <span key={m}>{t(m)}</span>)}</div>)}
    </div>
  )
}
