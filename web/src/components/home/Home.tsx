import { useApp } from '../../lib/store'
import { realTitle } from '../../lib/real'
import { FavButton } from '../MyRegions'
import { PeriodButton } from './PeriodBar'
import { MapPanel } from './MapPanel'
import { AlertPanel } from './AlertPanel'
import { SearchBox } from './SearchBox'
import { StatusBanner } from './StatusBanner'

/** v5 · tela inicial: região e data → faixa de status → mapa e alertas lado a lado */
export function Home() {
  const { s, t, ds } = useApp()
  const real = s.src === 'real', en = s.lang === 'en'
  const sub = real
    ? (ds.realMeta.evento
        ? (ds.realMeta.evento.tipo === 'enchente'
          ? (en ? `Map: before and during the flood (NISAR passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y}, BETA data) · Forecast: latest data` : `Mapa: antes e durante a enchente (passagens do NISAR de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}, dados BETA) · Previsão: dados mais recentes`)
          : (en ? `Map: before and after the collapse (NISAR passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y}) · Forecast: latest data` : `Mapa: antes e depois do colapso (passagens do NISAR de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}) · Previsão: dados mais recentes`))
        : (en ? `Real NISAR data · passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y}` : `Dados reais do NISAR · passagens de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}`))
    : (en ? 'Example · simulated data to learn the app' : 'Exemplo · dados simulados para aprender o app')
  return (
    <section className="view on home2" id="v-inicio" style={{ flexDirection: 'column', gap: 14 }}>
      <div className="head2">
        <div className="ttl"><h1>{t(real ? realTitle(ds.realMeta) : ds.region.title)}<FavButton /></h1><div className="sub">{sub}</div></div>
        <SearchBox />
        <PeriodButton />
      </div>
      <StatusBanner />
      <div className="body">
        <MapPanel />
        <AlertPanel />
      </div>
    </section>
  )
}
