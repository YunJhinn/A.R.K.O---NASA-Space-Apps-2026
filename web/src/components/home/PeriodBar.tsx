import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../lib/store'
import { CMPL, MES, MES_LONGO, MN3, PRESETS, RANGE, REF } from '../../lib/demo'
import { ago, cx, iso } from '../../lib/util'
import { Icon } from '../Icon'

const fmt = (dt: Date) => `${dt.getDate()} ${MN3[dt.getMonth()]}`

/** Barra de período: atalhos, comparação e seletor de datas */
export function PeriodBar() {
  const { s, set, t, ds } = useApp()
  const [open, setOpen] = useState(false)
  const real = s.src === 'real'
  const range = real ? `${ds.rd.a} – ${ds.rd.b} ${ds.rd.y}` : s.custom ? s.custom.label : RANGE[s.preset]
  const cmpLbl = real ? `Passagem de ${ds.rd.a}` : s.custom ? 'Período anterior de mesmo tamanho' : CMPL[s.preset]
  const [cmpOn, setCmpOn] = useState(true)
  return (
    <div className="bar" role="group" aria-label={t('Filtro de período')}>
      <span className="lbl"><Icon k="cal" size={16} />{t('Período')}</span>
      <div className="seg">
        {PRESETS.map(([k, l]) => {
          const on = k === s.preset && !s.custom
          return <button key={k} className={cx(on && 'on')} aria-pressed={on} onClick={() => set({ preset: k, custom: null, tl: null })}>{t(l)}</button>
        })}
      </div>
      <span className="vdiv" />
      <button className={cx('switch', cmpOn && 'on')} role="switch" aria-checked={cmpOn} aria-label={t('Comparar com o período anterior')} onClick={() => setCmpOn(!cmpOn)} />
      <span style={{ color: 'var(--mu)' }}>{t('Comparar com')}</span><span className="pill">{t(cmpLbl)}</span>
      <button className="datebtn" aria-haspopup="dialog" aria-expanded={open} onClick={e => { e.stopPropagation(); setOpen(!open) }}>
        <Icon k="cal" size={15} /><span>{t(range)}</span><Icon k="seta" size={15} />
      </button>
      {open && <DatePicker onClose={() => setOpen(false)} />}
    </div>
  )
}

function DatePicker({ onClose }: { onClose: () => void }) {
  const { s, set, t } = useApp()
  const [mSel, setMSel] = useState<number[]>([])
  const [from, setFrom] = useState('2026-10-11')
  const [to, setTo] = useState('2026-11-10')
  const [err, setErr] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = () => onClose()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('click', close); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', key) }
  }, [onClose])
  const pres: [typeof s.preset, string][] = [['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias'], ['3m', 'Últimos 3 meses'], ['6m', 'Desde o início dos dados']]
  const [m1, m2] = [mSel[0], mSel[1] ?? mSel[0]]
  const lo = Math.min(m1 ?? 99, m2 ?? 99), hi = Math.max(m1 ?? -1, m2 ?? -1)
  const pickMonth = (i: number) => {
    const sel = mSel.length !== 1 ? [i] : [mSel[0], i]
    setMSel(sel)
    const a = Math.min(...sel), z = Math.max(...sel)
    let f = new Date(2026, MES[a][2], 1), tt = new Date(2026, MES[z][2] + 1, 0)
    if (f < new Date(2026, 5, 17)) f = new Date(2026, 5, 17)
    if (tt > REF) tt = REF
    setFrom(iso(f)); setTo(iso(tt)); setErr(false)
  }
  const apply = () => {
    const f = new Date(from + 'T12:00'), tt = new Date(to + 'T12:00')
    if (isNaN(+f) || isNaN(+tt) || f > tt) { setErr(true); return }
    const a = Math.max(0, ago(tt)), b = ago(f), span = b - a + 1
    set({ preset: span <= 7 ? '7d' : span <= 31 ? '30d' : span <= 92 ? '3m' : '6m', custom: { a, b, label: `${fmt(f)} – ${fmt(tt)} ${tt.getFullYear()}` }, tl: null })
    onClose()
  }
  return (
    <div className="dp on" ref={ref} role="dialog" aria-label={t('Escolher período')} onClick={e => e.stopPropagation()}>
      <div className="dpb">
        <div className="pre">
          {pres.map(([k, l]) => <button key={k} className={cx(!s.custom && s.preset === k && !mSel.length && 'on')} onClick={() => { set({ preset: k, custom: null, tl: null }); onClose() }}>{t(l)}</button>)}
        </div>
        <div className="rt">
          <div className="cap2">{t('Ou escolha um ou mais meses (clique no primeiro e no último)')}</div>
          <div className="months2">
            {MES.map((m, i) => (
              <button key={m[0]} className={mSel.includes(i) ? 'on' : i > lo && i < hi ? 'in' : ''} aria-pressed={mSel.includes(i)} onClick={() => pickMonth(i)}>
                <i style={{ background: m[3] }} />{t(MES_LONGO[i])}
              </button>
            ))}
          </div>
          <div className="cap2">{t('Datas personalizadas')}</div>
          <div className="dates">
            <label>{t('De')}<input type="date" min="2026-06-17" max="2026-11-10" value={from} onChange={e => { setFrom(e.target.value); setMSel([]); setErr(false) }} /></label>
            <label>{t('Até')}<input type="date" min="2026-06-17" max="2026-11-10" value={to} onChange={e => { setTo(e.target.value); setMSel([]); setErr(false) }} /></label>
          </div>
          <div className="err" style={{ display: err ? 'block' : 'none' }}>{t('A data inicial precisa ser antes da final.')}</div>
        </div>
      </div>
      <div className="dpf">
        <span className="cap2" style={{ flex: 1 }}>{t('Dados do radar NISAR disponíveis de 17 jun a 10 nov 2026')}</span>
        <button className="btn" onClick={onClose}>{t('Cancelar')}</button>
        <button className="btn pri" onClick={apply}>{t('Aplicar período')}</button>
      </div>
    </div>
  )
}
