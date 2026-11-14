// v5.3 · Aba "Previsão" da região escolhida: um resumo por tipo de perigo, recalculado sempre que os dados mudam
// (cada passagem do NISAR, e todo dia com LHASA e FIRMS). Cruza fontes e compara com os períodos anteriores.
import type { CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import type { Alert, Level } from '../../lib/types'
import { RISK } from '../../lib/demo'
import { dia, fogoResumo } from '../../lib/riscos'
import { rgba } from '../../lib/util'
import { Icon } from '../Icon'
import { recomendacao } from '../../lib/acao'

const ORD: Record<Level, number> = { Alto: 0, 'Médio': 1, Baixo: 2 }
const pior = (xs: (Level | undefined)[]): Level => (xs.filter(Boolean) as Level[]).sort((a, b) => ORD[a] - ORD[b])[0] ?? 'Baixo'

function Barras({ v, cor, en }: { v: { d: string; a: number }[]; cor: string; en: boolean }) {
  if (v.length < 2) return null
  const max = Math.max(...v.map(x => x.a), 0.01)
  return (
    <div className="pv-bars" aria-label={en ? 'Trend per radar pass' : 'Tendência por passagem do radar'}>
      {v.map(x => (
        <span key={x.d} title={`${x.d}: ${x.a.toFixed(2)} km²`}>
          <i style={{ height: x.a > 0.05 ? `${Math.max(8, (x.a / max) * 100)}%` : '3px', background: x.a > 0.05 ? cor : '#C9CDD3' }} />
          <small>{x.d}</small>
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
  /** resumo da série: em vez de repetir períodos zerados, diz em quantas passagens houve mudança e qual foi a maior */
  const tendencia = (k: string, nome: [string, string]) => {
    const v = serie(k), com = v.filter(x => x.a > 0.05)
    if (!v.length) return null
    if (!com.length) return en ? `No ${nome[1]} in the last ${v.length} radar passes: stable.` : `Nenhuma ${nome[0]} nas últimas ${v.length} passagens do radar: estável.`
    const maior = com.reduce((a, b) => (b.a > a.a ? b : a))
    const ultimo = v.at(-1)!
    return en ? `${nome[1][0].toUpperCase() + nome[1].slice(1)} in ${com.length} of the last ${v.length} passes; largest on ${maior.d} (${n2(maior.a)} km²)${ultimo.a > 0.05 ? `; latest: ${n2(ultimo.a)} km²` : '; none in the latest pass'}.`
              : `${nome[0][0].toUpperCase() + nome[0].slice(1)} em ${com.length} das últimas ${v.length} passagens; maior em ${maior.d} (${n2(maior.a)} km²)${ultimo.a > 0.05 ? `; na última: ${n2(ultimo.a)} km²` : '; nenhuma na última'}.`
  }
  const fr = fogoResumo(fo)

  type Linha = { k: string; ic: string; cor: string; nome: string; lvl: Level; txt: string; provas: string[]; alvo: Alert | undefined; serie?: { d: string; a: number }[] }
  const linhas: Linha[] = []

  // alagamento
  {
    const pv = prev('agua'), dA = delta('agua')
    const cresce = dA && dA.a1 > dA.a0 * 1.2 && dA.a1 > 0.5
    const lvl = pior([...pv.map(a => a.lvl), cresce ? 'Médio' : undefined])
    linhas.push({
      k: 'agua', ic: 'agua', cor: '#2F8CE0', nome: en ? 'Flooding' : 'Alagamento', lvl, alvo: pv[0], serie: serie('agua'),
      txt: pv[0] ? t(pv[0].t) : tendencia('agua', ['água nova', 'new water']) ?? (en ? 'No radar comparison yet.' : 'Ainda sem comparação do radar.'),
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
      provas: pv[0]?.provas ?? [...(det.length ? [en ? `NISAR: ${det.length} spot(s) of new material on slopes` : `NISAR: ${det.length} ponto(s) de material novo em encostas`] : []), ...[tendencia('arvore', ['perda de vegetação', 'vegetation loss'])].filter((x): x is string => !!x)],
    })
  }
  // queimadas
  {
    const pv = prev('fogo')
    const top = fr.risco[0]
    const lvl = pior([...pv.map(a => a.lvl), ...fr.risco.map(g => g.nivel)])
    linhas.push({
      k: 'fogo', ic: 'fogo', cor: '#E2553A', nome: en ? 'Risky fires' : 'Queimadas de risco', lvl, alvo: pv[0] ?? al.find(a => a.id?.startsWith('r-f-')),
      txt: pv[0] ? t(pv[0].t) : fo ? (fr.risco.length
        ? (en ? `${fr.risco.length} risky fire(s) in ${fo.janela_h} h; largest: ${top.n} heat spots near ${top.lugar}.` : `${fr.risco.length} ${fr.risco.length === 1 ? 'queimada de risco' : 'queimadas de risco'} em ${fo.janela_h} h; a maior: ${top.n} focos perto de ${top.lugar}.`)
        : (en ? `No risky fire in the last ${fo.janela_h} h.` : `Nenhuma queimada de risco nas últimas ${fo.janela_h} h.`)) : (en ? 'Waiting for NASA FIRMS data.' : 'Aguardando dados do NASA FIRMS.'),
      provas: pv[0]?.provas ?? [
        ...(fr.nPeq ? [en ? `${fr.nPeq} small burn(s) (1–2 weak spots, likely controlled: trash, crop residue) are on the map but do not raise alerts.` : `${fr.nPeq} ${fr.nPeq === 1 ? 'pequena queima' : 'pequenas queimas'} (1–2 focos fracos, provável queima controlada: lixo, palha) ${fr.nPeq === 1 ? 'fica' : 'ficam'} no mapa, sem alerta.`] : []),
        ...(fr.risco.length ? [en ? 'If the vegetation burned, the next radar pass should show HV dropping there.' : 'Se a vegetação queimou, a próxima passagem do radar deve mostrar o HV caindo ali.'] : []),
      ],
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
  // perigo baixo e sem previsão: vai para um bloco compacto "Sem perigo agora", sem repetir números zerados
  const calma = (l: Linha) => l.lvl === 'Baixo' && !prev(l.k).length
  const ativas = linhas.filter(l => !calma(l)), calmas = linhas.filter(calma)

  const fontes = [ult && `NISAR ${dia(ult.date, en)}`, lh && `LHASA ${dia(lh.data, en)}`, r && `FIRMS ${dia(r.atualizado, en)}`].filter(Boolean).join(' · ')
  return (
    <div className="pv">
      <div className="pv-h">
        <b>{en ? 'Forecast for' : 'Previsão para'} {t(ds.realMeta.nome.split(' · ')[0])}</b>
        <small>{en ? 'Updated' : 'Atualizado'}: {fontes} · <a href="https://nisar.jpl.nasa.gov/" target="_blank" rel="noreferrer">NISAR</a>, <a href="https://gpm.nasa.gov/landslides/projects.html" target="_blank" rel="noreferrer">LHASA</a>, <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer">FIRMS</a> ↗</small>
      </div>
      {ativas.map(l => {
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
            <div className="pv-acao"><b>{en ? 'Suggested response' : 'Sugestão'}:</b> {recomendacao({ ty: l.k, lvl: l.lvl } as Alert, s.lang)}</div>
            {l.serie && l.serie.filter(x => x.a > 0.05).length >= 2 && <Barras v={l.serie} cor={l.cor} en={en} />}
            {l.alvo && <button type="button" className="pv-btn" onClick={() => onMap(l.alvo!.id)}>{t('Ver no mapa')}</button>}
          </div>
        )
      })}
      {!ativas.length && <div className="pv-ok">{en ? 'No medium or high danger in this region right now.' : 'Nenhum perigo médio ou alto nesta região agora.'}</div>}
      {calmas.length > 0 && (
        <div className="pv-calm">
          <b>{en ? 'Low danger now' : 'Perigo baixo agora'}</b>
          {calmas.map(l => (
            <div key={l.k} className="pv-c1">
              <span className="tile" style={{ background: rgba(l.cor, 0.12) }}><Icon k={l.ic} size={14} /></span>
              <span><b>{l.nome}:</b> {l.txt}</span>
            </div>
          ))}
        </div>
      )}
      <div className="pv-nota">
        {en ? 'Forecasts cross NISAR radar, NASA LHASA and NASA FIRMS in the same area and compare with earlier periods. They are hypotheses to confirm on the ground, recalculated at every update. Suggested responses are general guidance: decisions belong to local authorities (civil defense, firefighters).'
            : 'As previsões cruzam o radar NISAR, o NASA LHASA e o NASA FIRMS na mesma área e comparam com os períodos anteriores. São hipóteses a confirmar em campo, recalculadas a cada atualização. As sugestões de resposta são orientações gerais: a decisão é das autoridades locais (Defesa Civil, bombeiros).'}
      </div>
    </div>
  )
}
