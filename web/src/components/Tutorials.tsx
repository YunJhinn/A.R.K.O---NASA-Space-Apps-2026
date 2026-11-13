import { useState } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import { Icon } from './Icon'
import { ACT_LABEL, TUTORIALS, TUT_GROUPS, type Tut, type TutAction } from '../lib/tutorials'

/** Aba "Tutoriais": um guia para cada parte do sistema */
export function Tutorials() {
  const { s, set, go } = useApp()
  const en = s.lang === 'en'
  const [sel, setSel] = useState(s.tut ?? TUTORIALS[0].id)
  const tut = TUTORIALS.find(x => x.id === sel) ?? TUTORIALS[0]
  const tx = en ? tut.en : tut.pt
  const idx = TUTORIALS.indexOf(tut)
  const pick = (id: string) => { setSel(id); set({ tut: id }); window.scrollTo(0, 0) }

  const run = (a: TutAction) => {
    if (a === 'ob') return set({ ob: true, obStep: 0 })
    if (a === 'comparar' || a === 'celular' || a === 'inicio') return go(a)
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
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--mu)' }}>{en ? 'Step by step' : 'Passo a passo'}</div>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {tx.steps.map((st, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: '#2563EB' }}>{i + 1}</span>
                  <span style={{ lineHeight: 1.55, paddingTop: 3 }}>{st}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex gap-3 rounded-lg p-3.5" style={{ background: '#FFF6E0', border: '1px solid #F5D58A' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
              <div style={{ lineHeight: 1.5 }}><b>{en ? 'Tip: ' : 'Dica: '}</b>{tx.tip}</div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {tut.act && <button className="btn pri" style={{ flex: "none", width: "auto" }} onClick={() => run(tut.act!)}>{ACT_LABEL[tut.act][en ? 1 : 0]} →</button>}
              <span style={{ flex: 1 }} />
              <button className="btn" disabled={idx === 0} style={{ flex: 'none', width: 'auto', opacity: idx === 0 ? 0.4 : 1 }} onClick={() => pick(TUTORIALS[idx - 1].id)}>← {en ? 'Previous' : 'Anterior'}</button>
              <button className="btn" disabled={idx === TUTORIALS.length - 1} style={{ flex: 'none', width: 'auto', opacity: idx === TUTORIALS.length - 1 ? 0.4 : 1 }} onClick={() => pick(TUTORIALS[idx + 1].id)}>{en ? 'Next' : 'Próximo'} →</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
