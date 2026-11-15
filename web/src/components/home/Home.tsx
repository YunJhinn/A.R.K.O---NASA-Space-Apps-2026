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
  const { s, t, ds, go } = useApp()
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
      <div className="rounded-xl px-4 py-2.5 text-[13px]" style={{ background: '#EFF8FF', border: '1px solid #B2DDFF', color: '#1849A9' }}>
        💧 {en ? 'This is the river NOW (NISAR radar, every ~12 days, through clouds). For 40 years of history and where the water is heading, open ' : 'Este é o rio AGORA (radar NISAR, a cada ~12 dias, através das nuvens). Para 40 anos de história e para onde a água está indo, abra '}
        <button type="button" onClick={() => go('historico')} style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}>{en ? 'River history' : 'Histórico do rio'}</button>.
      </div>
      <StatusBanner />
      <div className="body">
        <MapPanel />
        <AlertPanel />
      </div>
    </section>
  )
}
