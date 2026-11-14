// Card de alerta enxuto (v4.1): título, nível, uma frase e uma ação. O resto abre em "Detalhes".
// Alertas de colapso mostram as etapas do mesmo evento numa linha (sinal prévio → ocorrido → previsão).
import { Fragment, useState, type CSSProperties } from 'react'
import { useApp } from '../lib/store'
import { COLAPSO_C, DESLIZ_C, GELO_C, RISK, TORNADO_C } from '../lib/demo'
import { FASE } from '../lib/events'
import type { Alert } from '../lib/types'
import { rgba } from '../lib/util'
import { Icon } from './Icon'
import { coord, osm, recomendacao } from '../lib/acao'

const abrir = (url: string) => window.open(url, '_blank', 'noopener')

export function AlertCard({ a, onMap, big = false }: { a: Alert; onMap?: () => void; big?: boolean }) {
  const { s, t, ds } = useApp()
  const en = s.lang === 'en'
  const [open, setOpen] = useState(false)
  const c = a.ty === 'tornado' ? TORNADO_C : a.ty === 'colapso' ? COLAPSO_C : a.ty === 'deslizamento' ? DESLIZ_C : a.ty === 'geleira' ? GELO_C : ds.types[a.ty].c
  const [rb, rt] = RISK[a.lvl]
  const nivel = a.id?.startsWith('p-') ? t(a.lvl) : a.badge ? t(a.badge) : a.fase ? `${t(a.lvl)} · ${FASE[a.fase][en ? 1 : 0]}` : t(`${a.lvl} · ${a.p}%`)
  return (
    <div className={open ? 'al open' : 'al'} style={{ '--c': c, padding: big ? 14 : undefined, ...(a.lvl === 'Alto' ? { borderColor: rgba(rb, 0.35) } : {}) } as CSSProperties}>
      <div className="r1">
        <span className="tile" style={{ background: rgba(c, 0.12), color: c, ...(big ? { width: 40, height: 40 } : {}) }}><Icon k={a.ty === 'tornado' || a.ty === 'colapso' || a.ty === 'deslizamento' || a.ty === 'geleira' ? a.ty : ds.types[a.ty].ic} size={big ? 20 : 17} /></span>
        <div style={{ flex: 1, minWidth: 0 }}><h4>{t(a.t)}</h4><div className="loc">{a.id?.startsWith('p-') && <span className="kind">{en ? 'Forecast' : 'Previsão'}</span>}📍 {t(a.l)}</div></div>
        <span className="risk" style={{ background: rgba(rb, 0.14), color: rt }}>{nivel}</span>
      </div>
      {a.etapas && (
        <div className="etapas" aria-label={en ? 'Stages of the event' : 'Etapas do evento'}>
          {a.etapas.map((e, i) => (
            <Fragment key={e.fase}>
              {i > 0 && <i aria-hidden="true">›</i>}
              <span className={e.fase === a.fase ? 'on' : ''}><b>{FASE[e.fase][en ? 1 : 0]}</b><small>{e.quando}</small></span>
            </Fragment>
          ))}
        </div>
      )}
      <p className="one">{t(a.m)}</p>
      {a.lvl !== 'Baixo' && (
        <div className="acao"><b>{en ? 'Suggested response' : 'Sugestão de resposta'}</b><span>{recomendacao(a, s.lang)}</span></div>
      )}
      {open && (
        <div className="det">
          <div>
            <b>{en ? 'Where' : 'Onde'}</b>
            <span>{t(a.l)}</span>
            {a.lon != null && a.lat != null && <span>{coord(a.lat, a.lon)} · <span role="link" tabIndex={0} className="lk" onClick={() => abrir(osm(a.lat!, a.lon!))} onKeyDown={e => e.key === 'Enter' && abrir(osm(a.lat!, a.lon!))}>{en ? 'open street map ↗' : 'abrir mapa de ruas ↗'}</span></span>}
            <span className="src">{en ? 'Source' : 'Fonte'}: {t(a.pz)}</span>
          </div>
        </div>
      )}
      {open && a.provas && (
        <div className="det">
          <div>
            <b>{en ? 'Why this forecast (data crossed in the same area)' : 'Por que esta previsão (dados cruzados na mesma área)'}</b>
            {a.provas.map(pv => <span key={pv}>• {pv}</span>)}
          </div>
          <span className="nota">{en ? 'A.R.K.O rule that crosses the sources: a hypothesis to confirm on the ground, not a certainty.' : 'Regra do A.R.K.O que cruza as fontes: hipótese a confirmar em campo, não uma certeza.'}</span>
        </div>
      )}
      {open && a.etapas && (
        <div className="det">
          {a.etapas.slice().reverse().map(e => (
            <div key={e.fase}>
              <b>{FASE[e.fase][en ? 1 : 0]} · {e.quando}</b>
              <span>{e.m}</span>
              <span className="src">{en ? 'Sources: ' : 'Fontes: '}{e.fontes.map((f, j) => <span key={f.url}>{j > 0 && ', '}<span role="link" tabIndex={0} onClick={() => abrir(f.url)} onKeyDown={k => { if (k.key === 'Enter') abrir(f.url) }}>{f.src} ↗</span></span>)}</span>
            </div>
          ))}
          <span className="nota">{en ? 'A.R.K.O does not measure ground motion yet: these alerts come from official sources.' : 'O A.R.K.O ainda não mede o movimento do solo: estes alertas vêm de fontes oficiais.'}</span>
        </div>
      )}
      <div className="ft">
        {<button type="button" className="lnk" aria-expanded={open} onClick={e => { e.stopPropagation(); setOpen(!open) }}>{open ? (en ? 'Hide details ▴' : 'Ocultar detalhes ▴') : (en ? 'Details ▾' : 'Detalhes ▾')}</button>}
        {onMap && (a.id || a.ty === 'colapso') && <a href="#inicio" onClick={e => { e.preventDefault(); e.stopPropagation(); onMap() }}>{t('Ver no mapa')}</a>}
      </div>
    </div>
  )
}
