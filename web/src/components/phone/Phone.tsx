import type { CSSProperties, ReactNode } from 'react'
import { useApp, type PhoneTab } from '../../lib/store'
import { MES, MES_LONGO, RISK, TORNADO_C } from '../../lib/demo'
import type { Ev, Info } from '../../lib/types'
import { cx, evMonth, kmf, lvlOf, pos, rgba } from '../../lib/util'
import { REAL_NAMES, type RealKind } from '../../lib/real'
import { Icon } from '../Icon'
import { useRealStats, realSentence } from '../compare/Compare'
import brandIcon from '../../assets/brand-icon.webp'
import wordDark from '../../assets/brand-word-dark.webp'

const PW = 560, PH = Math.round((560 * 508) / 746)

export function PhoneView() {
  const { t } = useApp()
  const why: [string, string][] = [
    ['Por que alertas primeiro?', 'Em campo, a pergunta é “preciso agir agora?”. A tela abre respondendo isso, sem exigir zoom no mapa.'],
    ['Toque de pelo menos 44 px', 'Botões e cards grandes para usar com uma mão, em pé, no barco ou no carro.'],
    ['Leve para internet fraca', 'O mapa carrega como imagem simples e só baixa detalhes quando a pessoa toca em um foco.'],
    ['Mesma linguagem do desktop', 'Cores, ícones e níveis de risco iguais: quem aprendeu em um aparelho já sabe usar no outro.'],
  ]
  return (
    <section className="view on" id="v-celular" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head"><div><h1>{t('Versão celular')}</h1><div className="answer">{t('Pensada para a Ana Clara em campo: alertas primeiro, toque grande, pouca internet.')}</div></div></div>
      <div className="phonewrap">
        <Phone />
        <div className="why-list">{why.map(([h, p]) => <div key={h} className="card"><h3>{t(h)}</h3><p>{t(p)}</p></div>)}</div>
      </div>
    </section>
  )
}

function Phone() {
  const { s, set, t } = useApp()
  const tab = s.phone.tab
  const tabs: [PhoneTab, string, string][] = [['alertas', 'sino', 'Alertas'], ['mapa', 'mapa', 'Mapa'], ['comparar', 'grafico', 'Comparar'], ['sobre', 'info', 'Sobre']]
  return (
    <div className="phone"><div className="notch" />
      <div className="ph-in" id="phone">
        <PhoneHead />
        {tab === 'alertas' ? <PAlerts /> : tab === 'mapa' ? <PMap /> : tab === 'comparar' ? <PCompare /> : <PAbout />}
      </div>
      <nav className="tabbar">
        {tabs.map(([k, ic, l]) => <button key={k} className={cx(tab === k && 'on')} onClick={() => set({ phone: { ...s.phone, tab: k } })}><Icon k={ic} />{t(l)}</button>)}
      </nav>
    </div>
  )
}

function PhoneHead() {
  const { t, periodLabel } = useApp()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src={brandIcon} alt="" width={30} height={30} style={{ borderRadius: 8 }} />
      <img src={wordDark} alt="A.R.K.O" style={{ height: 13 }} />
      <span className="pill" style={{ marginLeft: 'auto' }}><Icon k="cal" size={13} />{t(periodLabel())}</span>
    </div>
  )
}

function PhoneMap({ children, h = 300 }: { children?: ReactNode; h?: number }) {
  const { s, ds } = useApp()
  const real = s.src === 'real'
  return (
    <div style={{ position: 'relative', height: h, overflow: 'hidden', borderRadius: 12, border: '1px solid #0E2238', background: '#2C5B82', flex: 'none' }}>
      <div style={{ position: 'absolute', left: real ? -150 : ds.region.phone.left, top: real ? -90 : ds.region.phone.top, width: PW, height: PH, background: `url(${ds.img}) 0 0/100% 100% no-repeat` }}>{children}</div>
    </div>
  )
}

