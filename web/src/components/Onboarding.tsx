import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import { Icon } from './Icon'
import { USOS } from '../lib/usos'
import hero from '../assets/hero.webp'
import demoMap from '../assets/map-demo.jpg'

type Art = 'radar' | 'dados' | 'exemplo' | 'quem' | 'regiao' | 'periodo' | 'mapa' | 'linha' | 'alertas' | 'comparar' | 'favoritos' | 'perfil'
interface Step { art: Art; pt: [string, string, string[]]; en: [string, string, string[]] }

// Primeiro acesso: um passo por parte importante do sistema (título, texto, dicas rápidas)
const OB: Step[] = [
  {
    art: 'radar',
    pt: ['Bem-vindo ao A.R.K.O Rios', 'Usamos satélites da NASA para contar o que aconteceu com a água que abastece cidades, ano a ano, desde 1985, e mostrar para onde ela vai se nada mudar. O objetivo é conservar a água potável e prevenir, não só remediar.', ['Em 1 minuto você conhece cada parte do app.', 'Pode pular quando quiser e rever depois em “Como usar”, no menu.']],
    en: ['Welcome to A.R.K.O Rivers', 'We use NASA satellites to tell what happened to the water that supplies cities, year by year since 1985, and show where it is heading if nothing changes. The goal is to conserve drinking water and prevent harm, not just repair it.', ['In 1 minute you will know every part of the app.', 'Skip any time and see it again under “How to use”, in the menu.']],
  },
  {
    art: 'dados',
    pt: ['Só dados reais, de 40 anos até hoje', 'Landsat (NASA/USGS, desde 1985): cor da água, área de água, mata ciliar e solo exposto. SWOT (NASA/CNES, desde 2023): nível do rio. HLS (NASA, a cada 2–5 dias): cada imagem nova comparada com o normal do mês. GRACE/GRACE-FO (desde 2002): a água dos aquíferos. NISAR (NASA/ISRO): o rio através das nuvens.', ['Cada número mostra de quais imagens veio.', 'O que é hipótese aparece marcado como hipótese.']],
    en: ['Real data only, from 40 years ago to today', 'Landsat (NASA/USGS, since 1985): water colour, water area, riverside forest and bare soil. SWOT (NASA/CNES, since 2023): river level. HLS (NASA, every 2–5 days): each new image compared with the month’s normal. GRACE/GRACE-FO (since 2002): aquifer water. NISAR (NASA/ISRO): the river through clouds.', ['Every number shows which images it came from.', 'Anything that is a hypothesis is marked as one.']],
  },
  {
    art: 'exemplo',
    pt: ['Um exemplo de uso, em 4 passos', 'Imagine que você trabalha na companhia de água de Itaituba, no rio Tapajós:', ['1. Em “Histórico do rio”, os cartões dizem se a água piorou desde os anos 80.', '2. O gráfico mostra o ano a ano, o pior ano e onde a curva chega em 2030 se nada mudar.', '3. “Causa provável” e “Como proteger esta água” dizem por que mudou e quem pode agir.', '4. As fotos de satélite, década a década, mostram a mudança para qualquer pessoa entender.']],
    en: ['A usage example, in 4 steps', 'Imagine you work for the water utility in Itaituba, on the Tapajós River:', ['1. In “River history”, the cards say whether the water got worse since the 1980s.', '2. The chart shows each year, the worst year and where the curve reaches by 2030 if nothing changes.', '3. “Probable cause” and “How to protect this water” say why it changed and who can act.', '4. Satellite photos, decade by decade, show the change so anyone can understand it.']],
  },
  {
    art: 'quem',
    pt: ['Quem pode usar, e como', 'O A.R.K.O Rios é aberto e serve a quem precisa proteger, decidir ou ensinar sobre a água:', []],
    en: ['Who can use it, and how', 'A.R.K.O Rivers is open and serves anyone who needs to protect, decide or teach about water:', []],
  },
  {
    art: 'regiao',
    pt: ['Escolha o rio ou o aquífero', 'Em Goiás: João Leite e Meia Ponte (água de Goiânia), Araguaia e Serra da Mesa. No Brasil e no mundo: Tapajós (garimpo), Madeira (dragas e desmatamento), Guaíba em Porto Alegre (cidade e cheias), rios de Daca (cidade crescendo sobre a água), nascentes do Trishuli no Nepal (geleiras derretendo) e a barragem de Massingir em Moçambique (secas). Na aba Aquíferos: Guarani, Urucuia, Goiás e outros.', ['No Histórico do rio, escolha o rio nos botões do topo.', 'Para ver o rio agora pelo radar, use REGIÃO, no menu lateral, ou o botão “Ver o rio agora”.']],
    en: ['Pick the river or aquifer', 'In Goiás: João Leite and Meia Ponte (Goiânia’s water), Araguaia and Serra da Mesa. In Brazil and the world: Tapajós (gold mining), Madeira (dredges and clearing), Guaíba in Porto Alegre (city and floods), Dhaka’s rivers (city growing over water), the Trishuli headwaters in Nepal (melting glaciers) and Massingir Dam in Mozambique (droughts). In the Aquifers tab: Guarani, Urucuia, Goiás and more.', ['In River history, pick the river with the buttons at the top.', 'To see the river now by radar, use REGION in the side menu or the “See the river now” button.']],
  },
  {
    art: 'mapa',
    pt: ['O rio agora, pelo radar', 'Em “Agora no rio”, o mapa mostra o que o radar NISAR viu mudar nas últimas passagens: água nova, água que recuou, margem perdendo vegetação.', ['Filtre por tipo nos botões acima do mapa.', 'Clique em um foco para ver o que mudou, quando e o tamanho da área.']],
    en: ['The river now, by radar', 'In “River now”, the map shows what the NISAR radar saw change in recent passes: new water, receding water, banks losing vegetation.', ['Filter by type with the buttons above the map.', 'Click a detection to see what changed, when and the area size.']],
  },
  {
    art: 'alertas',
    pt: ['Alertas para a água', 'O painel junta o que ameaça o rio agora: margem desmatada, fogo na bacia (cinza e terra vão para a água), chuva extrema que arrasta sedimento.', ['Cada alerta diz o que aconteceu, perto de qual cidade e o que fazer.', 'Clique em “Ver no mapa” para ir direto ao lugar.']],
    en: ['Alerts for the water', 'The panel gathers what threatens the river now: cleared banks, fire in the basin (ash and soil end up in the water), extreme rain washing sediment.', ['Each alert says what happened, near which city and what to do.', 'Click “See on map” to jump straight to the place.']],
  },
  {
    art: 'comparar',
    pt: ['Compare épocas e veja o rio agora', 'No Histórico do rio, a linha do tempo mostra cada época e o que mudou. Logo abaixo, o radar NISAR mostra o rio agora, mesmo com nuvem.', ['Aperte play ou arraste a barra para passar pelas épocas.', 'O radar marca água fora do leito, margem exposta e perda de mata.']],
    en: ['Compare eras and see the river now', 'In River history, the timeline shows each era and what changed. Right below, the NISAR radar shows the river now, even under clouds.', ['Press play or drag the bar to move through the eras.', 'The radar marks water outside the channel, exposed banks and forest loss.']],
  },
  {
    art: 'perfil',
    pt: ['Para quem é a sua visão?', 'Vamos ajustar a tela inicial para o que você mais precisa. Dá para mudar depois.', []],
    en: ['Who is this view for?', 'We will tune the home screen to what you need most. You can change it later.', []],
  },
]

