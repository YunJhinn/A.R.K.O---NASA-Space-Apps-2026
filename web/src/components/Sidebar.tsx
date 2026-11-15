import { useApp } from '../lib/store'
import { Icon } from './Icon'
import brandIcon from '../assets/brand-icon.webp'
import brandWord from '../assets/brand-word-light.webp'
import { cx } from '../lib/util'

/** open/onNav: no celular o menu vira uma gaveta que fecha ao escolher algo */
export function Sidebar({ open = false, onNav }: { open?: boolean; onNav?: () => void }) {
  const { s, set, t, ds, go } = useApp()
  const real = s.src === 'real'
  const nav: [string, string, () => void, boolean, string?][] = [
    ['radar', 'Radar NISAR', () => go('inicio'), s.view === 'inicio'],
    ['relogio', 'Histórico do rio', () => go('historico'), s.view === 'historico'],
    ['camadas', 'Aquíferos', () => go('aquiferos'), s.view === 'aquiferos'],
    ['sino', 'Cenários futuros', () => go('cenarios'), s.view === 'cenarios'],
    ['alvo', 'Validação', () => go('validacao'), s.view === 'validacao'],
  ]
  return (
    <aside className={cx('side side2', open && 'open')} aria-label={t('Menu principal')}>
      <div className="brand">
        {/* v7.19 · regra do Space Apps: imagem gerada por IA leva marca d'água visível */}
        <span style={{ position: 'relative', display: 'inline-block', flex: 'none' }} title={s.lang === 'en' ? 'Logo generated with AI' : 'Logo gerado com IA'}>
          <img id="brandIcon" src={brandIcon} alt="" width={36} height={36} style={{ borderRadius: 9, border: '1px solid var(--bd)', display: 'block' }} />
          <span style={{ position: 'absolute', right: -4, bottom: -4, background: '#fff', color: '#0B1F33', fontSize: 8, fontWeight: 800, lineHeight: 1, padding: '2px 3px', borderRadius: 4, border: '1px solid #D0D5DD' }}>{s.lang === 'en' ? 'AI' : 'IA'}</span>
        </span>
        <div><img src={brandWord} alt="A.R.K.O" style={{ height: 14, display: 'block', marginBottom: 4 }} /><small>{t('Rios · água potável')}</small><small style={{ display: 'block', fontSize: 9, opacity: .7 }}>{s.lang === 'en' ? 'logo and icons: AI-generated' : 'logo e ícones: gerados por IA'}</small></div>
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
