import type { CSSProperties } from 'react'
import { useApp } from '../../lib/store'
import { MN } from '../../lib/demo'
import { REAL_NAMES, type RealKind } from '../../lib/real'
import type { Ev, EvType } from '../../lib/types'
import { evMonth, kmf, lvlOf, pos, rgba } from '../../lib/util'
import { fmtDate } from '../../lib/i18n'
import { Heat, MapBase } from '../MapBase'
import { Icon } from '../Icon'

/** Estatísticas reais de um tipo (focos, área e grau médio) — usado na versão celular */
export function useRealStats() {
  const { ds } = useApp()
  return (k: string) => {
    const l = ds.real.ev.filter(e => e.k === k)
    const a = l.reduce((t, e) => t + (e.a ?? 0), 0)
    const g = l.length ? Math.round(l.reduce((t, e) => t + (ds.info[e.id]?.g ?? 0), 0) / l.length) : 0
    return { n: l.length, a, g }
  }
}
export function realSentence(k: string, n: number, a: number, A: string, B: string) {
  const ff = n === 1 ? '1 foco' : `${n} focos`
  return ({
    agua: `Entre ${A} e ${B} apareceu ${kmf(a)} de água nova (${ff}).`,
    arvore: `Entre ${A} e ${B} o radar achou ${kmf(a)} de floresta perdida (${ff}).`,
    solo: `Entre ${A} e ${B} a água recuou em ${kmf(a)} (${ff}).`,
  } as Record<string, string>)[k]
}

const DEMO_TYPES: EvType[] = ['fogo', 'agua', 'arvore', 'solo']
const REAL_TYPES: RealKind[] = ['agua', 'arvore', 'solo']

/** Focos e imagem de cada lado da comparação */
function useSides() {
  const { s, ds } = useApp()
  const real = s.src === 'real'
  if (real) {
    const passes = ds.timeline.filter(p => p.img)
    const find = (d: string, fb: number) => passes.find(p => p.date === d) ?? passes[Math.max(0, passes.length + fb)] ?? null
    const pa = passes.find(p => p.date === s.cmp.a) ?? find(ds.real.meta.antes.data, -2), pb = find(s.cmp.b, -1)
    return {
      passes,
      A: { ev: pa?.ev ?? [], img: pa?.img ?? ds.img, label: pa ? fmtDate(pa.date) : ds.rd.a, key: pa?.date ?? '' },
      B: { ev: pb?.ev ?? ds.real.ev, img: pb?.img ?? ds.img, label: pb ? fmtDate(pb.date) : ds.rd.b, key: pb?.date ?? '' },
    }
  }
  const month = (m: string) => ds.ev.filter(e => e.st === 'obs' && evMonth(e.d)[0] === m)
  return {
    passes: [],
    A: { ev: month(s.cmp.a), img: ds.img, label: MN[s.cmp.a], key: s.cmp.a },
    B: { ev: month(s.cmp.b), img: ds.img, label: MN[s.cmp.b], key: s.cmp.b },
  }
}

/** Ícones dos focos em um lado do mapa */
function Marks({ ev, focus }: { ev: Ev[]; focus: string }) {
  const { t, ds } = useApp()
  return (
    <>
      {ev.map(e => {
        const c = ds.types[e.k].c
        return (
          <span key={e.id} className="mk obs" title={t(`${ds.types[e.k].s} em ${e.pl}`)}
            style={{ ...pos(e.x, e.y), background: c, color: '#fff', opacity: focus === e.k ? 1 : 0.55, zIndex: focus === e.k ? 3 : 2, boxShadow: `0 0 12px ${rgba(c, 0.5)}` }}>
            <Icon k={ds.types[e.k].ic} size={14} />
          </span>
        )
      })}
    </>
  )
}

