// v5.3 · Aba "Previsão" da região escolhida: um resumo por tipo de perigo, recalculado sempre que os dados mudam
// (cada passagem do NISAR, e todo dia com LHASA e FIRMS). Cruza fontes e compara com os períodos anteriores.
import type { CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import type { Alert, Level } from '../../lib/types'
import { RISK } from '../../lib/demo'
import { dia } from '../../lib/riscos'
import { rgba } from '../../lib/util'
import { Icon } from '../Icon'

const ORD: Record<Level, number> = { Alto: 0, 'Médio': 1, Baixo: 2 }
const pior = (xs: (Level | undefined)[]): Level => (xs.filter(Boolean) as Level[]).sort((a, b) => ORD[a] - ORD[b])[0] ?? 'Baixo'

function Barras({ v, cor, en }: { v: { d: string; a: number }[]; cor: string; en: boolean }) {
  if (v.length < 2) return null
  const max = Math.max(...v.map(x => x.a), 0.01)
  return (
    <div className="pv-bars" aria-label={en ? 'Trend per radar pass' : 'Tendência por passagem do radar'}>
      {v.map(x => (
        <span key={x.d} title={`${x.d}: ${x.a.toFixed(2)} km²`}>
          <i style={{ height: `${Math.max(4, (x.a / max) * 100)}%`, background: cor }} />
          <small>{x.d.split(' ')[0]}</small>
        </span>
      ))}
    </div>
  )
}

export function PrevisaoTab({ onMap }: { onMap: (id: string | null) => void }) {
  const { s, t, ds } = useApp()
  const en = s.lang === 'en'
  const al = ds.alerts
  const prev = (ty: string) => al.filter(a => a.id?.startsWith('p-') && a.ty === ty)
  const passes = ds.timeline.filter(p => p.vs).slice(-6)
  const serie = (k: string) => passes.map(p => ({ d: dia(p.date, en), a: p.resumo.area_km2[k] ?? 0 }))
  const r = ds.riscos
  const lh = r?.deslizamento, fo = r?.fogo
  const mt = ds.real.meta.montanha ?? []
  const evento = al.find(a => a.ty === 'colapso')
  const ult = passes.at(-1), ant = passes.at(-2)
  const delta = (k: string) => (ult && ant ? { a0: ant.resumo.area_km2[k] ?? 0, a1: ult.resumo.area_km2[k] ?? 0 } : null)
  const n2 = (v: number) => (en ? v.toFixed(2) : v.toFixed(2).replace('.', ','))

  type Linha = { k: string; ic: string; cor: string; nome: string; lvl: Level; txt: string; provas: string[]; alvo: Alert | undefined; serie?: { d: string; a: number }[] }
  const linhas: Linha[] = []

  // alagamento
  {
    const pv = prev('agua'), dA = delta('agua')
    const cresce = dA && dA.a1 > dA.a0 * 1.2 && dA.a1 > 0.5
    const lvl = pior([...pv.map(a => a.lvl), cresce ? 'Médio' : undefined])
    linhas.push({
      k: 'agua', ic: 'agua', cor: '#2F8CE0', nome: en ? 'Flooding' : 'Alagamento', lvl, alvo: pv[0], serie: serie('agua'),
      txt: pv[0] ? t(pv[0].t) : dA ? (en ? `New water: ${n2(dA.a0)} → ${n2(dA.a1)} km² between the last two passes.` : `Água nova: ${n2(dA.a0)} → ${n2(dA.a1)} km² entre as duas últimas passagens.`) : (en ? 'No radar comparison yet.' : 'Ainda sem comparação do radar.'),
      provas: pv[0]?.provas ?? [],
    })
  }
  // deslizamento
  {
    const pv = prev('deslizamento')
    const lMax = lh?.max ?? 0
    const lLvl: Level | undefined = lMax >= (lh?.limiares.alto ?? 0.1) ? 'Alto' : lMax >= (lh?.limiares.medio ?? 0.05) ? 'Médio' : undefined
    const det = mt.filter(m => m.tipo === 'detritos')
    const lvl = pior([...pv.map(a => a.lvl), lLvl, det.length ? 'Médio' : undefined])
    linhas.push({
      k: 'deslizamento', ic: 'deslizamento', cor: '#9A5B13', nome: en ? 'Landslide' : 'Deslizamento', lvl, alvo: pv[0] ?? al.find(a => a.id?.startsWith('r-d-')), serie: serie('arvore'),
      txt: pv[0] ? t(pv[0].t)
        : lh ? (en ? `Highest rain-triggered landslide chance today: ${(lMax * 100).toFixed(1)}% (NASA LHASA).` : `Maior chance de deslizamento por chuva hoje: ${(lMax * 100).toFixed(1).replace('.', ',')}% (NASA LHASA).`)
        : (en ? 'Waiting for NASA LHASA data.' : 'Aguardando dados do NASA LHASA.'),
      provas: pv[0]?.provas ?? [...(det.length ? [en ? `NISAR: ${det.length} spot(s) of new material on slopes` : `NISAR: ${det.length} ponto(s) de material novo em encostas`] : []), ...(lh ? [en ? 'Bars: vegetation loss per radar pass (bare ground slides more easily)' : 'Barras: perda de vegetação por passagem do radar (terreno sem cobertura desliza mais fácil)'] : [])],
    })
  }
  // queimadas
  {
    const pv = prev('fogo')
    const top = fo?.grupos[0]
    const lvl = pior([...pv.map(a => a.lvl), ...(fo?.grupos ?? []).map(g => g.nivel)])
    linhas.push({
      k: 'fogo', ic: 'fogo', cor: '#E2553A', nome: en ? 'Fires' : 'Queimadas', lvl, alvo: pv[0] ?? al.find(a => a.id?.startsWith('r-f-')),
      txt: pv[0] ? t(pv[0].t) : fo ? (fo.focos
        ? (en ? `${fo.focos} heat spots in ${fo.janela_h} h; largest group: ${top?.n} near ${top?.lugar}.` : `${fo.focos} focos de calor em ${fo.janela_h} h; maior grupo: ${top?.n} perto de ${top?.lugar}.`)
        : (en ? `No heat spots in the last ${fo.janela_h} h.` : `Nenhum foco de calor nas últimas ${fo.janela_h} h.`)) : (en ? 'Waiting for NASA FIRMS data.' : 'Aguardando dados do NASA FIRMS.'),
      provas: pv[0]?.provas ?? (fo?.focos ? [en ? 'If the vegetation burned, the next radar pass should show HV dropping there (confirms the burned area).' : 'Se a vegetação queimou, a próxima passagem do radar deve mostrar o HV caindo ali (confirma a área queimada).'] : []),
    })
  }
  // geleiras e colapso (só regiões de montanha)
  if (evento || mt.length || ds.realMeta.id === 'nepal') {
    const pv = prev('geleira'), gelo = mt.filter(m => m.tipo === 'gelo')
    const lvl = pior([...pv.map(a => a.lvl), evento?.lvl, gelo.length ? 'Médio' : undefined])
    linhas.push({
      k: 'geleira', ic: 'geleira', cor: '#0284C7', nome: en ? 'Glaciers and collapse' : 'Geleiras e colapso', lvl, alvo: pv[0] ?? evento,
      txt: pv[0] ? t(pv[0].t) : evento ? t(evento.m) : (en ? 'No ice change detected by the radar.' : 'O radar não detectou mudança no gelo.'),
      provas: pv[0]?.provas ?? (gelo.length ? [en ? `NISAR: ${gelo.length} spot(s) of ice/snow changing` : `NISAR: ${gelo.length} ponto(s) de gelo/neve mudando`] : []),
    })
  }
  linhas.sort((a, b) => ORD[a.lvl] - ORD[b.lvl])

  const fontes = [ult && `NISAR ${dia(ult.date, en)}`, lh && `LHASA ${dia(lh.data, en)}`, r && `FIRMS ${dia(r.atualizado, en)}`].filter(Boolean).join(' · ')
  return (
    <div className="pv">
      <div className="pv-h">
        <b>{en ? 'Forecast for' : 'Previsão para'} {t(ds.realMeta.nome.split(' · ')[0])}</b>
        <small>{en ? 'Updated' : 'Atualizado'}: {fontes}</small>
      </div>
      {linhas.map(l => {
        const [rb, rt] = RISK[l.lvl]
        return (
          <div key={l.k} className="pv-row" style={{ '--c': l.cor } as CSSProperties}>
            <div className="pv-r1">
              <span className="tile" style={{ background: rgba(l.cor, 0.12) }}><Icon k={l.ic} size={17} /></span>
              <b>{l.nome}</b>
              <span className="risk" style={{ background: rgba(rb, 0.14), color: rt }}>{t(l.lvl)}</span>
            </div>
            <p>{l.txt}</p>
            {l.provas.slice(0, 3).map(p => <div key={p} className="pv-pr">• {p}</div>)}
            {l.serie && <Barras v={l.serie} cor={l.cor} en={en} />}
            {l.alvo && <button type="button" className="pv-btn" onClick={() => onMap(l.alvo!.id)}>{t('Ver no mapa')}</button>}
          </div>
        )
      })}
      <div className="pv-nota">
        {en ? 'Forecasts cross NISAR radar, NASA LHASA and NASA FIRMS in the same area and compare with earlier periods. They are hypotheses to confirm on the ground, recalculated at every update.'
            : 'As previsões cruzam o radar NISAR, o NASA LHASA e o NASA FIRMS na mesma área e comparam com os períodos anteriores. São hipóteses a confirmar em campo, recalculadas a cada atualização.'}
      </div>
    </div>
  )
}
