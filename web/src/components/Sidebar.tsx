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
  const nav: [string, string, () => void, boolean, string?][] = [
    ['casa', 'Início', () => go('inicio'), s.view === 'inicio' && !s.focus],
    ['mapa', 'Mapa', () => go('inicio', 'map'), s.view === 'inicio' && s.focus === 'map'],
    ['sino', 'Alertas', () => go('inicio', 'alerts'), s.view === 'inicio' && s.focus === 'alerts', String(ds.alerts.length)],
    ['grafico', 'Comparar períodos', () => go('comparar'), s.view === 'comparar'],
    ['celular', 'Versão celular', () => go('celular'), s.view === 'celular'],
    ['play', 'Tutoriais', () => go('tutoriais'), s.view === 'tutoriais'],
    ['info', 'Como funciona', () => set({ ob: true, obStep: 0 }), false],
  ]
  return (
    <aside className="side" aria-label={t('Menu principal')}>
      <div className="brand">
        <img id="brandIcon" src={brandIcon} alt="" width={40} height={40} style={{ borderRadius: 10, border: '1px solid var(--bd)' }} />
        <div><img src={brandWord} alt="A.R.K.O" style={{ height: 15, display: 'block', marginBottom: 5 }} /><small>{t('Radar Mundial')}</small></div>
      </div>
      <div className="seg" role="group" aria-label="Idioma / Language" style={{ margin: '4px 0 10px', alignSelf: 'flex-start' }}>
        {(['pt', 'en'] as const).map(l => <button key={l} className={cx(s.lang === l && 'on')} aria-pressed={s.lang === l} onClick={() => set({ lang: l })}>{l.toUpperCase()}</button>)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--mu)', letterSpacing: '.06em', margin: '2px 0 6px' }}>{t('DADOS')}</div>
      <div className="seg" role="group" aria-label={t('Fonte dos dados')} style={{ margin: '0 0 12px', alignSelf: 'flex-start' }}>
        <button className={cx(!real && 'on')} aria-pressed={!real} onClick={() => setSrc('demo')}>{t('Exemplo')}</button>
        <button className={cx(real && 'on')} aria-pressed={real} onClick={() => setSrc('real')}>{t('NISAR real')}</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--mu)', letterSpacing: '.06em', margin: '2px 0 6px' }}>{t('REGIÃO')}</div>
      {real ? (
        // dados reais: uma lista (cresce quando o pipeline ganha regiões novas)
        <select value={ds.realMeta.id} onChange={e => setRegion(e.target.value, { src: 'real' })} aria-label={t('Região')}
          className="mb-3 w-full rounded-md border border-white/15 bg-[#1C1F26] px-2.5 py-2 text-[13px] font-bold text-white">
          {ds.realIndex.map(m => <option key={m.id} value={m.id}>{t(realShort(m))} · {t(m.nome.split(' · ')[0].split(' e ')[0])}</option>)}
        </select>
      ) : (
        <div className="seg" role="group" aria-label={t('Região')} style={{ margin: '0 0 12px', alignSelf: 'flex-start' }}>
          {REGION_LIST.map(r => {
            const on = s.region === r.id
            return <button key={r.id} className={cx(on && 'on')} aria-pressed={on} onClick={() => setRegion(r.id, { src: 'demo' })}>{t(r.name)}</button>
          })}
        </div>
      )}
      <MyRegions />
      <div className="sec">{t('MENU')}</div>
      {nav.map(([ic, label, fn, on, badge]) => (
        <button key={label} className={cx('nav', on && 'on')} onClick={fn}>
          <Icon k={ic} />{t(label)}{badge && <span className="badge">{badge}</span>}
        </button>
      ))}
      <div className="status">
        {real ? (
          <><b><span className="dot" style={{ background: 'var(--forest)' }} />{t('Dados NISAR reais')}</b>{t(`Passagens usadas: ${ds.rd.an} e ${ds.rd.bn}`)}<br />{t('Fonte: NASA–ISRO · ASF DAAC')}</>
        ) : (
          <><b><span className="dot" style={{ background: 'var(--forest)' }} />{t('Dados NISAR atualizados')}</b>{t('Última passagem do satélite: 09/11/2026')}<br />{t('Fonte: NASA–ISRO · ASF DAAC')}</>
        )}
      </div>
      <div className="team">{t('Equipe A.R.K.O · Space Apps 2026')}</div>
    </aside>
  )
}
