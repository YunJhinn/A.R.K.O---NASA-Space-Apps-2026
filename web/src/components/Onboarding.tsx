import { useEffect, useRef } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import hero from '../assets/hero.webp'
import demoMap from '../assets/map-demo.jpg'

const OB = [
  { t: 'Bem-vindo ao A.R.K.O', p: 'Advanced Reconnaissance & Knowledge Operations. Usamos o radar do satélite NISAR, da NASA e da ISRO, que enxerga a Amazônia de dia, de noite e através das nuvens, e transformamos esse sinal em informação simples.', art: 'radar' },
  { t: 'Escolha um período e veja o que mudou', p: 'Selecione 7 dias, 30 dias ou datas personalizadas. O mapa, os números e os alertas mudam juntos e sempre comparam com o período anterior.', art: 'periodo' },
  { t: 'Dois modos: Exemplo e NISAR real', p: '', art: 'dados' },
  { t: 'Para quem é a sua visão?', p: 'Vamos ajustar a tela inicial para o que você mais precisa. Dá para mudar depois.', art: 'perfil' },
] as const

const fade = (from: number) => <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,rgba(255,255,255,${from}) ${from ? 0 : 62}%,rgba(255,255,255,1))` }} />

export function Onboarding() {
  const { s, set, t, ds, setSrc, go } = useApp()
  const next = useRef<HTMLButtonElement>(null)
  const i = s.obStep, st = OB[i]
  const close = () => { set({ ob: false }); go(s.profile === 'prof' ? 'comparar' : 'inicio') }
  useEffect(() => { if (s.ob) next.current?.focus() }, [s.ob])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && s.ob) close() }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  })
  if (!s.ob) return null
  const real = s.src === 'real'
  const p = st.art === 'dados'
    ? 'Exemplo mostra regiões com dados ilustrativos, para entender o app. NISAR real mostra o que o satélite detectou de verdade no rio Madeira (AM), em Porto Alegre (RS) e em Bangladesh. Troque quando quiser em Dados, no menu.'
    : st.p
  const img = st.art === 'radar' ? hero : st.art === 'dados' ? ds.real.img : demoMap
  return (
    <div className="ov on" role="dialog" aria-modal="true" aria-labelledby="obT">
      <div className="ob">
        <div className="art" style={{ backgroundImage: `url(${img})`, backgroundPosition: st.art === 'radar' ? 'center 35%' : 'center' }}>
          {st.art === 'radar' ? fade(0) : fade(0.1)}
          {st.art === 'dados' && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} className="seg"><button className={cx(!real && 'on')}>{t('Exemplo')}</button><button className={cx(real && 'on')}>{t('NISAR real')}</button></div>}
          {st.art === 'periodo' && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} className="seg">{['7 dias', '30 dias', '3 meses', '6 meses'].map(x => <button key={x} className={cx(x === '30 dias' && 'on')}>{t(x)}</button>)}</div>}
        </div>
        <div className="in">
          <div className="steps">{OB.map((_, k) => <i key={k} className={cx(k <= i && 'on')} />)}</div>
          <h2 id="obT">{t(st.t)}</h2>
          <p>{t(p)}</p>
          <div>
            {st.art === 'dados' && (
              <div className="prof" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {([['demo', 'Exemplo', 'Amazônia inteira · dados ilustrativos para aprender a usar'], ['real', 'NISAR real', `${ds.realIndex.length} regiões reais · passagens de jun a out 2026`]] as const).map(([k, h, d]) => (
                  <button key={k} className={cx(s.src === k && 'on')} aria-pressed={s.src === k} onClick={() => setSrc(k)}><b>{t(h)}</b>{t(d)}</button>
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
          <button className="skip" onClick={close}>{t('Pular')}</button><span style={{ flex: 1 }} />
          <button className="btn" style={{ visibility: i ? 'visible' : 'hidden' }} onClick={() => set({ obStep: Math.max(0, i - 1) })}>{t('Voltar')}</button>
          <button className="btn pri" ref={next} onClick={() => (i < OB.length - 1 ? set({ obStep: i + 1 }) : close())}>{t(i === OB.length - 1 ? 'Começar' : 'Próximo')}</button>
        </div>
      </div>
    </div>
  )
}
