// v5.5 · Comparar períodos com dados reais, pensado para ensinar:
// escolha o tipo de mudança e um período (do mais antigo ao mais recente). A tela soma tudo o que o radar achou
// entre as duas datas, conta em ordem cronológica, mostra as maiores mudanças com a hipótese de cada uma
// e explica como isso pode afetar a área. Passagens sem mudança não viram linhas de zero.
import { useApp } from '../../lib/store'
import { REAL_NAMES, realShort, type RealKind } from '../../lib/real'
import type { Ev } from '../../lib/types'
import { kmf, pos, rgba } from '../../lib/util'
import { fmtDate } from '../../lib/i18n'
import { MapBase } from '../MapBase'
import { Icon } from '../Icon'
import { SciButtons } from '../SciModal'
import { SearchBox } from '../home/SearchBox'
import { REGION_LIST } from '../../lib/regions'
import { focusEvidence, type Lang } from '../../lib/evidence'
import { focusHypothesis } from '../../lib/hypotheses'

const TIPOS: RealKind[] = ['agua', 'arvore', 'solo']
const MIN = 0.05            // km²: abaixo disso conta como "sem mudança"
const RAIO = 2              // km: focos do mesmo tipo a menos disso, em passagens diferentes, são a mesma área

const distKm = (a: { lon?: number; lat?: number }, b: { lon?: number; lat?: number }) =>
  a.lon == null || b.lon == null || a.lat == null || b.lat == null ? Infinity
    : Math.hypot((a.lon - b.lon) * 111.32 * Math.cos((a.lat * Math.PI) / 180), (a.lat - b.lat) * 110.57)

/** Área sem contar duas vezes: focos do mesmo lugar em passagens diferentes viram um grupo; o grupo vale a maior área.
 *  Também diz quanto dessa área mudou de novo em mais de uma passagem. */
function areaUnica(l: (Ev & { date: string })[]) {
  const g: { e: Ev & { date: string }; a: number; datas: Set<string> }[] = []
  for (const e of [...l].sort((x, y) => (y.a ?? 0) - (x.a ?? 0))) {
    const m = g.find(x => distKm(x.e, e) < RAIO)
    if (m) { m.a = Math.max(m.a, e.a ?? 0); m.datas.add(e.date) } else g.push({ e, a: e.a ?? 0, datas: new Set([e.date]) })
  }
  return { total: g.reduce((t, x) => t + x.a, 0), repetida: g.filter(x => x.datas.size > 1).reduce((t, x) => t + x.a, 0) }
}

const FRASE: Record<RealKind, [(a: string) => string, (a: string) => string]> = {
  agua: [a => `apareceu ${a} de água nova`, a => `${a} of new water appeared`],
  arvore: [a => `a vegetação sumiu em ${a} (desmatamento, queimada ou colheita: o radar sozinho não separa)`, a => `vegetation disappeared over ${a} (clearing, fire or harvest: radar alone cannot tell them apart)`],
  solo: [a => `a água recuou em ${a}`, a => `water receded over ${a}`],
}
const NADA: Record<RealKind, [string, string]> = {
  agua: ['o radar não achou água nova', 'the radar found no new water'],
  arvore: ['o radar não achou perda de vegetação', 'the radar found no vegetation loss'],
  solo: ['o radar não achou água recuando', 'the radar found no receding water'],
}
const EFEITO: Record<RealKind, [string, string]> = {
  agua: ['Água que aparece e fica por mais de uma passagem pode atingir casas, estradas e plantações. Água parada também favorece doenças. Vale olhar se a mesma área alaga de novo em cada período.',
    'Water that appears and stays for more than one pass can reach homes, roads and crops. Standing water also favors disease. Check whether the same area floods again in each period.'],
  arvore: ['Sem vegetação, o solo fica exposto: a chuva leva a terra (erosão), os rios ficam barrentos e, em encostas, o risco de deslizamento aumenta. Também se perde abrigo de animais e água retida no solo.',
    'Without vegetation the soil is exposed: rain washes the earth away (erosion), rivers get muddy and, on slopes, landslide risk rises. Animal habitat and water held in the soil are also lost.'],
  solo: ['Água recuando mostra uma cheia baixando. Depois dela ficam lama, estradas danificadas e solo encharcado; é a hora de avaliar danos e planejar a volta das famílias.',
    'Receding water shows a flood going down. It leaves mud, damaged roads and soaked ground behind; it is time to assess damage and plan families’ return.'],
}

