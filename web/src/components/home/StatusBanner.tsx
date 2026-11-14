// v5 · faixa de status: responde "preciso agir agora?" numa frase, na cor do maior risco.
import { useApp } from '../../lib/store'

export function StatusBanner() {
  const { s, set, t, ds, inRange } = useApp()
  const en = s.lang === 'en', real = s.src === 'real'
  const al = ds.alerts
  const col = al.find(a => a.ty === 'colapso')
  const high = al.filter(a => a.lvl === 'Alto'), mid = al.filter(a => a.lvl === 'Médio')
  const top = col ?? high[0] ?? mid[0] ?? al[0]
  const cls = high.length ? 'alto' : mid.length ? 'medio' : 'ok'
  const nv = ds.ev.filter(e => e.st !== 'prev' && inRange(e.d)).length
  let title: string
  if (col) title = en ? 'High danger of a new collapse' : 'Perigo alto de novo colapso'
  else if (high.length === 1) title = `${en ? '1 high alert' : '1 alerta alto'}: ${t(high[0].t)} · ${t(high[0].l)}`
  else if (high.length > 1) title = `${high.length} ${en ? 'high alerts' : 'alertas altos'} · ${t(high[0].t)}, ${t(high[0].l)}`
  else if (mid.length) title = en ? `No high alert · ${mid.length} medium` : `Nenhum alerta alto · ${mid.length} ${mid.length === 1 ? 'médio' : 'médios'}`
  else title = en ? 'No high or medium alerts' : 'Nenhum alerta alto ou médio'
  const sub = real
    ? `${col ? t(col.m) + ' · ' : ''}${al.length} ${en ? 'alerts' : 'alertas'} · ${nv} ${en ? (nv === 1 ? 'radar detection' : 'radar detections') : (nv === 1 ? 'detecção do radar' : 'detecções do radar')} (${en ? ds.rd.aEN : ds.rd.a} → ${en ? ds.rd.bEN : ds.rd.b})`
    : `${al.length} ${en ? 'alerts for the coming days · example data' : 'alertas para os próximos dias · dados de exemplo'}`
  const ver = () => {
    set({ type: 'todos', prev: true, tl: null, ...(top?.id ? { sel: top.id } : {}) })
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className={`status2 ${cls}`} role="status">
      <span className="ic" aria-hidden="true">{cls === 'ok' ? '✓' : '⚠'}</span>
      <div className="tx"><b>{title}</b><span>{sub}</span></div>
      {al.length > 0 && <button onClick={ver}>{t('Ver no mapa')}</button>}
    </div>
  )
}