function PAlerts() {
  const { s, set, t, ds } = useApp()
  const high = ds.alerts.filter(a => a.lvl === 'Alto').length
  return (
    <>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>{t(high === 1 ? '1 alerta de alto risco perto de você' : `${high} alertas de alto risco perto de você`)}</h1>
        <p style={{ color: 'var(--mu)', fontSize: 13, marginTop: 6 }}>{t(`${s.src === 'real' ? 'Novo Aripuanã e região' : s.region === 'sul' ? 'Porto Alegre e região' : 'Manaus e região'} · toque em um alerta para ver no mapa`)}</p>
      </div>
      {ds.alerts.map((a, i) => {
        const c = a.ty === 'tornado' ? TORNADO_C : ds.types[a.ty].c
        const [rb, rt] = RISK[a.lvl]
        return (
          <button key={i} className="al" style={{ padding: 14, '--c': c } as CSSProperties} onClick={() => { if (a.id) set({ phone: { ...s.phone, sel: a.id, type: 'todos', tab: 'mapa' } }) }}>
            <div className="r1">
              <span className="tile" style={{ width: 40, height: 40, background: rgba(c, 0.12), color: c }}><Icon k={a.ty === 'tornado' ? 'tornado' : ds.types[a.ty].ic} size={20} /></span>
              <div style={{ flex: 1 }}><h4 style={{ fontSize: 14.5 }}>{t(a.t)}</h4><div className="loc">{t(`${a.l} · ${a.pz}`)}</div></div>
              <span className="risk" style={{ background: rgba(rb, 0.14), color: rt }}>{t(a.lvl)}</span>
            </div>
            <p style={{ fontSize: 13 }}>{t(a.m)}</p>
            <div className="ft">{a.src !== 'NISAR' ? <span className="ext">{t('Fonte externa: meteorologia')}</span> : t('Fonte: NISAR')}{a.id && <a style={{ marginLeft: 'auto' }}>{t('Ver no mapa →')}</a>}</div>
          </button>
        )
      })}
      <button className="btn pri" style={{ height: 48, flex: 'none' }}>{t('Avisar minha equipe')}</button>
    </>
  )
}

function evInfo(e: Ev, info: Record<string, Info>, s: string): Info {
  if (info[e.id]) return info[e.id]
  const mm = evMonth(e.d)
  return {
    t: e.pl, sub: e.st === 'prev' ? 'Previsão para os próximos dias' : `Detectado em ${MES_LONGO[MES.indexOf(mm)]} de 2026`, m: e.st === 'prev' ? 'Risco em análise' : `${e.n * 4} km²`,
    d: e.st === 'prev' ? '' : '▲ vs. período anterior', g: e.st === 'prev' ? 50 : Math.min(95, 40 + e.n * 2), st: e.st === 'prev' ? 'Previsto' : 'Observado',
    why: e.st === 'prev' ? 'Dados do radar e do tempo indicam que o evento pode acontecer. Veja a aba Alertas.' : `O radar detectou ${s.toLowerCase()} nesta área no período escolhido.`,
  }
}

function PMap() {
  const { s, set, t, ds, inRange } = useApp()
  const ph = s.phone
  const setP = (p: Partial<typeof ph>) => set({ phone: { ...ph, ...p } })
  const base = ds.ev.filter(e => e.st !== 'cl' && (e.st === 'prev' ? s.prev : inRange(e.d)))
  const cnt: Record<string, number> = { todos: 0 }
  base.filter(e => e.st !== 'prev').forEach(e => { cnt[e.k] = (cnt[e.k] ?? 0) + 1; cnt.todos++ })
  const shown = base.filter(e => ph.type === 'todos' || e.k === ph.type)
  const se = shown.find(e => e.id === ph.sel)
  const mc = (e: Ev) => (s.colorBy === 'mes' && e.st !== 'prev' ? evMonth(e.d)[3] : ds.types[e.k].c)
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 'none' }} role="group" aria-label={t('Filtrar por tipo')}>
        {(['todos', 'fogo', 'agua', 'arvore', 'solo'] as const).map(k => {
          const on = ph.type === k, col = k === 'todos' ? '#5F6670' : ds.types[k].c
          return (
            <button key={k} className={cx('chip', on && 'on', k === 'todos' && 'all')} aria-pressed={on} style={{ '--c': col, flex: 'none', height: 36 } as CSSProperties} onClick={() => setP({ type: k })}>
              <span style={{ color: col, display: 'flex' }}><Icon k={k === 'todos' ? 'todos' : ds.types[k].ic} size={15} /></span>{t(k === 'todos' ? 'Todos' : ds.types[k].n)}<span className="n">{cnt[k] ?? 0}</span>
            </button>
          )
        })}
      </div>
      <PhoneMap>
        {shown.map(e => {
          const c = mc(e)
          return (
            <button key={e.id} className={cx('mk', e.st, ph.sel === e.id && 'sel')} aria-label={t(`${ds.types[e.k].s} em ${e.pl}`)}
              style={{ ...pos(e.x, e.y), width: 30, height: 30, margin: '-15px 0 0 -15px', ...(e.st === 'obs' ? { background: c, color: '#fff' } : { color: c }) }}
              onClick={() => setP({ sel: e.id })}>
              <Icon k={ds.types[e.k].ic} size={15} />
            </button>
          )
        })}
      </PhoneMap>
      {se ? (() => {
        const i = evInfo(se, ds.info, ds.types[se.k].s), c = ds.types[se.k].c
        return (
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, borderColor: 'var(--bd2)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="tag" style={{ background: rgba(c, 0.14), color: c }}>{t(ds.types[se.k].s)}</span>
              <span className="tag" style={{ background: 'rgba(251,191,36,.14)', color: '#F29900' }}>{t(i.st)}</span>
              <button onClick={() => setP({ sel: null })} style={{ marginLeft: 'auto', width: 32, height: 32, display: 'grid', placeItems: 'center', color: 'var(--mu)' }} aria-label={t('Fechar')}><Icon k="x" size={16} /></button>
            </div>
            <div><h3 style={{ fontSize: 16, fontWeight: 600 }}>{t(i.t)}</h3><div style={{ fontSize: 12.5, color: 'var(--mu)' }}>{t(i.sub)}</div></div>
            <div className="metric"><b>{t(i.m)}</b><span style={{ color: 'var(--red2)', fontSize: 12 }}>{t(i.d)}</span></div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}><span style={{ color: 'var(--mu)' }}>{t('Grau de mudança')}</span><b style={{ color: 'var(--red2)' }}>{t(`${lvlOf(i.g)} · ${i.g}/100`)}</b></div>
              <div className="gbar"><i style={{ width: `${i.g}%` }} /></div>
            </div>
            <div className="why"><b>{t('O que isso significa?')}</b>{t(i.why)}</div>
            <div className="btns">
              <button className="btn pri" style={{ height: 44 }} onClick={() => setP({ cType: ds.cmp[se.k] ? se.k : s.src === 'real' ? 'arvore' : 'agua', when: 'depois', tab: 'comparar' })}>{t('Comparar períodos')}</button>
              <button className="btn" style={{ height: 44 }}>{t('Compartilhar')}</button>
            </div>
          </div>
        )
      })() : (
        <div className="note"><Icon k="info" size={16} /><span>{t(shown.length ? 'Toque em um foco no mapa para ver o que mudou.' : 'Nenhum foco desse tipo no período. Escolha outro filtro.')}</span></div>
      )}
    </>
  )
}