export function Compare() {
  const { s, set, t, ds, go } = useApp()
  const real = s.src === 'real'
  const { k, a, b, swipe } = s.cmp
  const setC = (p: Partial<typeof s.cmp>) => set({ cmp: { ...s.cmp, ...p } })
  const color = ds.types[k as 'agua'].c
  const { passes, A, B } = useSides()
  const types: EvType[] = real ? REAL_TYPES : DEMO_TYPES
  const count = (ev: Ev[], kk: string) => ev.filter(e => e.k === kk).length
  const area = (ev: Ev[], kk: string) => ev.filter(e => e.k === kk).reduce((x, e) => x + (e.a ?? 0), 0)

  let sentence: string, why: string, rows: [string, string, number, number][], scaleA: number
  if (real) {
    const nA = count(A.ev, k), nB = count(B.ev, k), aA = area(A.ev, k), aB = area(B.ev, k), mx = Math.max(aA, aB, 0.01), nmx = Math.max(nA, nB, 1)
    const name = REAL_NAMES[k as RealKind].toLowerCase()
    sentence = `Em ${B.label} o radar achou ${nB} ${nB === 1 ? 'foco' : 'focos'} de ${name}; em ${A.label} foram ${nA}.`
    why = ds.cmp[k].why
    const g = Math.min(100, Math.round(Math.abs(nB - nA) * 8))
    rows = [['Área que mudou', `${kmf(aA)} → ${kmf(aB)}`, aA / mx, aB / mx], ['Focos detectados', `${nA} → ${nB}`, nA / nmx, nB / nmx], ['Grau de mudança', `${lvlOf(g)} · ${g}/100`, 0, g / 100]]
    scaleA = 1
  } else {
    const d = ds.cmp[k], va = d.A![a], vb = d.B![b], pct = Math.round(((vb - va) / va) * 100)
    sentence = ({
      agua: `A área alagada ${pct >= 0 ? 'cresceu' : 'diminuiu'} ${Math.abs(pct)}% entre ${MN[a].toLowerCase()} e ${MN[b].toLowerCase()}.`,
      fogo: `A área queimada ${pct >= 0 ? 'cresceu' : 'diminuiu'} ${Math.abs(pct)}% entre ${MN[a].toLowerCase()} e ${MN[b].toLowerCase()}.`,
      arvore: `A floresta perdida ${pct >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(pct)}% entre ${MN[a].toLowerCase()} e ${MN[b].toLowerCase()}.`,
    } as Record<string, string>)[k]
    why = d.why
    const g = Math.min(100, (Math.abs(pct) * 1.2) | 0), mx = Math.max(va, vb)
    rows = [['Área afetada', `${va.toLocaleString('pt-BR')} → ${vb.toLocaleString('pt-BR')} km²`, va / mx, vb / mx], ['Grau de mudança', `${lvlOf(g)} · ${g}/100`, 0, g / 100]]
    scaleA = Math.max(0.4, va / vb)
  }
  const heat = (scale: number) => ds.cmp[k].heat.map(([x, y, r], i) => <Heat key={i} x={x} y={y} r={r * scale} color={rgba(color, 0.55)} blur={14} />)
  const byType = types.map(kk => ({ kk, nA: count(A.ev, kk), nB: count(B.ev, kk) }))
  const maxN = Math.max(1, ...byType.flatMap(x => [x.nA, x.nB]))

  return (
    <section className="view on" id="v-comparar" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head"><div><h1>{t('Comparar períodos')}</h1><div className="answer"><span className="dot" style={{ background: 'var(--acc)' }} /><span>{t(sentence)}</span></div></div></div>
      <div className="bar"><div className="selects">
        <label className="sel">{t('Tipo de mudança')}
          <select value={k} onChange={e => setC({ k: e.target.value })}>
            {real ? REAL_TYPES.map(x => <option key={x} value={x}>{t(REAL_NAMES[x])}</option>)
              : [['agua', 'Enchentes'], ['fogo', 'Queimadas'], ['arvore', 'Desmatamento']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </label>
        <label className="sel">{t('Período A (antes)')}
          <select value={real ? A.key : a} onChange={e => setC({ a: e.target.value })}>
            {real ? passes.map(p => <option key={p.date} value={p.date}>{t(`Passagem de ${fmtDate(p.date)}`)}</option>)
              : [['jul', 'Julho 2026'], ['ago', 'Agosto 2026'], ['set', 'Setembro 2026']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </label>
        <label className="sel">{t('Período B (depois)')}
          <select value={real ? B.key : b} onChange={e => setC({ b: e.target.value })}>
            {real ? passes.map(p => <option key={p.date} value={p.date}>{t(`Passagem de ${fmtDate(p.date)}`)}</option>)
              : [['out', 'Outubro 2026'], ['nov', 'Novembro 2026 (até dia 10)']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </label>
        <label className="sel">{t('Região')}
          <select>{real ? <option>{t('Rio Madeira · sul do Amazonas')}</option> : (ds.region.id === 'sul' ? ['Sul do Brasil (PR, SC e RS)', 'Rio Grande do Sul', 'Santa Catarina', 'Paraná'] : ['Amazônia (todos os estados)', 'Amazonas', 'Pará']).map(r => <option key={r}>{t(r)}</option>)}</select>
        </label>
      </div></div>
      <div className="cmpgrid">
        <div className="card panel">
          <div className="ph"><div style={{ flex: 1 }}><h2>{t('Antes e depois')}</h2><p>{t('Arraste a barra para comparar os dois períodos no mesmo mapa')}</p></div></div>
          <div className="map swipe">
            <MapBase className="layer" img={A.img}>{!real && heat(scaleA)}<Marks ev={A.ev} focus={k} /></MapBase>
            <div className="clip" style={{ clipPath: `inset(0 0 0 ${swipe}%)`, borderRight: 0, borderLeft: '2px solid var(--acc)' }}>
              <MapBase className="layer" img={B.img}>{!real && heat(1)}<Marks ev={B.ev} focus={k} /></MapBase>
            </div>
            <span className="float swl" style={{ left: 12 }}>{t(`A · ${A.label}`)}</span><span className="float swl" style={{ right: 12 }}>{t(`B · ${B.label}`)}</span>
            <input type="range" min={0} max={100} value={swipe} onChange={e => setC({ swipe: +e.target.value })} aria-label={t('Posição da comparação')} />
          </div>
        </div>
        <div className="card diff">
          <div className="cap">{t('RESUMO EM UMA FRASE')}</div>
          <div className="big">{t(sentence)}</div>

          {/* focos por tipo em cada período */}
          <div className="mt-1 rounded-lg p-3" style={{ background: 'linear-gradient(160deg,#071427,#0C2342 55%,#102D55)', boxShadow: '0 10px 24px rgba(5,16,34,.25), inset 0 0 0 1px rgba(120,170,230,.16)' }}>
            <div className="mb-2 flex items-center text-[11px] font-extrabold uppercase tracking-[.12em] text-[#C8DEFA]">
              <span className="flex-1">{t('Focos por tipo')}</span>
              <span className="w-[54px] text-center">A</span><span className="w-[54px] text-center">B</span>
            </div>
            {byType.map(({ kk, nA, nB }) => {
              const c = ds.types[kk].c, d = nB - nA
              return (
                <button key={kk} onClick={() => real || ds.cmp[kk] ? setC({ k: kk }) : undefined}
                  className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-white transition hover:bg-white/10"
                  style={{ '--c': c, outline: k === kk ? `1px solid ${rgba(c, 0.7)}` : undefined, background: k === kk ? rgba(c, 0.18) : undefined } as CSSProperties}>
                  <Icon k={ds.types[kk].ic} size={16} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{t(real ? REAL_NAMES[kk as RealKind] : ds.types[kk].n)}</span>
                    <span className="mt-1 flex h-1.5 gap-0.5">
                      <i className="block rounded-full bg-white/30" style={{ width: `${(nA / maxN) * 50}%` }} />
                      <i className="block rounded-full" style={{ width: `${(nB / maxN) * 50}%`, background: c }} />
                    </span>
                  </span>
                  <span className="w-[54px] text-center text-[15px] font-extrabold text-[#C8DEFA]">{nA}</span>
                  <span className="w-[54px] text-center text-[15px] font-extrabold">{nB}
                    <small className="ml-1 text-[10.5px] font-bold" style={{ color: d > 0 ? '#FF8A7A' : d < 0 ? '#7FD99A' : '#C8DEFA' }}>{d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '='}</small>
                  </span>
                </button>
              )
            })}
            <div className="mt-1.5 text-[11px] text-[#C8DEFA]/70">{t(real ? 'Focos encontrados em cada passagem do NISAR' : 'Focos detectados em cada mês')}</div>
          </div>

          <div>
            {rows.map(([n, v, pa, pb]) => (
              <div key={n} className="drow">
                <span className="n">{t(n)}</span><span className="v">{t(v)}</span>
                <div className="bars">
                  {pa ? <i style={{ width: `${pa * 100}%`, background: '#C2C7CE' }} /> : null}
                  <i style={{ width: `${pb * 100}%`, background: n === 'Grau de mudança' ? 'linear-gradient(90deg,#F29900,#D93025)' : 'var(--acc)' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="why"><b>{t('Causa provável')}</b><span>{t(why)}</span></div>
          <div className="btns"><button className="btn pri">{t('Compartilhar imagem')}</button><button className="btn" onClick={() => go('inicio')}>{t('Voltar ao início')}</button></div>
        </div>
      </div>
    </section>
  )
}
