import { useEffect, useRef, useState } from 'react'
import { AlertCard } from '../AlertCard'
import '../../styles/map-extra.css'
import { useApp } from '../../lib/store'
import { RISK } from '../../lib/demo'
import type { Level } from '../../lib/types'
import { cx } from '../../lib/util'
import { Icon } from '../Icon'
import { Ajuda } from '../Ajuda'
import { PrevisaoTab } from './PrevisaoTab'
import { priorizar } from '../../lib/gestao'
import { useMemo } from 'react'

/** Painel lateral "Alerta de riscos" (âmbar translúcido) */
export function AlertPanel() {
  const { s, set, t, ds } = useApp()
  const real = s.src === 'real', en = s.lang === 'en'
  // v7.5 · gestão: a prioridade soma área, repetição entre passagens e força do sinal (lib/gestao.ts)
  const alerts = useMemo(() => priorizar(ds.alerts, ds.ev, ds.timeline, en), [ds.alerts, ds.ev, ds.timeline, en])
  const cnt: Record<Level, number> = { Alto: 0, 'Médio': 0, Baixo: 0 }
  alerts.forEach(a => cnt[a.lvl]++)
  const high = cnt.Alto
  const ref = useRef<HTMLDivElement>(null)
  const [all, setAll] = useState(false)
  const [aba, setAba] = useState<'prev' | 'al'>('al')
  useEffect(() => { if (s.focus === 'alerts') setAba('al') }, [s.focus])
  const prevOn = real && aba === 'prev'
  useEffect(() => { if (s.focus === 'alerts') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [s.focus])
  const seeOnMap = (id: string | null) => {
    set({ prev: true, type: 'todos', sel: id, tl: null })
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className="card alerts alerts2 gestao" id="alertPanel" ref={ref}>
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3" style={{ borderBottom: '1px solid #EAECF0' }}>
        <b className="flex items-center text-[14.5px]" style={{ color: '#101828' }}>{en ? 'Changes to verify' : 'Mudanças para verificar'}<Ajuda txt={en ? 'Management priority = area of the same change nearby (up to 2 pts) + repetition in earlier radar passes (up to 2) + strong radar signal (1). 3+ = high, 2 = medium, 0–1 = low. Open "Details" to see the points of each spot.' : 'Prioridade de gestão = área da mesma mudança por perto (até 2 pts) + repetição em passagens anteriores do radar (até 2) + sinal forte do radar (1). 3+ = alta, 2 = média, 0–1 = baixa. Abra "Detalhes" para ver os pontos de cada foco.'} /></b>
        <span className="text-[12px] font-semibold" style={{ color: '#475467' }}>{alerts.length} {en ? 'spots' : 'focos'} · {high} {en ? 'high priority' : 'prioridade alta'}</span>
      </div>
      {false && (
        <div className="pv-tabs" role="tablist">
          <button role="tab" aria-selected={aba === 'prev'} className={cx(aba === 'prev' && 'on')} onClick={() => setAba('prev')}>{s.lang === 'en' ? 'Forecast' : 'Previsão'}</button>
          <button role="tab" aria-selected={aba === 'al'} className={cx(aba === 'al' && 'on')} onClick={() => setAba('al')}>{s.lang === 'en' ? 'Alerts' : 'Alertas'} <span>{ds.alerts.length}</span></button>
        </div>
      )}
      {prevOn && <PrevisaoTab onMap={seeOnMap} />}
      {!prevOn && <>
      <div className="rf" role="group" aria-label={t('Filtrar alertas por risco')}>
        <button className={cx(!s.risk && 'on')} aria-pressed={!s.risk} onClick={() => set({ risk: null })}>{t('Todos')} {alerts.length}</button>
        {(Object.keys(cnt) as Level[]).filter(k => cnt[k] > 0).map(k => (
          <button key={k} className={cx(s.risk === k && 'on')} aria-pressed={s.risk === k} onClick={() => set({ risk: s.risk === k ? null : k })}>
            <i className="dot" style={{ background: RISK[k][0] }} />{k === 'Alto' ? (en ? 'High' : 'Alta') : k === 'Médio' ? (en ? 'Medium' : 'Média') : (en ? 'Low' : 'Baixa')} {cnt[k]}
          </button>
        ))}
      </div>
      <div className="cap">{en ? 'BY MANAGEMENT PRIORITY' : 'POR PRIORIDADE DE GESTÃO'}</div>
      <div id="alist" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const lista = alerts.filter(a => !s.risk || a.lvl === s.risk)
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
      </>}
      {!real && <div className="note note2">
        <Icon k="info" size={14} className="text-acc" />
        <span>{real
          ? <>{t(`Dados reais do NISAR: duas passagens (${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}) sobre`)} {t(ds.realMeta.nome)}. {t(ds.riscos ? 'Deslizamento e queimadas são atualizados todo dia pelo robô, com dados públicos da NASA.' : 'Fogo e previsões do tempo ainda não entram nesta versão.')}{ds.realMeta.evento?.tipo === 'enchente' ? <> {t('Esta região mostra o antes e o durante da enchente do rio Limpopo (jan 2026), com dados BETA do NISAR (antes da calibração final); o ponto vermelho marca Chókwè.')}</> : ds.realMeta.evento ? <> {t('Esta região mostra o antes e o depois do colapso de rocha e gelo do Langtang Lirung (26 ago 2026); o ponto vermelho no mapa marca onde ele começou.')}</> : ds.realMeta.id !== 'amazonia' && <> {t('Aqui há muita lavoura: parte da perda de vegetação pode ser colheita, não desmatamento.')}</>}</>
          : <>{t('Água, fogo, vegetação e solo vêm do radar NISAR. Ventos e tornados vêm de modelos do tempo (')}<b style={{ color: 'var(--amb2)', fontWeight: 500 }}>{t('fonte externa')}</b>).</>}</span>
      </div>}
    </div>
  )
}
