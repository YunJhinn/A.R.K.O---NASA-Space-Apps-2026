import { useState } from 'react'
import { useApp } from '../lib/store'
import { Icon } from './Icon'
import brandIcon from '../assets/brand-icon.webp'
import brandWord from '../assets/brand-word-light.webp'
import { cx } from '../lib/util'
import { realShort } from '../lib/real'
import { MyRegions } from './MyRegions'

/** open/onNav: no celular o menu vira uma gaveta que fecha ao escolher algo */
export function Sidebar({ open = false, onNav }: { open?: boolean; onNav?: () => void }) {
  const { s, set, t, ds, setRegion, go } = useApp()
  const real = s.src === 'real'
  const [mine, setMine] = useState(false)
  const nav: [string, string, () => void, boolean, string?][] = [
    ['relogio', 'Histórico do rio', () => go('historico'), s.view === 'historico'],
    ['radar', 'Agora no rio', () => go('inicio'), s.view === 'inicio' && s.focus !== 'alerts'],
    ['sino', 'Alertas', () => go('inicio', 'alerts'), s.view === 'inicio' && s.focus === 'alerts', String(ds.alerts.length)],
    ['grafico', 'Comparar passagens', () => go('comparar'), s.view === 'comparar'],
    ['alvo', 'Validação', () => go('validacao'), s.view === 'validacao'],
    ['celular', 'Versão celular', () => go('celular'), s.view === 'celular'],
    ['mapa', 'Aplicações futuras', () => go('futuro'), s.view === 'futuro'],
    ['play', 'Como usar', () => set({ ob: true, obStep: 0 }), false],
  ]
  return (
    <aside className={cx('side side2', open && 'open')} aria-label={t('Menu principal')}>
      <div className="brand">
        <img id="brandIcon" src={brandIcon} alt="" width={36} height={36} style={{ borderRadius: 9, border: '1px solid var(--bd)' }} />
        <div><img src={brandWord} alt="A.R.K.O" style={{ height: 14, display: 'block', marginBottom: 4 }} /><small>{t('Rios · água potável')}</small></div>
      </div>
      <div className="sgroup">
        <div className="slbl">{t('RIO (RADAR AGORA)')}</div>
        <select value={ds.realMeta.id} onChange={e => { setRegion(e.target.value, { src: 'real' }); onNav?.() }} aria-label={t('Região')} className="ssel">
          {ds.realIndex.map(m => <option key={m.id} value={m.id}>{t(realShort(m))}</option>)}
        </select>
        <button className="smine" aria-expanded={mine} onClick={() => setMine(!mine)}>★ {t('Minhas regiões')} <span>{mine ? '▴' : '▾'}</span></button>
        {mine && <MyRegions />}
      </div>
      <nav className="snav" aria-label={t('Telas')}>
        {nav.map(([ic, label, fn, on, badge]) => (
          <button key={label} className={cx('nav', on && 'on')} onClick={() => { fn(); onNav?.() }}>
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
