import { useApp } from '../../lib/store'
import { realTitle, realShort } from '../../lib/real'
import { FavButton } from '../MyRegions'
import { PeriodButton } from './PeriodBar'
import { MapPanel } from './MapPanel'
import { AlertPanel } from './AlertPanel'
import { Balanco } from './Balanco'
import { AquiferoAfundamento } from '../AquiferoAfundamento'
import { useState } from 'react'

/** v7.5 · tela inicial = Radar NISAR, com as duas medidas do radar:
 *  superfície (GCOV: água, margem, mata) e movimento do solo (GUNW: afundamento sobre aquíferos) */
export function Home() {
  const { s, t, ds, setRegion } = useApp()
  const [medida, setMedida] = useState<'gcov' | 'gunw'>('gcov')
  const [alvo, setAlvo] = useState<'mexico' | 'india_nw'>('mexico')
  const real = s.src === 'real', en = s.lang === 'en'
  const sub = real
    ? (ds.realMeta.evento
        ? (ds.realMeta.evento.tipo === 'enchente'
          ? (en ? `Real NISAR data · passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y} (BETA) · the second pass caught the Limpopo flood: much of the water outside the channel is the natural flood` : `Dados reais do NISAR · passagens de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y} (BETA) · a segunda passagem pegou a cheia do Limpopo: boa parte da água fora do leito é a cheia natural`)
          : (en ? `Real NISAR data · passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y} · includes the Langtang Lirung rock-ice collapse (context)` : `Dados reais do NISAR · passagens de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y} · inclui o colapso de rocha e gelo do Langtang Lirung (contexto)`))
        : (en ? `Real NISAR data · passes of ${ds.rd.aEN} and ${ds.rd.bEN} ${ds.rd.y}` : `Dados reais do NISAR · passagens de ${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}`))
    : (en ? 'Example · simulated data to learn the app' : 'Exemplo · dados simulados para aprender o app')
  return (
    <section className="view on home2" id="v-inicio" style={{ flexDirection: 'column', gap: 14 }}>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={en ? 'NISAR measurement' : 'Medida do NISAR'}>
        {([
          ['gcov', en ? 'Surface change' : 'Mudança na superfície', 'GCOV · ' + (en ? 'water, banks, forest' : 'água, margens, mata')],
          ['gunw', en ? 'Ground motion' : 'Movimento do solo', 'GUNW · ' + (en ? 'sinking over aquifers' : 'afundamento sobre aquíferos')],
        ] as const).map(([k, tt, sub2]) => (
          <button key={k} role="tab" aria-selected={medida === k} type="button" onClick={() => setMedida(k)}
            className="rounded-xl px-4 py-2 text-left"
            style={{ background: medida === k ? '#0B1F33' : '#fff', color: medida === k ? '#fff' : '#101828', border: '1px solid ' + (medida === k ? '#0B1F33' : '#D0D5DD') }}>
            <div className="text-[14px] font-bold leading-tight">{tt}</div>
            <div className="text-[11.5px]" style={{ opacity: 0.75 }}>NISAR {sub2}</div>
          </button>
        ))}
      </div>

      {medida === 'gcov' ? <>
        <div className="head2">
          <div className="ttl"><h1>{t(real ? realTitle(ds.realMeta) : ds.region.title)}<FavButton /></h1><div className="sub">{sub}</div></div>
          <select value={ds.realMeta.id} onChange={e => setRegion(e.target.value, { src: 'real' })} aria-label={en ? 'Region' : 'Região'} className="ssel" style={{ minWidth: 220, padding: '8px 10px', borderRadius: 10, border: '1px solid #D0D5DD', background: '#fff', fontWeight: 600 }}>
            {ds.realIndex.map(m => <option key={m.id} value={m.id}>{t(realShort(m))}</option>)}
          </select>
          <PeriodButton />
        </div>
        <Balanco />
        <div className="body">
          <MapPanel />
          <AlertPanel />
        </div>
      </> : <>
        <div className="flex flex-wrap items-center gap-2">
          {([['mexico', en ? 'Mexico City' : 'Cidade do México'], ['india_nw', en ? 'New Delhi' : 'Nova Délhi']] as const).map(([k, n]) => (
            <button key={k} type="button" onClick={() => setAlvo(k)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
              style={{ background: alvo === k ? '#7A1450' : '#fff', color: alvo === k ? '#fff' : '#101828', border: '1px solid ' + (alvo === k ? '#7A1450' : '#D0D5DD') }}>{n}</button>
          ))}
        </div>
        <AquiferoAfundamento aq={alvo} en={en} />
      </>}
    </section>
  )
}
