import { useEffect, useRef, type CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { RISK, TORNADO_C } from '../../lib/demo'
import type { Level } from '../../lib/types'
import { cx, rgba } from '../../lib/util'
import { Icon } from '../Icon'

/** Painel lateral "Alerta de riscos" (âmbar translúcido) */
export function AlertPanel() {
  const { s, set, t, ds } = useApp()
  const real = s.src === 'real'
  const cnt: Record<Level, number> = { Alto: 0, 'Médio': 0, Baixo: 0 }
  ds.alerts.forEach(a => cnt[a.lvl]++)
  const high = cnt.Alto
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (s.focus === 'alerts') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [s.focus])
  const seeOnMap = (id: string) => {
    set({ prev: true, type: 'todos', sel: id, tl: null })
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className="card alerts" id="alertPanel" ref={ref}>
      <div className="alband">
        <svg viewBox="0 0 64 64" className="alwarn" aria-hidden="true"><use href="#x-alerta" /></svg>
        <b>{t('Alerta de riscos')}</b>
        <span className="alcount"><i />{ds.alerts.length} · {high} {s.lang === 'en' ? 'HIGH' : 'ALTO'}</span>
      </div>
      <div className="ph">
        <h2 style={{ flex: 1 }}>{t(real ? 'Alertas do radar' : 'Alertas e previsões')}</h2>
        <span className="tag" style={{ background: 'rgba(34,197,94,.12)', color: 'var(--forest)' }}><span className="dot" style={{ background: 'var(--forest)', width: 6, height: 6 }} />{t('Ao vivo')}</span>
      </div>
      <div className="sum" role="group" aria-label={t('Filtrar alertas por risco')}>
        {(Object.keys(cnt) as Level[]).map(k => (
          <button key={k} className={cx(s.risk === k && 'on')} aria-pressed={s.risk === k} onClick={() => set({ risk: s.risk === k ? null : k })}>
            <span><i className="dot" style={{ background: RISK[k][0] }} />{t(k)}</span><b>{cnt[k]}</b>
          </button>
        ))}
      </div>
      <div className="cap">{t(real ? 'DETECTADO PELO RADAR' : 'PRÓXIMOS DIAS')}</div>
      <div id="alist" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ds.alerts.filter(a => !s.risk || a.lvl === s.risk).map((a, i) => {
          const c = a.ty === 'tornado' ? TORNADO_C : ds.types[a.ty].c
          const [rb, rt] = RISK[a.lvl]
          return (
            <div key={(a.id ?? 'x') + i} className="al" style={{ '--c': c, ...(a.lvl === 'Alto' ? { borderColor: rgba(rb, 0.35) } : {}) } as CSSProperties}>
              <div className="r1">
                <span className="tile" style={{ background: rgba(c, 0.12), color: c }}><Icon k={a.ty === 'tornado' ? 'tornado' : ds.types[a.ty].ic} size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><h4>{t(a.t)}</h4><div className="loc">{t(a.l)}</div></div>
                <span className="risk" style={{ background: rgba(rb, 0.14), color: rt }}>{t(`${a.lvl} · ${a.p}%`)}</span>
              </div>
              <p>{t(a.m)}</p>
              <div className="ft">
                <Icon k="relogio" size={13} />{t(a.pz)}<span>·</span>
                {a.src === 'NISAR' ? t('Fonte: NISAR') : <span className="ext">{t('Fonte externa: meteorologia')}</span>}
                {a.id && <a href="#inicio" onClick={e => { e.preventDefault(); seeOnMap(a.id!) }}>{t('Ver no mapa')}</a>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="note">
        <Icon k="info" size={16} className="text-acc" />
        <span>{real
          ? <>{t(`Dados reais do NISAR: duas passagens (${ds.rd.a} e ${ds.rd.b} ${ds.rd.y}) sobre`)} {t(ds.realMeta.nome)}. {t('Fogo e previsões do tempo ainda não entram nesta versão.')}{ds.realMeta.id !== 'amazonia' && <> {t('Aqui há muita lavoura: parte da perda de vegetação pode ser colheita, não desmatamento.')}</>}</>
          : <>{t('Água, fogo, vegetação e solo vêm do radar NISAR. Ventos e tornados vêm de modelos do tempo (')}<b style={{ color: 'var(--amb2)', fontWeight: 500 }}>{t('fonte externa')}</b>).</>}</span>
      </div>
    </div>
  )
}
