import { useEffect, useRef, useState } from 'react'
import { AlertCard } from '../AlertCard'
import '../../styles/map-extra.css'
import { useApp } from '../../lib/store'
import { RISK } from '../../lib/demo'
import type { Level } from '../../lib/types'
import { cx } from '../../lib/util'
import { Icon } from '../Icon'
import { riskMonitor } from '../../lib/riscos'

/** Painel lateral "Alerta de riscos" (âmbar translúcido) */
export function AlertPanel() {
  const { s, set, t, ds } = useApp()
  const real = s.src === 'real'
  const cnt: Record<Level, number> = { Alto: 0, 'Médio': 0, Baixo: 0 }
  ds.alerts.forEach(a => cnt[a.lvl]++)
  const high = cnt.Alto
  const ref = useRef<HTMLDivElement>(null)
  const [all, setAll] = useState(false)
  useEffect(() => { if (s.focus === 'alerts') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [s.focus])
  const seeOnMap = (id: string | null) => {
    set({ prev: true, type: 'todos', sel: id, tl: null })
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className="card alerts alerts2" id="alertPanel" ref={ref}>
      <div className="alband">
        <svg viewBox="0 0 64 64" className="alwarn" aria-hidden="true"><use href="#x-alerta" /></svg>
        <b>{t('Alerta de riscos')}</b>
        <span className="alcount"><i />{ds.alerts.length} · {high} {s.lang === 'en' ? 'HIGH' : 'ALTO'}</span>
      </div>
      <div className="rf" role="group" aria-label={t('Filtrar alertas por risco')}>
        <button className={cx(!s.risk && 'on')} aria-pressed={!s.risk} onClick={() => set({ risk: null })}>{t('Todos')} {ds.alerts.length}</button>
        {(Object.keys(cnt) as Level[]).filter(k => cnt[k] > 0).map(k => (
          <button key={k} className={cx(s.risk === k && 'on')} aria-pressed={s.risk === k} onClick={() => set({ risk: s.risk === k ? null : k })}>
            <i className="dot" style={{ background: RISK[k][0] }} />{t(k)} {cnt[k]}
          </button>
        ))}
      </div>
      {real && (() => {
        const mo = riskMonitor(ds.riscos, s.lang)
        if (!mo) return null
        const en = s.lang === 'en'
        return (
          <div className="mon" aria-label={en ? 'Monitored now' : 'Monitorando agora'}>
            <b>{en ? 'MONITORING NOW' : 'MONITORANDO AGORA'}</b>
            {mo.des && <span><i style={{ background: '#9A5B13' }} />{en ? 'Landslide' : 'Deslizamento'}: {mo.des.txt} <a href={mo.des.url} target="_blank" rel="noreferrer">{mo.des.src}</a>{mo.des.old && ' ⚠'}</span>}
            {mo.fog && <span><i style={{ background: '#E2553A' }} />{en ? 'Fires' : 'Queimadas'}: {mo.fog.txt} <a href={mo.fog.url} target="_blank" rel="noreferrer">{mo.fog.src}</a>{mo.fog.old && ' ⚠'}</span>}
            <span><i style={{ background: '#2563EB' }} />{en ? 'Water, forest, soil' : 'Água, floresta, solo'}: <a href="https://nisar.jpl.nasa.gov/" target="_blank" rel="noreferrer">NASA-ISRO NISAR</a></span>
          </div>
        )
      })()}
      <div className="cap">{t(real ? (ds.riscos ? 'ALERTAS' : 'DETECTADO PELO RADAR') : 'PRÓXIMOS DIAS')}</div>
      <div id="alist" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const lista = ds.alerts.filter(a => !s.risk || a.lvl === s.risk)
          const vis = all ? lista : lista.slice(0, 3)
          return (
            <>
              {vis.map((a, i) => <AlertCard key={(a.id ?? a.t) + i} a={a} onMap={() => seeOnMap(a.id)} />)}
              {lista.length > 3 && (
                <button type="button" className="alist-more" onClick={() => setAll(!all)}>
                  {all ? (s.lang === 'en' ? 'Show fewer ▴' : 'Mostrar menos ▴') : (s.lang === 'en' ? `See all (${lista.length}) ▾` : `Ver todos (${lista.length}) ▾`)}
                </button>
              )}
            </>
          )
        })()}
      </div>
      <div className="note note2">
        <Icon k="info" size={14} className="text-acc" />
        <span>{real
          ? <>{t(`Dados reais do NISAR: duas passagens (${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}) sobre`)} {t(ds.realMeta.nome)}. {t(ds.riscos ? 'Deslizamento e queimadas são atualizados todo dia pelo robô, com dados públicos da NASA.' : 'Fogo e previsões do tempo ainda não entram nesta versão.')}{ds.realMeta.evento ? <> {t('Esta região mostra o antes e o depois do colapso de rocha e gelo do Langtang Lirung (26 ago 2026); o ponto vermelho no mapa marca onde ele começou.')}</> : ds.realMeta.id !== 'amazonia' && <> {t('Aqui há muita lavoura: parte da perda de vegetação pode ser colheita, não desmatamento.')}</>}</>
          : <>{t('Água, fogo, vegetação e solo vêm do radar NISAR. Ventos e tornados vêm de modelos do tempo (')}<b style={{ color: 'var(--amb2)', fontWeight: 500 }}>{t('fonte externa')}</b>).</>}</span>
      </div>
    </div>
  )
}
