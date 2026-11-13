import { useApp } from '../lib/store'
import { Icon } from './Icon'
import { L, SCI, type Lang } from '../lib/science'

const ICONS = ['solo', 'alvo', 'casa', 'nuvem', 'arvore', 'agua']

/** Aba "Aplicações futuras": o que o NISAR permite fazer além do que o A.R.K.O já mostra */
export function Future() {
  const { s, go } = useApp()
  const lang = s.lang as Lang, en = lang === 'en'
  return (
    <section className="view on" id="v-futuro" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Future applications' : 'Aplicações futuras'}</h1>
          <div className="answer"><span className="dot" style={{ background: 'var(--acc)' }} />
            <span>{en ? 'Today A.R.K.O tracks water and forest. NISAR can measure much more: this is where we can go next.' : 'Hoje o A.R.K.O acompanha água e floresta. O NISAR mede muito mais: é para cá que podemos ir.'}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0F1B33,#173A6B)', color: '#fff', padding: '20px 24px' }}>
          <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#9CC3FF' }}>NISAR · NASA + ISRO</div>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            {SCI.facts.map(([k, v]) => (
              <div key={k[0]}><div className="text-[12px]" style={{ color: '#9CC3FF' }}>{L(lang, k)}</div><div className="text-[15px] font-bold">{L(lang, v)}</div></div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {SCI.future.map(([, h, d], i) => (
            <div key={h[0]} className="rounded-xl border p-4" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#D5E3EC', background: i % 2 ? '#fff' : '#E9FAFD' }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: '#1E2A3A', color: '#fff' }}><Icon k={ICONS[i]} size={17} /></span>
                <b className="text-[15px]" style={{ color: '#1E2A3A' }}>{L(lang, h)}</b>
              </div>
              <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>{L(lang, d)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{en ? 'Next steps for A.R.K.O' : 'Próximos passos do A.R.K.O'}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14px]" style={{ color: '#2B3A4D' }}>
            {[
              [en ? 'Soil moisture alerts for farmers, using the same 12-day passes.' : 'Alertas de umidade do solo para agricultores, com as mesmas passagens de 12 dias.'],
              [en ? 'Ground deformation (InSAR) layer for landslides and subsidence in cities.' : 'Camada de deformação do solo (InSAR) para deslizamentos e afundamento em cidades.'],
              [en ? 'Real fire scars with the HV signal, plus optical confirmation.' : 'Cicatrizes de queimada reais com o sinal HV, confirmadas por imagem óptica.'],
              [en ? 'Notify people who follow a region when a high-risk change appears.' : 'Avisar quem acompanha uma região quando surgir mudança de alto risco.'],
              [en ? 'Any region in the world in minutes: just add its orbit and area.' : 'Qualquer região do mundo em minutos: basta cadastrar a órbita e a área.'],
            ].map(([x]) => <li key={x} className="flex gap-2"><span style={{ color: '#2563EB', fontWeight: 800 }}>›</span>{x}</li>)}
          </ul>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{en ? 'Honest limits of today’s data' : 'Limites honestos dos dados de hoje'}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13.5px]" style={{ color: '#2B3A4D' }}>
            {SCI.limits.map(b => <li key={b[0]} className="flex gap-2"><span style={{ color: '#DC2626', fontWeight: 800 }}>!</span>{L(lang, b)}</li>)}
          </ul>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-3" style={{ padding: 16 }}>
        <b style={{ fontSize: 13 }}>{en ? 'Open data and sources:' : 'Dados abertos e fontes:'}</b>
        {SCI.sources.map(([n, u]) => <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-[12.5px] font-bold" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#2563EB' }}>{n} ↗</a>)}
        <span className="text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'Open source · MIT license' : 'Código aberto · licença MIT'}</span>
        <span style={{ flex: 1 }} />
        <button className="btn pri" style={{ flex: 'none', width: 'auto' }} onClick={() => go('inicio', 'map')}>{en ? 'Back to the map →' : 'Voltar ao mapa →'}</button>
      </div>
    </section>
  )
}
