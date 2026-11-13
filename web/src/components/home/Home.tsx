import { useApp } from '../../lib/store'
import { Icon } from '../Icon'
import { PeriodBar } from './PeriodBar'
import { KpiPanel } from './KpiPanel'
import { MapPanel } from './MapPanel'
import { AlertPanel } from './AlertPanel'
import { SearchBox } from './SearchBox'

export function Home() {
  const { s, t, ds, inRange } = useApp()
  const hi = ds.alerts.filter(a => a.lvl === 'Alto').length
  let answer: string
  if (s.src === 'real') {
    const v = ds.ev.filter(e => e.st !== 'prev' && inRange(e.d))
    const fl = v.filter(e => e.k === 'arvore').reduce((a, e) => a + (e.a ?? 0), 0)
    answer = v.length
      ? `${ds.alerts.length} alertas do radar NISAR real, ${hi} de alto risco. Floresta perdida: ${fl.toFixed(2).replace('.', ',')} km² entre ${ds.rd.a} e ${ds.rd.b}.`
      : 'Nenhuma passagem do NISAR nesse período. Escolha 30 dias ou mais.'
  } else {
    answer = `${ds.alerts.length} alertas ativos, ${hi} de alto risco nas próximas 48h. ${s.preset === '30d' ? ds.region.answer30 : ''}`.trim()
  }
  return (
    <section className="view on" id="v-inicio" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div><h1>{t('Início')}</h1><div className="answer"><span className="dot" style={{ background: 'var(--red)' }} /><span>{t(answer)}</span></div></div>
        <SearchBox />
        <button className="ibtn" aria-label={t(`Notificações: ${ds.alerts.length} alertas`)}><Icon k="sino" /><span className="pip" /></button>
      </div>
      <PeriodBar />
      <KpiPanel />
      <div className="body">
        <MapPanel />
        <AlertPanel />
      </div>
    </section>
  )
}
