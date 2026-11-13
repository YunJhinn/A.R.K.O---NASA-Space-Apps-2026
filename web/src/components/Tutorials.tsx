import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import { Icon } from './Icon'
import { ACT_LABEL, TUTORIALS, TUT_GROUPS, type Tut, type TutAction } from '../lib/tutorials'

const SHOTS = import.meta.glob('../assets/tut/*/*.webp', { eager: true, import: 'default' }) as Record<string, string>
const shot = (lang: string, id: string, n: number) => SHOTS[`../assets/tut/${lang}/${id}-${n}.webp`] ?? SHOTS[`../assets/tut/pt/${id}-${n}.webp`]

/** Aba "Tutoriais": um guia para cada parte do sistema */
export function Tutorials() {
  const { s, set, go } = useApp()
  const en = s.lang === 'en'
  const [sel, setSel] = useState(s.tut ?? TUTORIALS[0].id)
  const tut = TUTORIALS.find(x => x.id === sel) ?? TUTORIALS[0]
  const tx = en ? tut.en : tut.pt
  const idx = TUTORIALS.indexOf(tut)
  const [k, setK] = useState(0)
  const pick = (id: string) => { setSel(id); setK(0); set({ tut: id }); window.scrollTo(0, 0) }
  const nSteps = tx.steps.length
  const go2 = (n: number) => setK(Math.max(0, Math.min(nSteps - 1, n)))
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (s.ob || (e.target as HTMLElement)?.closest?.('input,select,textarea')) return
      if (e.key === 'ArrowRight') setK(v => Math.min(nSteps - 1, v + 1))
      if (e.key === 'ArrowLeft') setK(v => Math.max(0, v - 1))
    }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  }, [nSteps, s.ob])

  const run = (a: TutAction) => {
    if (a === 'ob') return set({ ob: true, obStep: 0 })
    if (a === 'comparar' || a === 'celular' || a === 'inicio' || a === 'futuro') return go(a)
    if (a === 'map' || a === 'alerts') return go('inicio', a)
    if (a === 'search') {
      go('inicio')
      return setTimeout(() => (document.querySelector('.search input') as HTMLInputElement | null)?.focus(), 120)
    }
    const el = document.getElementById('myRegions')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.boxShadow = '0 0 0 2px #4C8DF6'
      setTimeout(() => (el.style.boxShadow = ''), 1600)
    }
  }

  const groups = Object.keys(TUT_GROUPS) as Tut['group'][]
  return (
    <section className="view on" id="v-tutoriais" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Tutorials' : 'Tutoriais'}</h1>
          <div className="answer"><span className="dot" style={{ background: 'var(--acc)' }} />
            <span>{en ? 'Learn how to use each part of A.R.K.O. Pick a topic on the left.' : 'Aprenda a usar cada parte do A.R.K.O. Escolha um tema à esquerda.'}</span>
          </div>
        </div>
        <button className="btn" style={{ flex: "none", width: "auto", marginLeft: "auto" }} onClick={() => set({ ob: true, obStep: 0 })}><Icon k="play" size={15} />&nbsp;{en ? 'Replay intro' : 'Rever o primeiro acesso'}</button>
      </div>

      <div className="grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(230px, 290px) 1fr' }}>
        <nav className="card" style={{ padding: 10 }} aria-label={en ? 'Tutorial topics' : 'Temas dos tutoriais'}>
          {groups.map(g => (
            <div key={g} className="mb-2">
              <div className="px-2 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--mu)' }}>{TUT_GROUPS[g][en ? 1 : 0]}</div>
              {TUTORIALS.filter(x => x.group === g).map(x => {
                const on = x.id === tut.id
                return (
                  <button key={x.id} onClick={() => pick(x.id)} aria-current={on ? 'page' : undefined}
                    className={cx('flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13.5px] transition', on ? 'font-bold' : 'hover:bg-black/5')}
                    style={on ? { background: '#0F1B33', color: '#fff' } : { color: 'var(--ink)' }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: on ? 'rgba(255,255,255,.12)' : '#EEF2F8', color: on ? '#9CC3FF' : '#2563EB' }}><Icon k={x.ic} size={15} /></span>
                    {en ? x.en.t : x.pt.t}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#0F1B33,#173A6B)', color: '#fff', padding: '22px 26px' }}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#9CC3FF' }}>
              <Icon k={tut.ic} size={14} />{TUT_GROUPS[tut.group][en ? 1 : 0]} · {idx + 1}/{TUTORIALS.length}
            </div>
            <h2 style={{ fontSize: 24, margin: 0, color: '#fff' }}>{tx.t}</h2>
            <p style={{ margin: '8px 0 0', color: '#D5E2F5', lineHeight: 1.55, maxWidth: 720 }}>{tx.d}</p>
          </div>
          <div style={{ padding: '20px 26px 24px' }}>
            {/* carrossel: um print real do app por passo, com seta mostrando onde clicar */}
            <div className="mb-2 flex items-center text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--mu)' }}>
              {en ? 'Step by step' : 'Passo a passo'}<span className="ml-auto normal-case tracking-normal">{en ? `Step ${k + 1} of ${nSteps}` : `Passo ${k + 1} de ${nSteps}`}</span>
            </div>
            <div className="relative overflow-hidden rounded-xl" style={{ background: '#0B1220', aspectRatio: '16 / 10', boxShadow: '0 10px 30px rgba(15,27,51,.25)' }}>
              {tx.steps.map((_, n) => {
                const src = shot(s.lang, tut.id, n + 1)
                return src ? <img key={tut.id + n} src={src} alt={`${tx.t} · ${n + 1}`} loading={n === k ? 'eager' : 'lazy'} draggable={false}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style={{ opacity: n === k ? 1 : 0 }} /> : null
              })}
              <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-extrabold" style={{ background: '#FFC400', color: '#141414' }}>{k + 1}/{nSteps}</span>
              {k > 0 && <button aria-label={en ? 'Previous step' : 'Passo anterior'} onClick={() => go2(k - 1)}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[22px] font-bold shadow-lg" style={{ background: 'rgba(255,255,255,.92)', color: '#0F1B33' }}>‹</button>}
              {k < nSteps - 1 && <button aria-label={en ? 'Next step' : 'Próximo passo'} onClick={() => go2(k + 1)}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[22px] font-bold shadow-lg" style={{ background: 'rgba(255,255,255,.92)', color: '#0F1B33' }}>›</button>}
            </div>
            <div className="mt-4 flex min-h-[64px] gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] font-extrabold" style={{ background: '#FFC400', color: '#141414' }}>{k + 1}</span>
              <p className="m-0 text-[15.5px] font-medium" style={{ lineHeight: 1.55, paddingTop: 5 }}>{tx.steps[k]}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1.5" role="tablist" aria-label={en ? 'Steps' : 'Passos'}>
                {tx.steps.map((_, n) => (
                  <button key={n} role="tab" aria-selected={n === k} aria-label={`${n + 1}`} onClick={() => go2(n)}
                    className="h-2.5 rounded-full transition-all" style={{ width: n === k ? 28 : 10, background: n === k ? '#2563EB' : '#C9D3E2' }} />
                ))}
              </div>
              <span style={{ flex: 1 }} />
              <button className="btn" style={{ flex: 'none', width: 'auto', opacity: k === 0 ? 0.4 : 1 }} disabled={k === 0} onClick={() => go2(k - 1)}>← {en ? 'Back' : 'Voltar'}</button>
              {k < nSteps - 1
                ? <button className="btn pri" style={{ flex: 'none', width: 'auto' }} onClick={() => go2(k + 1)}>{en ? 'Next step' : 'Próximo passo'} →</button>
                : idx < TUTORIALS.length - 1 && <button className="btn pri" style={{ flex: 'none', width: 'auto' }} onClick={() => pick(TUTORIALS[idx + 1].id)}>{en ? 'Next topic' : 'Próximo tema'}: {en ? TUTORIALS[idx + 1].en.t : TUTORIALS[idx + 1].pt.t} →</button>}
            </div>
            <div className="mt-5 flex gap-3 rounded-lg p-3.5" style={{ background: '#EAF2FF', border: '1px solid #BCD3F7' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🧭</span>
              <div style={{ lineHeight: 1.5 }}><b>{en ? 'Example of use: ' : 'Exemplo de uso: '}</b>{tx.ex}</div>
            </div>
            <div className="mt-3 flex gap-3 rounded-lg p-3.5" style={{ background: '#FFF6E0', border: '1px solid #F5D58A' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
              <div style={{ lineHeight: 1.5 }}><b>{en ? 'Tip: ' : 'Dica: '}</b>{tx.tip}</div>
            </div>
            {tut.act && <div className="mt-4"><button className="btn" style={{ flex: 'none', width: 'auto' }} onClick={() => run(tut.act!)}>{ACT_LABEL[tut.act][en ? 1 : 0]} →</button></div>}
          </div>
        </article>
      </div>
    </section>
  )
}
