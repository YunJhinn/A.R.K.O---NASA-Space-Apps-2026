import { useState } from 'react'
import { useApp } from '../lib/store'
import { Icon } from './Icon'
import brandIcon from '../assets/brand-icon.webp'
import brandWord from '../assets/brand-word-light.webp'
import { cx } from '../lib/util'
import { REGION_LIST } from '../lib/regions'
import { realShort } from '../lib/real'
import { MyRegions } from './MyRegions'

export function Sidebar() {
  const { s, set, t, ds, setSrc, setRegion, go } = useApp()
  const real = s.src === 'real'
  const [mine, setMine] = useState(false)
  const nav: [string, string, () => void, boolean, string?][] = [
    ['casa', 'Início', () => go('inicio'), s.view === 'inicio' && s.focus !== 'alerts'],
    ['sino', 'Alertas', () => go('inicio', 'alerts'), s.view === 'inicio' && s.focus === 'alerts', String(ds.alerts.length)],
    ['grafico', 'Comparar períodos', () => go('comparar'), s.view === 'comparar'],
    ['celular', 'Versão celular', () => go('celular'), s.view === 'celular'],
    ['radar', 'Aplicações futuras', () => go('futuro'), s.view === 'futuro'],
    ['play', 'Tutoriais', () => go('tutoriais'), s.view === 'tutoriais'],
  ]
  return (
    <aside className="side side2" aria-label={t('Menu principal')}>
      <div className="brand">
        <img id="brandIcon" src={brandIcon} alt="" width={36} height={36} style={{ borderRadius: 9, border: '1px solid var(--bd)' }} />
        <div><img src={brandWord} alt="A.R.K.O" style={{ height: 14, display: 'block', marginBottom: 4 }} /><small>{t('Radar Mundial')}</small></div>
      </div>
      <div className="sgroup">
        <div className="slbl">{t('REGIÃO')}</div>
        <div className="seg sfull" role="group" aria-label={t('Fonte dos dados')}>
          <button className={cx(!real && 'on')} aria-pressed={!real} onClick={() => setSrc('demo')}>{t('Exemplo')}</button>
          <button className={cx(real && 'on')} aria-pressed={real} onClick={() => setSrc('real')}>{t('NISAR real')}</button>
        </div>
        {real ? (
          <select value={ds.realMeta.id} onChange={e => setRegion(e.target.value, { src: 'real' })} aria-label={t('Região')} className="ssel">
            {ds.realIndex.map(m => <option key={m.id} value={m.id}>{t(realShort(m))} · {t(m.nome.split(' · ')[0].split(' e ')[0])}</option>)}
          </select>
        ) : (
          <select value={s.region} onChange={e => setRegion(e.target.value, { src: 'demo' })} aria-label={t('Região')} className="ssel">
            {REGION_LIST.map(r => <option key={r.id} value={r.id}>{t(r.name)}</option>)}
          </select>
        )}
        <button className="smine" aria-expanded={mine} onClick={() => setMine(!mine)}>★ {t('Minhas regiões')} <span>{mine ? '▴' : '▾'}</span></button>
        {mine && <MyRegions />}
      </div>
      <nav className="snav" aria-label={t('Telas')}>
        {nav.map(([ic, label, fn, on, badge]) => (
          <button key={label} className={cx('nav', on && 'on')} onClick={fn}>
            <Icon k={ic} />{t(label)}{badge && <span className="badge">{badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sfoot">
        <div className="seg" role="group" aria-label="Idioma / Language">
          {(['pt', 'en'] as const).map(l => <button key={l} className={cx(s.lang === l && 'on')} aria-pressed={s.lang === l} onClick={() => set({ lang: l })}>{l.toUpperCase()}</button>)}
        </div>
        <span className="sstat"><span className="dot" style={{ background: 'var(--forest)' }} />{real ? `NISAR · ${s.lang === "en" ? ds.rd.bEN : ds.rd.b}` : t("Dados de exemplo")}</span>
      </div>
    </aside>
  )
}
