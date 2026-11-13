import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import { Icon } from './Icon'
import hero from '../assets/hero.webp'
import demoMap from '../assets/map-demo.jpg'

type Art = 'radar' | 'dados' | 'regiao' | 'periodo' | 'mapa' | 'linha' | 'alertas' | 'comparar' | 'favoritos' | 'perfil'
interface Step { art: Art; pt: [string, string, string[]]; en: [string, string, string[]] }

// Primeiro acesso: um passo por parte importante do sistema (título, texto, dicas rápidas)
const OB: Step[] = [
  {
    art: 'radar',
    pt: ['Bem-vindo ao A.R.K.O', 'Usamos o radar do satélite NISAR, da NASA e da ISRO, que enxerga o chão de dia, de noite e através das nuvens, e transformamos esse sinal em alertas, mapas e comparações simples.', ['Em 1 minuto você conhece cada parte da tela.', 'Pode pular quando quiser: tudo fica explicado na aba Tutoriais, no menu.']],
    en: ['Welcome to A.R.K.O', 'We use the radar of the NISAR satellite, from NASA and ISRO, which sees the ground by day, by night and through clouds, and turn that signal into simple alerts, maps and comparisons.', ['In 1 minute you will know every part of the screen.', 'Skip any time: everything is explained in the Tutorials tab, in the menu.']],
  },
  {
    art: 'dados',
    pt: ['Dois modos: Exemplo e NISAR real', 'Exemplo usa dados ilustrativos para aprender todas as funções. NISAR real mostra o que o satélite detectou de verdade.', ['Troque quando quiser em DADOS, no menu lateral.', 'Os dados reais se atualizam sozinhos todo dia, a cada nova passagem do satélite.']],
    en: ['Two modes: Example and Real NISAR', 'Example uses illustrative data to learn every feature. Real NISAR shows what the satellite actually detected.', ['Switch any time under DATA, in the side menu.', 'Real data updates by itself every day, with each new satellite pass.']],
  },
  {
    art: 'regiao',
    pt: ['Escolha a região ou busque um lugar', 'Os dados reais cobrem o rio Madeira (AM), Porto Alegre e o vale do Taquari (RS) e Daca e o rio Jamuna, em Bangladesh.', ['Troque de região em REGIÃO, no menu lateral.', 'Ou use a lupa no topo da tela para buscar qualquer cidade ou rio do mundo: se houver dados ali, o app abre a região e marca o lugar no mapa.']],
    en: ['Pick a region or search a place', 'Real data covers the Madeira River (AM), Porto Alegre and the Taquari valley (RS), and Dhaka and the Jamuna river in Bangladesh.', ['Switch regions under REGION, in the side menu.', 'Or use the magnifier at the top to search any city or river in the world: if there is data there, the app opens the region and marks the place on the map.']],
  },
  {
    art: 'periodo',
    pt: ['Escolha o período', 'Painel, mapa e alertas mostram só o que aconteceu no intervalo escolhido.', ['Use 7 dias, 30 dias, 3 meses, 6 meses ou 1 ano, ou escolha datas exatas no botão de calendário.', 'Para dados reais, 30 dias ou mais funciona melhor: o NISAR passa a cada ~12 dias.']],
    en: ['Pick the period', 'Panel, map and alerts show only what happened in the chosen span.', ['Use 7 days, 30 days, 3 months, 6 months or 1 year, or pick exact dates with the calendar button.', 'For real data, 30 days or more works best: NISAR passes about every 12 days.']],
  },
  {
    art: 'mapa',
    pt: ['Leia o mapa de mudanças', 'Cada ícone é um foco: um lugar onde o radar viu o chão mudar.', ['Filtre por tipo nos botões acima do mapa.', 'Clique em um foco para ver o que mudou, quando e o tamanho da área.', 'O botão LEGENDA, no canto do mapa, explica cada ícone.']],
    en: ['Read the change map', 'Each icon is a detection: a place where the radar saw the ground change.', ['Filter by type with the buttons above the map.', 'Click a detection to see what changed, when and the area size.', 'The LEGEND button in the map corner explains each icon.']],
  },
  {
    art: 'linha',
    pt: ['Navegue pela linha do tempo', 'Embaixo do mapa, cada barra é uma passagem do satélite. A altura mostra quantos focos ela encontrou.', ['“Uma data”: clique numa barra para ver só aquela passagem.', '“Período”: clique no início e no fim (ou arraste) para juntar várias.', 'Aperte ▶ para animar as mudanças ao longo do tempo.']],
    en: ['Move through the timeline', 'Below the map, each bar is a satellite pass. Its height shows how many detections it found.', ['“One date”: click a bar to see only that pass.', '“Period”: click the start and the end (or drag) to join several.', 'Press ▶ to animate the changes over time.']],
  },
  {
    art: 'alertas',
    pt: ['Veja os alertas de riscos', 'O painel laranja junta os focos mais importantes em alertas, do mais urgente para o menos urgente.', ['Filtre por Alto, Médio ou Baixo.', 'Cada alerta diz o que aconteceu, perto de qual cidade e com qual confiança.', 'Clique em “Ver no mapa” para ir direto ao lugar.']],
    en: ['See the risk alerts', 'The orange panel groups the most important detections into alerts, from most to least urgent.', ['Filter by High, Medium or Low.', 'Each alert says what happened, near which city and with what confidence.', 'Click “See on map” to jump straight to the place.']],
  },
  {
    art: 'comparar',
    pt: ['Compare dois momentos', 'Em “Comparar períodos”, o mesmo mapa mostra o antes (A) e o depois (B).', ['Escolha o tipo de mudança, as duas datas e a região (ou busque pela lupa).', 'Arraste a barra azul sobre o mapa para revelar a diferença.', 'O resumo ao lado explica a mudança em uma frase.']],
    en: ['Compare two moments', 'In “Compare periods”, the same map shows before (A) and after (B).', ['Pick the type of change, the two dates and the region (or search with the magnifier).', 'Drag the blue bar over the map to reveal the difference.', 'The summary beside it explains the change in one sentence.']],
  },
  {
    art: 'favoritos',
    pt: ['Guarde suas regiões', 'Clique em “☆ Favoritar região” no painel azul. Ela aparece em MINHAS REGIÕES, no menu lateral.', ['★ Favoritas: o que você guardou.', '🕘 Recentes: o que você abriu ou buscou por último.', 'Dúvidas? Abra a aba Tutoriais no menu: lá tem um passo a passo de cada parte.']],
    en: ['Save your regions', 'Click “☆ Save region” on the blue panel. It shows up under MY REGIONS, in the side menu.', ['★ Favorites: what you saved.', '🕘 Recent: what you opened or searched last.', 'Questions? Open the Tutorials tab in the menu: it has a step-by-step for every part.']],
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
  const { s, set, t, ds, setSrc, go } = useApp()
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
  const real = s.src === 'real'
  const img = st.art === 'radar' ? hero : st.art === 'dados' || st.art === 'regiao' || st.art === 'comparar' ? ds.real.img : demoMap

  // Desenho de cada passo (por cima da imagem)
  const overlays: Partial<Record<Art, ReactNode>> = {
    dados: <div style={center} className="seg"><button className={cx(!real && 'on')}>{t('Exemplo')}</button><button className={cx(real && 'on')}>{t('NISAR real')}</button></div>,
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
            {st.art === 'dados' && (
              <div className="prof" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {([['demo', 'Exemplo', en ? 'Amazon and Southern Brazil · illustrative data to learn the app' : 'Amazônia e Sul do Brasil · dados ilustrativos para aprender a usar'], ['real', 'NISAR real', en ? `${ds.realIndex.length} real regions · updated every pass` : `${ds.realIndex.length} regiões reais · atualizadas a cada passagem`]] as const).map(([k, h, d]) => (
                  <button key={k} className={cx(s.src === k && 'on')} aria-pressed={s.src === k} onClick={() => setSrc(k)}><b>{t(h)}</b>{d}</button>
                ))}
              </div>
            )}
            {st.art === 'perfil' && (
              <div className="prof">
                {[['gestor', 'Gestão e Defesa Civil', 'Alertas e riscos primeiro'], ['prof', 'Educação', 'Comparar períodos e explicar'], ['pub', 'Curiosidade', 'Explorar o mapa']].map(([k, h, d]) => (
                  <button key={k} className={cx(s.profile === k && 'on')} aria-pressed={s.profile === k} onClick={() => set({ profile: k })}><b>{t(h)}</b>{t(d)}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="obf">
          <button className="skip" onClick={close}>{t('Pular')}</button>
          {i === OB.length - 1 && <button className="skip" onClick={() => { set({ ob: false }); go('tutoriais') }}>{en ? 'Open tutorials' : 'Abrir tutoriais'}</button>}
          <span style={{ flex: 1 }} />
          <button className="btn" style={{ visibility: i ? 'visible' : 'hidden' }} onClick={() => set({ obStep: Math.max(0, i - 1) })}>{t('Voltar')}</button>
          <button className="btn pri" ref={next} onClick={() => (i < OB.length - 1 ? set({ obStep: i + 1 }) : close())}>{t(i === OB.length - 1 ? 'Começar' : 'Próximo')}</button>
        </div>
      </div>
    </div>
  )
}