export function CompareReal() {
  const { s, set, t, ds, setRegion } = useApp()
  const en = s.lang === 'en', lang = s.lang as Lang
  const k = (TIPOS.includes(s.cmp.k as RealKind) ? s.cmp.k : 'agua') as RealKind
  const setC = (p: Partial<typeof s.cmp>) => set({ cmp: { ...s.cmp, ...p } })
  const passes = [...ds.timeline].filter(p => p.img).sort((x, y) => x.date.localeCompare(y.date))
  const datas = passes.map(p => p.date)
  // período: A (início) sempre antes de B (fim). Padrão: a primeira e a última passagem.
  let a = datas.includes(s.cmp.a) ? s.cmp.a : datas[0]
  let b = datas.includes(s.cmp.b) ? s.cmp.b : datas.at(-1)
  if (a && b && a > b) [a, b] = [b, a]
  if (a && b && a === b) a = datas[Math.max(0, datas.indexOf(b) - 1)]
  const PA = passes.find(p => p.date === a), PB = passes.find(p => p.date === b)
  const dentro = passes.filter(p => p.vs && a && b && p.date > a && p.date <= b)
  const ev: (Ev & { date: string })[] = dentro.flatMap(p => p.ev.map(e => ({ ...e, date: p.date })))
  const area = (kk: string, l: Ev[] = ev) => l.filter(e => e.k === kk).reduce((x, e) => x + (e.a ?? 0), 0)
  const d = (iso: string) => fmtDate(iso, false)
  const nome = (kk: RealKind) => kk === 'arvore' ? (en ? 'vegetation lost' : 'vegetação perdida') : t(REAL_NAMES[kk]).toLowerCase()

  // por passagem, em ordem cronológica
  const porPassagem = dentro.map(p => ({ date: p.date, a: area(k, p.ev) }))
  const comMud = porPassagem.filter(x => x.a > MIN), semMud = porPassagem.filter(x => x.a <= MIN)
  const uni = areaUnica(ev.filter(e => e.k === k))
  const total = uni.total
  const top = ev.filter(e => e.k === k).sort((x, y) => (y.a ?? 0) - (x.a ?? 0)).slice(0, 3)
  const maior = top[0]

  const frase = !a || !b ? (en ? 'This region has no radar passes to compare yet.' : 'Esta região ainda não tem passagens do radar para comparar.')
    : total > MIN
      ? `${en ? 'Between' : 'Entre'} ${d(a)} ${en ? 'and' : 'e'} ${d(b)} (${dentro.length} ${en ? 'radar passes' : 'passagens do radar'}), ${FRASE[k][en ? 1 : 0](kmf(total))}.`
        + (maior ? ` ${en ? 'The biggest change was on' : 'A maior mudança foi em'} ${d(maior.date)}: ${kmf(maior.a ?? 0)} ${/^(a |\d)/.test(maior.pl) ? '' : en ? 'near ' : 'perto de '}${t(maior.pl)}.` : '')
        + (uni.repetida > MIN ? ` ${en ? `${kmf(uni.repetida)} of it changed again in more than one pass (counted once).` : `${kmf(uni.repetida)} disso mudou de novo em mais de uma passagem (contado uma vez só).`}` : '')
      : `${en ? 'Between' : 'Entre'} ${d(a)} ${en ? 'and' : 'e'} ${d(b)}, ${NADA[k][en ? 1 : 0]} ${en ? 'in this region' : 'nesta região'}.`
  const outros = TIPOS.filter(x => x !== k).map(x => ({ x, a: areaUnica(ev.filter(e => e.k === x)).total })).filter(o => o.a > MIN)
  const maxA = Math.max(MIN, ...porPassagem.map(x => x.a))

  return (
    <section className="view on" id="v-comparar" style={{ flexDirection: 'column', gap: 14 }}>
      <div className="head"><div><h1>{t('Comparar períodos')}</h1><div className="answer"><span className="dot" style={{ background: 'var(--acc)' }} /><span>{en ? 'See what changed in a region over time, from the oldest to the most recent pass.' : 'Veja o que mudou numa região ao longo do tempo, da passagem mais antiga para a mais recente.'}</span></div></div><SearchBox /></div>

      {/* 1 · filtros, na ordem em que se lê: o quê, de quando, até quando, onde */}
      <div className="bar"><div className="selects">
        <label className="sel">{en ? '1. What changed' : '1. O que mudou'}
          <select value={k} onChange={e => setC({ k: e.target.value })}>
            {TIPOS.map(x => <option key={x} value={x}>{x === 'arvore' ? (en ? 'Vegetation lost' : 'Vegetação perdida') : t(REAL_NAMES[x])}</option>)}
          </select>
        </label>
        <label className="sel">{en ? '2. From (older)' : '2. De (mais antigo)'}
          <select value={a} onChange={e => setC({ a: e.target.value, b: e.target.value >= (b ?? '') ? datas[datas.indexOf(e.target.value) + 1] ?? e.target.value : b })}>
            {datas.slice(0, -1).map(x => <option key={x} value={x}>{d(x)}</option>)}
          </select>
        </label>
        <label className="sel">{en ? '3. To (more recent)' : '3. Até (mais recente)'}
          <select value={b} onChange={e => setC({ b: e.target.value })}>
            {datas.filter(x => !a || x > a).map(x => <option key={x} value={x}>{d(x)}</option>)}
          </select>
        </label>
        <label className="sel">{en ? 'Region' : 'Região'}
          <select value={'r:' + ds.realMeta.id}
            onChange={e => { const [src, id] = e.target.value.split(':'); setRegion(id, { src: src === 'r' ? 'real' : 'demo', pin: null }) }}>
            <optgroup label={t('NISAR real')}>
              {ds.realIndex.map(m => <option key={'r' + m.id} value={'r:' + m.id}>{t(realShort(m))} · {t(m.nome.split(' · ')[0].split(' e ')[0])}</option>)}
            </optgroup>
            <optgroup label={t('Exemplo')}>
              {REGION_LIST.map(r => <option key={'d' + r.id} value={'d:' + r.id}>{t(r.name)}</option>)}
            </optgroup>
          </select>
        </label>
      </div></div>

      {/* 2 · o dado mais importante: o que mudou no período (entre os filtros e o mapa) */}
      <div className="cr-sum" style={{ borderColor: rgba(ds.types[k].c, 0.5) }}>
        <span className="ic" style={{ background: rgba(ds.types[k].c, 0.14) }}><Icon k={ds.types[k].ic} size={22} /></span>
        <div>
          <div className="cap">{en ? 'WHAT CHANGED IN THIS PERIOD' : 'O QUE MUDOU NESTE PERÍODO'}</div>
          <div className="big">{frase}</div>
          {outros.length > 0 && <div className="mut">{en ? 'In the same period' : 'No mesmo período'}: {outros.map(o => `${nome(o.x)} ${kmf(o.a)}`).join(' · ')}.</div>}
        </div>
      </div>

      <div className="cmpgrid">
        <div className="card panel">
          <div className="ph"><div style={{ flex: 1 }}><h2>{en ? 'Before and after' : 'Antes e depois'}</h2><p>{en ? 'Drag the bar: left is the start, right is the end. Icons show where it changed: faded = older, strong = more recent.' : 'Arraste a barra: à esquerda o começo, à direita o fim. Os ícones mostram onde mudou: clarinho = mais antigo, forte = mais recente.'}</p></div></div>
          <div className="map swipe">
            <MapBase className="layer" img={PA?.img ?? ds.img} />
            <div className="clip" style={{ clipPath: `inset(0 0 0 ${s.cmp.swipe}%)`, borderRight: 0, borderLeft: '2px solid var(--acc)' }}>
              <MapBase className="layer" img={PB?.img ?? ds.img}>
                {ev.filter(e => e.k === k).map(e => {
                  const c = ds.types[e.k].c, idade = dentro.length > 1 ? dentro.findIndex(p => p.date === e.date) / (dentro.length - 1) : 1
                  return (
                    <span key={e.date + e.id} className="mk obs" title={`${t(REAL_NAMES[e.k as RealKind])} · ${d(e.date)} · ${kmf(e.a ?? 0)} · ${t(e.pl)}`}
                      style={{ ...pos(e.x, e.y), background: c, color: '#fff', opacity: 0.35 + 0.65 * idade, zIndex: 2 + Math.round(idade * 2), boxShadow: `0 0 12px ${rgba(c, 0.5)}` }}>
                      <Icon k={ds.types[e.k].ic} size={14} />
                    </span>
                  )
                })}
              </MapBase>
            </div>
            <span className="float swl" style={{ left: 12 }}>{en ? 'Start' : 'Começo'} · {a ? d(a) : '—'}</span><span className="float swl" style={{ right: 12 }}>{en ? 'End' : 'Fim'} · {b ? d(b) : '—'}</span>
            <input type="range" min={0} max={100} value={s.cmp.swipe} onChange={e => setC({ swipe: +e.target.value })} aria-label={t('Posição da comparação')} />
          </div>
        </div>

        <div className="card diff cr">
          {/* linha do tempo, do mais antigo ao mais recente, só com o que mudou */}
          <div className="cap">{en ? 'STEP BY STEP (OLDEST → NEWEST)' : 'PASSO A PASSO (DO MAIS ANTIGO AO MAIS RECENTE)'}</div>
          {comMud.length ? (
            <ol className="cr-tl">
              {porPassagem.map(x => x.a > MIN && (
                <li key={x.date}>
                  <b>{d(x.date)}</b>
                  <span className="bar"><i style={{ width: `${(x.a / maxA) * 100}%`, background: ds.types[k].c }} /></span>
                  <span>{kmf(x.a)}</span>
                </li>
              ))}
            </ol>
          ) : <div className="mut">{en ? 'No pass in this period showed this change.' : 'Nenhuma passagem deste período mostrou essa mudança.'}</div>}
          {comMud.length > 0 && <div className="mut">{en ? 'Area that changed in each pass, compared with the pass before.' : 'Área que mudou em cada passagem, comparada com a passagem anterior.'}</div>}
          {semMud.length > 0 && comMud.length > 0 && <div className="mut">{en ? 'No change on' : 'Sem mudança em'} {semMud.map(x => d(x.date)).join(', ')}.</div>}

          {/* as maiores mudanças, com a hipótese de cada uma */}
          {top.length > 0 && <>
            <div className="cap" style={{ marginTop: 6 }}>{en ? 'BIGGEST CHANGES AND LIKELY CAUSE' : 'MAIORES MUDANÇAS E CAUSA PROVÁVEL'}</div>
            {top.map(e => {
              const evd = focusEvidence(e, ds.timeline, { vs: dentro.find(p => p.date === e.date)?.vs ?? '', date: e.date }, lang)
              const h = evd ? focusHypothesis(e.k, evd, e.a, ds.realMeta.id, lang, { lon: e.lon, lat: e.lat }, ds.realMeta.evento) : null
              return (
                <div key={e.date + e.id} className="cr-top">
                  <div><b>{kmf(e.a ?? 0)}</b> · {t(e.pl)} · {d(e.date)}</div>
                  {h && <div className="h">🧪 {h.text}</div>}
                </div>
              )
            })}
          </>}

          <div className="cap" style={{ marginTop: 6 }}>{en ? 'HOW THIS CAN AFFECT THE AREA' : 'COMO ISSO PODE AFETAR A ÁREA'}</div>
          <div className="cr-ef">{EFEITO[k][en ? 1 : 0]}</div>
          <SciButtons kind={k} />
        </div>
      </div>
    </section>
  )
}