function PCompare() {
  const { s, set, t, ds } = useApp()
  const ph = s.phone
  const setP = (p: Partial<typeof ph>) => set({ phone: { ...ph, ...p } })
  const stats = useRealStats()
  const real = s.src === 'real'
  const k = ds.cmp[ph.cType] ? ph.cType : real ? 'arvore' : 'agua'
  const c = ds.types[k as 'agua'].c
  const blob = (x: number, y: number, r: number, i: number, a1: number, blur: number) => (
    <div key={i} style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', left: `${((x - r) / 746) * 100}%`, top: `${((y - r * 0.75) / 508) * 100}%`, width: `${((r * 2) / 746) * 100}%`, height: `${((r * 1.5) / 508) * 100}%`, background: `radial-gradient(closest-side,${rgba(c, a1)},${rgba(c, 0.35)} 60%,${rgba(c, 0)})`, filter: `blur(${blur}px)` }} />
  )
  const goMap = () => setP({ type: k as 'agua', sel: null, tab: 'mapa' })
  if (real) {
    const st = stats(k)
    const heat = ph.when === 'antes' ? null : ds.cmp[k].heat.map(([x, y, r], i) => blob(x, y, r, i, 0.8, 3))
    return (
      <>
        <div className="seg" role="group" aria-label={t('Tipo de mudança')} style={{ flex: 'none' }}>
          {(Object.keys(REAL_NAMES) as RealKind[]).map(kk => <button key={kk} className={cx(kk === k && 'on')} style={{ flex: 1 }} onClick={() => setP({ cType: kk })}>{t(REAL_NAMES[kk])}</button>)}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{t(realSentence(k, st.n, st.a, ds.rd.a, ds.rd.b))}</h1>
        <WhenSeg a={`Antes · ${ds.rd.a}`} b={`Depois · ${ds.rd.b}`} />
        <PhoneMap h={260}>{heat}<span className="float" style={{ position: 'absolute', zIndex: 2, left: 160, top: 100, padding: '5px 9px', fontSize: 11.5, fontWeight: 600 }}>{t(ph.when === 'antes' ? `${ds.rd.a} · sem mudança` : `${ds.rd.b} · ${kmf(st.a)}`)}</span></PhoneMap>
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="drow" style={{ border: 0 }}><span className="n">{t('Área que mudou')}</span><span className="v">{t(`0 → ${kmf(st.a)}`)}</span><div className="bars"><i style={{ width: '100%', background: 'var(--acc)' }} /></div></div>
          <div className="drow"><span className="n">{t('Grau de mudança')}</span><span className="v">{t(`${lvlOf(st.g)} · ${st.g}/100`)}</span><div className="bars"><i style={{ width: `${st.g}%`, background: 'linear-gradient(90deg,#F29900,#D93025)' }} /></div></div>
          <div className="why" style={{ marginTop: 8 }}><b>{t('Causa provável')}</b>{t(ds.cmp[k].why)}</div>
        </div>
        <button className="btn pri" style={{ height: 48, flex: 'none' }} onClick={goMap}>{t('Ver focos no mapa')}</button>
      </>
    )
  }
  const d = ds.cmp[k], va = d.A!.set, vb = d.B!.nov, pct = Math.round(((vb - va) / va) * 100)
  const sc = ph.when === 'antes' ? Math.max(0.4, va / vb) : 1
  const nm = ({ agua: 'A área alagada', fogo: 'A área queimada', arvore: 'A floresta perdida' } as Record<string, string>)[k]
  const g = Math.min(100, (Math.abs(pct) * 1.2) | 0)
  return (
    <>
      <div className="seg" role="group" aria-label={t('Tipo de mudança')} style={{ flex: 'none' }}>
        {[['agua', 'Enchentes'], ['fogo', 'Queimadas'], ['arvore', 'Desmatamento']].map(([kk, l]) => <button key={kk} className={cx(kk === k && 'on')} style={{ flex: 1 }} onClick={() => setP({ cType: kk })}>{t(l)}</button>)}
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{t(`${nm} ${pct >= 0 ? 'cresceu' : 'diminuiu'} ${Math.abs(pct)}% de setembro a novembro`)}</h1>
      <WhenSeg a="Antes · Setembro" b="Depois · Novembro" />
      <PhoneMap h={260}>
        {d.heat.map(([x, y, r], i) => blob(x, y, r * sc, i, 0.75, 4))}
        <span className="float" style={{ position: 'absolute', zIndex: 2, left: 128, top: 40, padding: '5px 9px', fontSize: 11.5, fontWeight: 600 }}>{t(`${ph.when === 'antes' ? 'Setembro' : 'Novembro'} · ${(ph.when === 'antes' ? va : vb).toLocaleString('pt-BR')} km²`)}</span>
      </PhoneMap>
      <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="drow" style={{ border: 0 }}><span className="n">{t('Área afetada')}</span><span className="v">{t(`${va.toLocaleString('pt-BR')} → ${vb.toLocaleString('pt-BR')} km²`)}</span><div className="bars"><i style={{ width: `${(va / vb) * 100}%`, background: '#C2C7CE' }} /><i style={{ width: '100%', background: 'var(--acc)' }} /></div></div>
        <div className="drow"><span className="n">{t('Grau de mudança')}</span><span className="v">{t(`${lvlOf(g)} · ${g}/100`)}</span><div className="bars"><i style={{ width: `${g}%`, background: 'linear-gradient(90deg,#F29900,#D93025)' }} /></div></div>
        <div className="why" style={{ marginTop: 8 }}><b>{t('Causa provável')}</b>{t(d.why)}</div>
      </div>
      <button className="btn pri" style={{ height: 48, flex: 'none' }} onClick={goMap}>{t('Ver focos no mapa')}</button>
    </>
  )
}

