import type { CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { CMPL } from '../../lib/demo'
import { kmf } from '../../lib/util'
import { Icon } from '../Icon'
import { useFocus } from '../../lib/useFocus'

/** Painel de dados principais (estilo telão de previsão do tempo, azul profundo + vidro) */
export function KpiPanel() {
  const { s, t, ds, inRange, periodLabel } = useApp()
  const real = s.src === 'real'
  const { base, step } = useFocus()
  const live = step ? (real ? `NISAR · ${step.label}` : step.label) : real ? `NISAR · ${ds.rd.a} → ${ds.rd.b}` : periodLabel()

  let cards: { k: 'fogo' | 'agua' | 'arvore' | 'solo'; title: string; v: string; delta?: string; foot: string }[]
  if (real) {
    const v = base ?? ds.ev.filter(e => e.st !== 'prev' && inRange(e.d))
    const area = (k: string) => v.filter(e => e.k === k).reduce((a, e) => a + (e.a ?? 0), 0)
    const n = (k: string) => v.filter(e => e.k === k).length
    const ft = (k: string) => (step ? `${n(k)} ${n(k) === 1 ? 'foco' : 'focos'} · ${step.label}` : v.length ? `${n(k)} ${n(k) === 1 ? 'foco' : 'focos'} · ${ds.rd.a} → ${ds.rd.b}` : 'Nenhuma passagem do NISAR nesse período')
    cards = [
      { k: 'fogo', title: 'Área queimada', v: '—', foot: 'Fogo ainda não medido nos dados reais' },
      { k: 'agua', title: 'Água nova', v: kmf(area('agua')), foot: ft('agua') },
      { k: 'arvore', title: 'Floresta perdida', v: kmf(area('arvore')), foot: ft('arvore') },
      { k: 'solo', title: 'Água que recuou', v: kmf(area('solo')), foot: ft('solo') },
    ]
  } else {
    cards = ds.region.kpi[s.preset].map(([k, title, v, d]) => ({ k: k as 'fogo', title, v, delta: d.startsWith('—') ? undefined : d, foot: d.startsWith('—') ? 'Sem período anterior com dados' : `vs. ${CMPL[s.preset]}` }))
  }
  return (
    <div className="kpis">
      <div className="kpihead"><b>{t(real ? 'Radar da Amazônia' : ds.region.title)}</b><span className="kpilive"><i />{t(live)}</span></div>
      {cards.map(c => {
        const col = ds.types[c.k].c
        return (
          <div key={c.k} className="card kpi" style={{ '--c': col } as CSSProperties}>
            <div className="t">{t(c.title)}<span className="tile"><Icon k={c.k} size={15} /></span></div>
            <div className="v">{t(c.v)}</div>
            <div className="f">{c.delta ? <><span className="delta">{t(c.delta)}</span>{t(c.foot)}</> : <span style={{ color: 'var(--sub)' }}>{t(c.foot)}</span>}</div>
          </div>
        )
      })}
    </div>
  )
}