const fade = (from: number) => <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,rgba(255,255,255,${from}) ${from ? 0 : 62}%,rgba(255,255,255,1))` }} />
const center: CSSProperties = { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
const chip = (ic: string, label: string, c: string) => (
  <span key={label} className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12.5px] font-bold shadow" style={{ color: '#1A1D23', border: `1.5px solid ${c}` }}><Icon k={ic} size={14} />{label}</span>
)

export function Onboarding() {
  const { s, set, t, ds, go } = useApp()
  const next = useRef<HTMLButtonElement>(null)
  const en = s.lang === 'en'
  const i = Math.min(s.obStep, OB.length - 1), st = OB[i]
  const [title, text, tips] = en ? st.en : st.pt
  const close = () => { set({ ob: false }); go(s.profile === 'prof' ? 'comparar' : 'inicio') }
  useEffect(() => { if (s.ob) next.current?.focus() }, [s.ob])
  // teclado: Esc fecha, setas trocam de passo (ref evita perder o evento quando outra tela re-renderiza)
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {})
  onKey.current = (e: KeyboardEvent) => {
    if (!s.ob) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight' && i < OB.length - 1) set({ obStep: i + 1 })
    if (e.key === 'ArrowLeft' && i > 0) set({ obStep: i - 1 })
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => onKey.current(e)
    document.addEventListener('keydown', key, true); return () => document.removeEventListener('keydown', key, true)
  }, [])
  if (!s.ob) return null
  const img = st.art === 'radar' ? hero : st.art === 'dados' || st.art === 'regiao' || st.art === 'comparar' || st.art === 'exemplo' || st.art === 'quem' ? ds.real.img : demoMap

  // Desenho de cada passo (por cima da imagem)
  const overlays: Partial<Record<Art, ReactNode>> = {
    dados: <div style={center} className="flex flex-wrap justify-center gap-1.5">{[chip('grafico', 'Landsat 1985→', '#15803D'), chip('relogio', 'HLS', '#7C3AED'), chip('agua', 'SWOT', '#0891B2'), chip('camadas', 'GRACE', '#0369A1'), chip('radar', 'NISAR', '#2563EB'), chip('deslizamento', 'LHASA', '#9A5B13'), chip('fogo', 'FIRMS', '#E2553A')]}</div>,
    exemplo: (
      <div style={{ ...center, width: 340 }} className="flex flex-col gap-1.5">
        {[['sino', en ? 'Danger now · suggested response' : 'Perigo agora · sugestão de resposta', '#D92D20'], ['alvo', en ? 'Point card: cause, data, radar' : 'Ficha: causa, dados, radar', '#2563EB'], ['radar', en ? 'Forecast: crossed sources' : 'Previsão: fontes cruzadas', '#7C3AED'], ['grafico', en ? 'Compare: what changed and why' : 'Comparar: o que mudou e por quê', '#2E9E5B']].map(([ic, l, c], n) => (
          <div key={l} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-bold shadow" style={{ color: '#1A1D23', borderLeft: `4px solid ${c}` }}><span style={{ color: c }}>{n + 1}</span><Icon k={ic} size={15} />{l}</div>
        ))}
      </div>
    ),
    quem: <div style={{ ...center, width: 360 }} className="grid grid-cols-2 gap-1.5">{USOS.map(u => chip(u.ic, u.quem[en ? 1 : 0], '#1E2A3A'))}</div>,
    periodo: <div style={{ ...center, whiteSpace: 'nowrap' }} className="seg">{['7 dias', '30 dias', '3 meses', '6 meses'].map(x => <button key={x} className={cx(x === '30 dias' && 'on')}>{t(x)}</button>)}</div>,
    regiao: (
      <div style={{ ...center, width: 330 }} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[13.5px] shadow-lg" style={{ color: '#1A1D23' }}><Icon k="busca" size={16} />{en ? 'Dhaka' : 'Daca'}<span className="ml-auto text-[11px]" style={{ color: '#5F6670' }}>{en ? 'Search' : 'Buscar'}</span></div>
        <div className="rounded-lg bg-white px-3 py-2 text-[12.5px] shadow-lg" style={{ color: '#1A1D23' }}>📍 <b>{en ? 'Dhaka, Bangladesh' : 'Daca, Bangladesh'}</b> · <span style={{ color: '#2563EB' }}>NISAR real</span></div>
      </div>
    ),
    mapa: <div style={center} className="flex flex-wrap justify-center gap-1.5" >{[chip('agua', t('Água nova'), '#2F7DE1'), chip('arvore', t('Floresta perdida'), '#2E9E5B'), chip('solo', t('Água que recuou'), '#C9822B'), chip('fogo', t('Queimadas'), '#E2553A')]}</div>,
    linha: (
      <div style={{ ...center, width: 360, background: '#0F1B33', borderRadius: 12, padding: '12px 14px' }} className="shadow-xl">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[.08em] text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30"><Icon k="play" size={11} /></span>{en ? 'TIMELINE' : 'LINHA DO TEMPO'}</div>
        <div className="flex h-16 items-end gap-1.5">{[30, 55, 48, 80, 92, 70, 50, 58, 75, 35].map((h, k) => <span key={k} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: k >= 3 && k <= 6 ? '#4C8DF6' : '#2A4A80' }} />)}</div>
      </div>
    ),
    alertas: (
      <div style={{ ...center, width: 330, background: 'linear-gradient(180deg,#F7A531,#FBD07A)', borderRadius: 12, padding: 12 }} className="shadow-xl">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold tracking-[.1em] text-white"><Icon k="sino" size={16} />{en ? 'RISK ALERT' : 'ALERTA DE RISCOS'}</div>
        <div className="flex items-center gap-2 rounded-md bg-white p-2.5 text-[12.5px]" style={{ color: '#1A1D23' }}>
          <Icon k="agua" size={18} /><b className="flex-1">{en ? 'New water in several spots' : 'Água nova em vários pontos'}</b>
          <span className="rounded bg-[#2563EB] px-2 py-1 text-[11px] font-bold text-white">{en ? 'See on map' : 'Ver no mapa'}</span>
        </div>
      </div>
    ),
    comparar: (
      <div style={{ ...center, width: 300, height: 150 }} className="overflow-hidden rounded-lg shadow-xl">
        <div className="absolute inset-0" style={{ background: `url(${ds.real.img}) center/cover`, filter: 'grayscale(.6) brightness(.8)' }} />
        <div className="absolute inset-y-0 right-0" style={{ left: '50%', background: `url(${ds.real.img}) right center/300px 150px`, borderLeft: '3px solid #4C8DF6' }} />
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">A</span>
        <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">B</span>
      </div>
    ),
    favoritos: (
      <div style={{ ...center, width: 260, background: '#16181D', borderRadius: 12, padding: 12 }} className="shadow-xl">
        <div className="mb-2 text-[10.5px] tracking-[.08em]" style={{ color: '#7C838E' }}>{en ? 'MY REGIONS' : 'MINHAS REGIÕES'}</div>
        {[[en ? 'Bangladesh' : 'Bangladesh', true], [en ? 'Southern Brazil' : 'Sul do Brasil', true], ['Amazônia', false]].map(([n, f]) => (
          <div key={String(n)} className="flex items-center rounded px-2 py-1.5 text-[13px] font-bold text-white">{String(n)}<span className="ml-auto" style={{ color: f ? '#FFD43B' : '#555' }}>★</span></div>
        ))}
      </div>
    ),
  }

  return (
    <div className="ov on" role="dialog" aria-modal="true" aria-labelledby="obT">
      <div className="ob" style={{ width: 600 }}>
        <div className="art" style={{ height: 220, backgroundImage: `url(${img})`, backgroundPosition: st.art === 'radar' ? 'center 35%' : 'center' }}>
          {st.art === 'radar' ? fade(0) : fade(0.1)}
          {overlays[st.art]}
        </div>
        <div className="in">
          <div className="steps">{OB.map((_, k) => <i key={k} className={cx(k <= i && 'on')} />)}</div>
          <div className="text-[11px] font-bold tracking-[.08em]" style={{ color: 'var(--mu)' }}>{en ? `STEP ${i + 1} OF ${OB.length}` : `PASSO ${i + 1} DE ${OB.length}`}</div>
          <h2 id="obT">{title}</h2>
          <p>{text}</p>
          {tips.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {tips.map(x => <li key={x} className="flex gap-2 text-[13.5px] leading-snug"><span style={{ color: '#2563EB', fontWeight: 800 }}>✓</span><span>{x}</span></li>)}
            </ul>
          )}
          <div>
            {st.art === 'quem' && (
              <div className="flex max-h-[190px] flex-col gap-1.5 overflow-y-auto pr-1">
                {USOS.map(u => <div key={u.quem[0]} className="text-[12.5px] leading-snug"><b>{u.quem[en ? 1 : 0]}:</b> {u.exemplo[en ? 1 : 0]}</div>)}
              </div>
            )}
            {st.art === 'perfil' && (
              <div className="prof">
                {[['gestor', 'Gestão da água', 'Riscos e o que fazer primeiro'], ['prof', 'Educação', '40 anos de fotos e gráficos'], ['pub', 'Curiosidade', 'Explorar os rios']].map(([k, h, d]) => (
                  <button key={k} className={cx(s.profile === k && 'on')} aria-pressed={s.profile === k} onClick={() => set({ profile: k })}><b>{t(h)}</b>{t(d)}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="obf">
          <button className="skip" onClick={close}>{t('Pular')}</button>
          <span style={{ flex: 1 }} />
          <button className="btn" style={{ visibility: i ? 'visible' : 'hidden' }} onClick={() => set({ obStep: Math.max(0, i - 1) })}>{t('Voltar')}</button>
          <button className="btn pri" ref={next} onClick={() => (i < OB.length - 1 ? set({ obStep: i + 1 }) : close())}>{t(i === OB.length - 1 ? 'Começar' : 'Próximo')}</button>
        </div>
      </div>
    </div>
  )
}
