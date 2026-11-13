import { useEffect, useState } from 'react'
import { useApp } from '../../lib/store'
import { useSteps } from '../../lib/useFocus'
import { fmtDate } from '../../lib/i18n'
import { cx } from '../../lib/util'
import { Icon } from '../Icon'

/**
 * Linha do tempo animada embaixo do mapa.
 * - NISAR real: um ponto por passagem do satélite (data/linha_tempo.json, cresce sozinho a cada ~12 dias)
 * - Exemplo: uma barra por semana
 * O mapa e o painel mostram os focos acumulados até a data escolhida.
 */
export function Timeline() {
  const { s, set, t } = useApp()
  const steps = useSteps()
  const real = s.src === 'real'
  const [playing, setPlaying] = useState(false)
  const n = steps.length
  const cur = s.tl

  useEffect(() => {
    if (!playing) return
    if (cur != null && cur >= n - 1) { setPlaying(false); return }
    const id = setTimeout(() => set({ tl: cur == null ? 0 : cur + 1, sel: null }), real ? 1400 : 450)
    return () => clearTimeout(id)
  }, [playing, cur, n, real, set])
  useEffect(() => { setPlaying(false) }, [s.src])

  if (!n) return null
  const max = Math.max(1, ...steps.map(x => x.value))
  const play = () => {
    if (playing) { setPlaying(false); return }
    if (cur != null && cur >= n - 1) set({ tl: 0, sel: null })
    setPlaying(true)
  }
  const label = cur == null ? t('Período inteiro') : t(real ? `Passagem de ${fmtDate(steps[cur].date)}` : `Semana até ${fmtDate(steps[cur].date)}`)

  return (
    <div className="tlx mt-3 rounded-lg px-4 pb-3 pt-3 text-white"
      style={{ background: 'linear-gradient(160deg,#071427 0%,#0C2342 55%,#102D55 100%)', boxShadow: '0 12px 28px rgba(5,16,34,.30), inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 0 1px rgba(120,170,230,.16)' }}>
      <div className="flex items-center gap-3">
        <button onClick={play} aria-label={t(playing ? 'Pausar' : 'Tocar animação')}
          className="grid h-9 w-9 flex-none place-items-center rounded-full border border-white/25 bg-white/10 transition hover:bg-white/20">
          {playing
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <Icon k="play" size={14} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#C8DEFA]">{t('Linha do tempo')}</div>
          <div className="text-[11.5px] text-[#C8DEFA]/75">{t(real ? 'Passagens reais do NISAR' : 'Semanas de exemplo')} · {t('Mostra só os focos da data escolhida')}</div>
        </div>
        <span className="flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] font-extrabold">
          <i className={cx('h-2 w-2 rounded-full', playing ? 'animate-pulse bg-[#FFD43B]' : 'bg-[#FFD43B]')} />{label}
        </span>
        {cur != null && (
          <button onClick={() => { setPlaying(false); set({ tl: null, sel: null }) }}
            className="rounded border border-white/20 px-3 py-1.5 text-[12px] font-bold text-[#C8DEFA] transition hover:bg-white/10">{t('Ver tudo')}</button>
        )}
      </div>

      {/* barras: uma por passagem (real) ou por semana (exemplo) */}
      <div className={cx('mt-3 flex items-end', real ? 'gap-3' : 'gap-[3px]')} role="group" aria-label={t('Escolher data na linha do tempo')}>
        {steps.map((st, i) => {
          const on = cur === i
          const h = Math.max(4, (st.value / max) * (real ? 46 : 38))
          return (
            <button key={st.key} onClick={() => { setPlaying(false); set({ tl: i, sel: null }) }}
              title={st.hasImg ? undefined : t('Passagem sem canal de vegetação (modo SHSV)')}
              aria-pressed={on} aria-label={fmtDate(st.date)}
              className={cx('group flex flex-1 flex-col items-center justify-end', real ? 'gap-1.5' : 'gap-0')}>
              {real && <span className={cx('text-[11px] font-extrabold', on ? 'text-white' : 'text-[#C8DEFA]/70')}>{st.value}</span>}
              <span className={cx('w-full rounded-t-[3px] transition-all', !st.hasImg && 'border border-dashed border-white/40 bg-transparent')}
                style={st.hasImg ? {
                  height: h,
                  background: on ? '#FFD43B' : cur == null ? 'linear-gradient(180deg,#4FA9E8,#1C7ED6)' : 'rgba(79,169,232,.35)',
                  boxShadow: on ? '0 0 14px rgba(255,212,59,.6)' : undefined,
                } : { height: 10 }} />
              {real && <span className={cx('whitespace-nowrap text-[11px] font-bold', on ? 'text-[#FFD43B]' : 'text-[#C8DEFA]/80')}>{fmtDate(st.date, false)}</span>}
            </button>
          )
        })}
      </div>

      {/* trilho para arrastar */}
      <input type="range" min={0} max={n - 1} step={1} value={cur ?? n - 1} aria-label={t('Arraste para escolher a data')}
        onChange={e => { setPlaying(false); set({ tl: +e.target.value, sel: null }) }}
        className="mt-2 w-full accent-[#FFD43B]" />
      {real
        ? <div className="mt-0.5 text-[11px] text-[#C8DEFA]/70">{t(`${n} passagens do NISAR · próxima a cada ~12 dias`)}</div>
        : <div className="months mt-0.5 flex justify-between text-[11px] text-[#C8DEFA]/70">{['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'].map(m => <span key={m}>{t(m)}</span>)}</div>}
    </div>
  )
}
