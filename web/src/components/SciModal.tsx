import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { cx } from '../lib/util'
import { Icon } from './Icon'
import { L, POL, SCI, worldviewUrl, type Lang } from '../lib/science'
import { NAME, POL_OF, RULE, factor, fmtDate, physics, regionEvidence, statLines, statPlain } from '../lib/evidence'

type Tab = 'causas' | 'pol'
const BLUE = '#2563EB'

/** Dois botões ("Causas prováveis" e "Polarizações") que abrem a explicação em uma janela */
export function SciButtons({ kind, compact }: { kind?: string; compact?: boolean }) {
  const { s } = useApp()
  const en = s.lang === 'en'
  const [open, setOpen] = useState<Tab | null>(null)
  const b = 'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition hover:bg-[#EAF2FF]'
  return (
    <>
      <div className={cx('flex flex-wrap gap-2', compact && 'gap-1.5')}>
        <button className={b} style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#1E3A8A', background: '#F5F9FF' }} onClick={e => { e.stopPropagation(); setOpen('causas') }}>
          <span aria-hidden="true">🔎</span>{en ? 'Likely causes' : 'Causas prováveis'}
        </button>
        <button className={b} style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#1E3A8A', background: '#F5F9FF' }} onClick={e => { e.stopPropagation(); setOpen('pol') }}>
          <span aria-hidden="true">📡</span>{en ? 'Polarizations' : 'Polarizações'}
        </button>
      </div>
      {open && <SciModal tab={open} kind={kind} onClose={() => setOpen(null)} />}
    </>
  )
}

