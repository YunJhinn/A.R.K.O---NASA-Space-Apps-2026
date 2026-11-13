import { useApp } from '../lib/store'
import { cx } from '../lib/util'

export function Protobar() {
  const { s, set, t, go } = useApp()
  return (
    <nav className="protobar" aria-label={t('Telas do protótipo')}>
      <span>{t('PROTÓTIPO')}</span>
      <button className={cx(s.view === 'inicio' && 'on')} onClick={() => go('inicio')}>{t('Início')}</button>
      <button className={cx(s.view === 'comparar' && 'on')} onClick={() => go('comparar')}>{t('Comparar')}</button>
      <button onClick={() => set({ ob: true, obStep: 0 })}>{t('Primeiro acesso')}</button>
      <button className={cx(s.view === 'celular' && 'on')} onClick={() => go('celular')}>{t('Celular')}</button>
    </nav>
  )
}