function WhenSeg({ a, b }: { a: string; b: string }) {
  const { s, set, t } = useApp()
  const w = s.phone.when
  return (
    <div className="seg" role="group" aria-label={t('Antes ou depois')} style={{ flex: 'none' }}>
      <button className={cx(w === 'antes' && 'on')} style={{ flex: 1 }} onClick={() => set({ phone: { ...s.phone, when: 'antes' } })}>{t(a)}</button>
      <button className={cx(w === 'depois' && 'on')} style={{ flex: 1 }} onClick={() => set({ phone: { ...s.phone, when: 'depois' } })}>{t(b)}</button>
    </div>
  )
}

function PAbout() {
  const { t } = useApp()
  const items: [string, string, string][] = [
    ['radar', 'O radar vê através das nuvens', 'O satélite NISAR envia sinais de micro-ondas que atravessam nuvens, de dia e de noite.'],
    ['grafico', 'Comparamos dois períodos', 'Mostramos o que mudou: mais água, menos floresta, solo mais seco.'],
    ['sino', 'Avisamos antes', 'Com os dados do radar e do tempo, indicamos o que pode acontecer.'],
  ]
  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t('Como o A.R.K.O funciona')}</h1>
      {items.map(([i, h, d]) => (
        <div key={h} className="card" style={{ padding: 14, display: 'flex', gap: 12 }}>
          <span className="tile" style={{ width: 36, height: 36, background: 'rgba(26,95,209,.12)', color: 'var(--acc)', flex: 'none' }}><Icon k={i} size={18} /></span>
          <div><b style={{ fontSize: 14 }}>{t(h)}</b><p style={{ color: 'var(--mu)', fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>{t(d)}</p></div>
        </div>
      ))}
    </>
  )
}