export function SciModal({ tab: t0, kind, onClose }: { tab: Tab; kind?: string; onClose: () => void }) {
  const { s, ds, setRegion } = useApp()
  const lang = s.lang as Lang, en = lang === 'en'
  const [tab, setTab] = useState<Tab>(t0)
  const real = s.src === 'real'
  const rid = real ? ds.realMeta.id : 'demo'
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k, true); return () => document.removeEventListener('keydown', k, true)
  }, [onClose])
  const kinds = (real ? ['agua', 'solo', 'arvore'] : ['agua', 'fogo', 'arvore', 'solo']).filter(k => !kind || kind === 'todos' || k === kind)
  const rev = real ? regionEvidence(ds.timeline) : null
  const n1 = (x: number) => (en ? x.toFixed(1) : x.toFixed(1).replace('.', ','))
  const typeName = (k: string) => (en ? ({ agua: real ? 'New water' : 'Floods', solo: real ? 'Water receded' : 'Dry soil', arvore: real ? 'Forest lost' : 'Deforestation', fogo: 'Fires' } as Record<string, string>)[k] : ds.types[k as keyof typeof ds.types]?.n ?? k)

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(8,14,28,.55)' }} onClick={e => { e.stopPropagation(); onClose() }} role="dialog" aria-modal="true">
      <div className="flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 pb-3 pt-5" style={{ background: 'linear-gradient(135deg,#E3F9FD,#B9F0FA)' }}>
          <div className="flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[.1em]" style={{ color: BLUE }}>{en ? 'Understand the change' : 'Entenda a mudança'}</div>
            <h2 className="m-0 text-[20px] font-extrabold" style={{ color: '#1E2A3A' }}>{tab === 'causas' ? (en ? 'Likely causes' : 'Causas prováveis') : (en ? 'Which polarization shows what, and why' : 'Qual polarização mostra o quê, e por quê')}</h2>
          </div>
          <button aria-label={en ? 'Close' : 'Fechar'} className="grid h-9 w-9 place-items-center rounded-full bg-white/80" onClick={onClose}><Icon k="x" size={16} /></button>
        </div>
        <div className="flex gap-1 px-6 pt-3" role="tablist">
          {([['causas', en ? '🔎 Likely causes' : '🔎 Causas prováveis'], ['pol', en ? '📡 Polarizations' : '📡 Polarizações']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="rounded-t-lg px-4 py-2 text-[13px] font-bold"
              style={tab === k ? { background: '#0F1B33', color: '#fff' } : { background: '#EEF2F8', color: '#1E2A3A' }}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 text-[14px] leading-relaxed" style={{ color: '#2B3A4D', borderTop: '2px solid #0F1B33' }}>
          {tab === 'causas' ? (
            <>
              {real && rev && (
                <div className="mb-4 rounded-xl p-4" style={{ background: '#EAF2FF', border: '1px solid #BCD3F7' }}>
                  <div className="mb-1 text-[12px] font-extrabold uppercase tracking-[.08em]" style={{ color: BLUE }}>{ds.realMeta.nome} · {en ? 'what the real data shows' : 'o que os dados reais mostram'}</div>
                  <p className="m-0 mb-2 rounded-lg bg-white p-2.5 text-[13px]"><b>💬 {en ? 'In plain words: ' : 'Em palavras simples: '}</b>{en ? 'The satellite passes over the same place about every 12 days. Each row compares one pass with the one before and counts how many places changed. A high number of “water receded” means a lot of water going away; a high number of “new water” means a lot of places getting flooded.' : 'O satélite passa sobre o mesmo lugar a cada cerca de 12 dias. Cada linha compara uma passagem com a anterior e conta quantos lugares mudaram. Muitos casos de “água que recuou” significam muita água indo embora; muitos de “água nova”, muitos lugares ficando alagados.'}</p>
                  <p className="m-0 mb-2 text-[13px]">{en ? `${rev.total} detections in ${rev.passes.length} comparisons between NISAR passes. Each row compares a pass with an earlier one.` : `${rev.total} focos em ${rev.passes.length} comparações entre passagens do NISAR. Cada linha compara uma passagem com uma anterior.`}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12.5px]">
                      <thead><tr style={{ color: '#5B6B7F', textAlign: 'left' }}><th className="py-1 pr-2">{en ? 'Pass (vs. earlier)' : 'Passagem (vs. anterior)'}</th>{(['agua', 'solo', 'arvore'] as const).map(k => <th key={k} className="py-1 pr-2" style={{ color: ds.types[k].c }}>{L(lang, NAME[k]).split(' (')[0]}</th>)}</tr></thead>
                      <tbody>
                        {rev.passes.map(p => {
                          const mx = Math.max(p.c.agua, p.c.solo, p.c.arvore)
                          return <tr key={p.date} style={{ borderTop: '1px solid #D5E3EC' }}><td className="py-1 pr-2">{fmtDate(p.date, lang)} <span style={{ color: '#5B6B7F' }}>({fmtDate(p.vs, lang)})</span></td>{(['agua', 'solo', 'arvore'] as const).map(k => <td key={k} className="py-1 pr-2" style={{ fontWeight: p.c[k] && p.c[k] === mx ? 800 : 400 }}>{p.c[k]}</td>)}</tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="m-0 mt-2 text-[11.5px]" style={{ color: '#5B6B7F' }}>{en ? 'At most 25 detections per type per pass are kept (the largest), so 25 means “25 or more”.' : 'Guardamos no máximo 25 focos por tipo por passagem (os maiores): 25 significa “25 ou mais”.'}</p>
                </div>
              )}
              {!real && <p className="mt-0 rounded-lg p-3" style={{ background: '#FFF6E0' }}>{en ? 'Example mode uses simulated data, so there are no real measurements here. Below is only the radar physics. Switch to Real NISAR to see the measured evidence.' : 'O modo Exemplo usa dados simulados, então aqui não há medições reais. Abaixo está só a física do radar. Troque para NISAR real para ver as evidências medidas.'}</p>}
              {kinds.map(k => {
                const ph = physics(k, lang)
                const st = rev?.stats.find(x => x.k === k)
                if (!ph) return null
                return (
                  <div key={k} className="mb-3 rounded-xl border p-4" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#D5E3EC' }}>
                    <div className="mb-2 flex items-center gap-2 font-extrabold" style={{ color: ds.types[k as keyof typeof ds.types]?.c ?? '#1E2A3A' }}>
                      <Icon k={ds.types[k as keyof typeof ds.types]?.ic ?? 'info'} size={18} />{typeName(k)}
                      <span className="ml-auto rounded-full px-2 py-0.5 text-[11px]" style={{ background: '#0F1B33', color: '#fff' }}>{en ? 'signal' : 'sinal'} {POL[k]?.pol}</span>
                    </div>
                    {st && st.n > 0 && <div className="mb-2 rounded-lg p-2.5" style={{ background: '#F5F9FF' }}><b>💬 {en ? 'In plain words: ' : 'Em palavras simples: '}</b>{statPlain(st, lang)}</div>}
                    {st && (
                      <div className="mb-2">
                        <b>{en ? 'Measured (scientific data): ' : 'Medido (dados científicos): '}</b>
                        {statLines(st, lang).map(x => <div key={x} className="flex gap-2"><span style={{ color: BLUE, fontWeight: 800 }}>›</span><span>{x}</span></div>)}
                      </div>
                    )}
                    <p className="m-0 mb-1"><b>{en ? 'What the signal means: ' : 'O que o sinal significa: '}</b>{ph.what}</p>
                    <b>{en ? 'What can produce this signal (radar physics):' : 'O que pode gerar esse sinal (física do radar):'}</b>
                    <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                      {ph.could.map(x => <li key={x} className="flex gap-2"><span style={{ color: BLUE, fontWeight: 800 }}>›</span><span>{x}</span></li>)}
                    </ul>
                    <p className="m-0 mt-2 text-[12.5px]" style={{ color: '#5B6B7F' }}>{ph.notRadar}</p>
                  </div>
                )
              })}
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: '#FFF6E0', border: '1px solid #F5D58A' }}>
                <span>★ <b>{en ? 'Radar measures the change, not the cause.' : 'O radar mede a mudança, não a causa.'}</b> {en ? 'To find out which of the possibilities happened, look at an optical image of the same area and date:' : 'Para saber qual das possibilidades aconteceu, veja uma imagem óptica da mesma área e data:'}</span>
                {real && <a className="btn pri" style={{ flex: 'none', width: 'auto' }} href={worldviewUrl(ds.realMeta.imagem, ds.timeline.at(-1)?.date)} target="_blank" rel="noreferrer">{en ? 'Open NASA Worldview ↗' : 'Abrir NASA Worldview ↗'}</a>}
              </div>
              {real && (
                <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
                  <span style={{ color: '#5B6B7F' }}>{en ? 'Other regions:' : 'Outras regiões:'}</span>
                  {ds.realIndex.filter(m => m.id !== rid).map(m => (
                    <button key={m.id} className="rounded-full border px-3 py-1 font-bold" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: BLUE }} onClick={() => setRegion(m.id, { src: 'real' })}>{m.nome}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl p-4" style={{ background: '#F3F5F8' }}><b>{en ? 'Optical satellite (passive)' : 'Satélite óptico (passivo)'}</b><p className="m-0 mt-1">{L(lang, SCI.active.a)}</p></div>
                <div className="rounded-xl p-4" style={{ background: '#E3F9FD' }}><b>{en ? 'NISAR radar (active)' : 'Radar NISAR (ativo)'}</b><p className="m-0 mt-1">{L(lang, SCI.active.b)}</p></div>
              </div>
              <h3 className="mb-2 mt-0 text-[15px] font-extrabold" style={{ color: '#1E2A3A' }}>{en ? 'What the radar senses' : 'O que o radar sente'}</h3>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {SCI.senses.map(([, h, d]) => <div key={h[0]} className="rounded-xl border p-3" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#D5E3EC' }}><b>{L(lang, h)}</b><p className="m-0 mt-1 text-[13px]">{L(lang, d)}</p></div>)}
              </div>
              <h3 className="mb-2 mt-0 text-[15px] font-extrabold" style={{ color: '#1E2A3A' }}>{en ? 'Polarizations: the direction of the wave' : 'Polarizações: a direção da onda'}</h3>
              <p className="mt-0">{en ? 'The radar sends its wave in one direction (H = horizontal) and listens in a chosen direction. Each combination highlights something different:' : 'O radar envia a onda numa direção (H = horizontal) e escuta numa direção escolhida. Cada combinação destaca uma coisa diferente:'}</p>
              <div className="mb-4 flex flex-col gap-3">
                {SCI.pols.map(([p, how, what, use]) => (
                  <div key={p} className={cx('flex gap-4 rounded-xl border p-4', kind && POL[kind]?.pol === p && 'ring-2')} style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#D5E3EC', ['--tw-ring-color' as string]: BLUE }}>
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-[20px] font-extrabold text-white" style={{ background: p === 'HH' ? '#1C7ED6' : '#2F9E44' }}>{p}</div>
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-[.06em]" style={{ color: '#5B6B7F' }}>{L(lang, how)}</div>
                      <p className="m-0 my-1">{L(lang, what)}</p>
                      <b style={{ color: BLUE }}>{L(lang, use)}</b>
                    </div>
                  </div>
                ))}
              </div>
              {real && rev && (
                <div className="mb-4 rounded-xl p-4" style={{ background: '#EAF2FF', border: '1px solid #BCD3F7' }}>
                  <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[.08em]" style={{ color: BLUE }}>{ds.realMeta.nome} · {en ? 'measured in the real data' : 'medido nos dados reais'}</div>
                  {rev.stats.filter(x => x.n).map(x => (
                    <div key={x.k} className="mb-1 flex gap-2">
                      <span className="rounded px-1.5 text-[11px] font-extrabold text-white" style={{ background: POL_OF[x.k] === 'HH' ? '#1C7ED6' : '#2F9E44', height: 18 }}>{POL_OF[x.k]}</span>
                      <span><b>{L(lang, NAME[x.k]).split(' (')[0]}:</b> {en ? `${x.n} detections, ${POL_OF[x.k]} ${x.k === 'solo' ? 'rose' : 'dropped'} ${n1(x.dbMin)}–${n1(x.dbMax)} dB (average ${n1(x.dbMean)} dB = echo ${n1(factor(x.dbMean))}× ${x.k === 'solo' ? 'stronger' : 'weaker'}).` : `${x.n} focos, ${POL_OF[x.k]} ${x.k === 'solo' ? 'subiu' : 'caiu'} de ${n1(x.dbMin)} a ${n1(x.dbMax)} dB (média ${n1(x.dbMean)} dB = eco ${n1(factor(x.dbMean))}× ${x.k === 'solo' ? 'mais forte' : 'mais fraco'}).`} <span style={{ color: '#5B6B7F' }}>{en ? 'Rule: ' : 'Regra: '}{L(lang, RULE[x.k])}</span></span>
                    </div>
                  ))}
                </div>
              )}
              <h3 className="mb-2 mt-0 text-[15px] font-extrabold" style={{ color: '#1E2A3A' }}>{en ? 'How A.R.K.O decides each change' : 'Como o A.R.K.O decide cada mudança'}</h3>
              <table className="mb-3 w-full border-collapse text-[13px]">
                <tbody>
                  {SCI.rules.map(([n, r, w]) => (
                    <tr key={n[0]} style={{ borderBottom: '1px solid #E3EAF0' }}>
                      <td className="py-2 pr-3 font-bold" style={{ color: '#1E2A3A' }}>{L(lang, n)}</td>
                      <td className="py-2 pr-3 font-mono text-[12px]" style={{ color: '#1D4ED8' }}>{L(lang, r)}</td>
                      <td className="py-2">{L(lang, w)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="m-0 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'dB (decibel) measures how much signal came back. −16 dB is very little: typical of still water. A change of 3 dB means the signal doubled or halved.' : 'dB (decibel) mede quanto sinal voltou. −16 dB é muito pouco: típico de água parada. Uma mudança de 3 dB significa que o sinal dobrou ou caiu pela metade.'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
