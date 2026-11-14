import { useApp } from '../lib/store'
import { Icon } from './Icon'
import { L, SCI, type Lang } from '../lib/science'
import { USOS } from '../lib/usos'

const ICONS = ['solo', 'alvo', 'casa', 'nuvem', 'arvore', 'agua']
type Bi = [string, string]

// Como o A.R.K.O sai de 4 regiões para o mundo inteiro, aberto para todos
const ESCALA: { ic: string; t: Bi; d: Bi }[] = [
  { ic: 'radar', t: ['Os satélites já cobrem o mundo', 'The satellites already cover the world'],
    d: ['O NISAR mapeia quase toda a terra do planeta a cada 12 dias; o LHASA e o FIRMS da NASA também são globais. O dado para qualquer lugar já existe.', 'NISAR maps nearly all of Earth’s land every 12 days; NASA’s LHASA and FIRMS are global too. The data for any place already exists.'] },
  { ic: 'alvo', t: ['Nova região em minutos', 'A new region in minutes'],
    d: ['Para monitorar um lugar novo basta cadastrar a área e a órbita do satélite. O robô passa a baixar, comparar e publicar sozinho.', 'To monitor a new place you only register the area and the satellite orbit. The robot then downloads, compares and publishes on its own.'] },
  { ic: 'nuvem', t: ['Custo quase zero', 'Near-zero cost'],
    d: ['Dados públicos da NASA, robô no GitHub Actions e site estático: dá para rodar sem servidor próprio e sem licença paga.', 'Public NASA data, a robot on GitHub Actions and a static site: it runs without its own server and without paid licenses.'] },
  { ic: 'casa', t: ['Aberto para todos', 'Open to everyone'],
    d: ['Código aberto (licença MIT), dados abertos e método explicado: qualquer cidade, escola ou ONG pode usar, conferir e melhorar.', 'Open source (MIT license), open data and an explained method: any city, school or NGO can use, check and improve it.'] },
]

const FASES: { t: Bi; d: Bi; hoje?: boolean }[] = [
  { hoje: true, t: ['Hoje · MVP', 'Today · MVP'], d: ['4 regiões reais (Amazônia, Sul do Brasil, Bangladesh e Nepal), atualização diária, previsões por cruzamento de dados.', '4 real regions (Amazon, Southern Brazil, Bangladesh and Nepal), daily updates, forecasts from crossed data.'] },
  { t: ['Fase 2 · Movimento do solo e qualquer lugar', 'Phase 2 · Ground motion and anywhere'], d: ['Nova fonte NISAR GUNW para alertas de encosta e geleira se mexendo; e a pessoa desenha a área no mapa para monitorar qualquer lugar.', 'New NISAR GUNW source for alerts of slopes and glaciers moving; and people draw an area on the map to monitor any place.'] },
  { t: ['Fase 3 · Aviso que chega', 'Phase 3 · Warnings that reach people'], d: ['Alerta por WhatsApp, SMS e e-mail para quem acompanha uma região, e envio no padrão usado pela Defesa Civil (CAP).', 'Alerts by WhatsApp, SMS and e-mail to people following a region, and delivery in the standard used by civil defense (CAP).'] },
  { t: ['Fase 4 · Países inteiros e API aberta', 'Phase 4 · Whole countries and an open API'], d: ['Cobertura contínua de países, API pública para governos, escolas e pesquisadores, e validação com desastres passados.', 'Continuous coverage of whole countries, a public API for governments, schools and researchers, and validation against past disasters.'] },
]

/** Aba "Aplicações futuras": quem usa, como escala para o mundo e o que o NISAR ainda permite medir */
export function Future() {
  const { s, go } = useApp()
  const lang = s.lang as Lang, en = lang === 'en'
  const B = (x: Bi) => x[en ? 1 : 0]
  return (
    <section className="view on" id="v-futuro" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Future applications' : 'Aplicações futuras'}</h1>
          <div className="answer"><span className="dot" style={{ background: 'var(--acc)' }} />
            <span>{en ? 'From 4 regions to the whole world, open to anyone who needs to decide, teach or stay safe.' : 'De 4 regiões para o mundo inteiro, aberto para quem precisa decidir, ensinar ou se proteger.'}</span>
          </div>
        </div>
      </div>

      {/* 1 · quem usa e como */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>{en ? 'Who can use it, and how' : 'Quem pode usar, e como'}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {USOS.map(u => (
            <div key={u.quem[0]} className="rounded-xl p-4" style={{ border: '1px solid #D5E3EC', background: '#F7FAFC' }}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: '#1E2A3A', color: '#fff' }}><Icon k={u.ic} size={15} /></span>
                <b className="text-[14.5px]" style={{ color: '#1E2A3A' }}>{B(u.quem)}</b>
              </div>
              <div className="text-[13px] font-bold" style={{ color: '#2563EB' }}>{B(u.para)}</div>
              <p className="m-0 mt-1 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>{B(u.exemplo)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2 · como vira mundial e aberto */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0F1B33,#173A6B)', color: '#fff', padding: '18px 22px' }}>
          <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#9CC3FF' }}>{en ? 'SCALABILITY' : 'ESCALABILIDADE'}</div>
          <div className="mt-1 text-[18px] font-extrabold">{en ? 'How A.R.K.O becomes global and open' : 'Como o A.R.K.O vira mundial e de uso aberto'}</div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {ESCALA.map(e => (
            <div key={e.t[0]}>
              <div className="mb-1.5 flex items-center gap-2"><span style={{ color: '#2563EB', display: 'flex' }}><Icon k={e.ic} size={18} /></span><b className="text-[14px]">{B(e.t)}</b></div>
              <p className="m-0 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>{B(e.d)}</p>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-4 rounded-xl p-4" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <div className="mb-1 flex items-center gap-2">
            <span style={{ color: '#7C3AED', display: 'flex' }}><Icon k="deslizamento" size={18} /></span>
            <b className="text-[14px]" style={{ color: '#4C1D95' }}>{en ? 'Next data source: NISAR GUNW (ground motion)' : 'Próxima fonte de dados: NISAR GUNW (movimento do solo)'}</b>
          </div>
          <p className="m-0 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>
            {en
              ? 'GUNW (Geocoded Unwrapped Interferogram) is another NISAR product: it compares the phase of the radar wave between two passes and measures how many centimeters the ground moved. Today A.R.K.O uses GCOV, which shows what the surface looks like (water, vegetation, soil). Adding GUNW lets it see a slope or a glacier creeping before it collapses, like the signals found after the fact in Nepal. The same robot will download it, with the same free NASA Earthdata login.'
              : 'O GUNW (interferograma desdobrado e georreferenciado) é outro produto do NISAR: ele compara a fase da onda do radar entre duas passagens e mede quantos centímetros o chão se moveu. Hoje o A.R.K.O usa o GCOV, que mostra como a superfície está (água, vegetação, solo). Com o GUNW, dá para ver uma encosta ou uma geleira se mexendo antes de desabar, como os sinais encontrados depois no Nepal. O mesmo robô vai baixá-lo, com o mesmo login gratuito do NASA Earthdata.'}
          </p>
        </div>
        <div className="px-5 pb-5">
          <div className="grid gap-2 lg:grid-cols-4">
            {FASES.map(f => (
              <div key={f.t[0]} className="rounded-lg p-3" style={{ background: f.hoje ? '#ECFDF3' : '#F1F4F8', border: `1px solid ${f.hoje ? '#A6F4C5' : '#DCE2EA'}` }}>
                <b className="text-[13px]" style={{ color: f.hoje ? '#05603A' : '#1E2A3A' }}>{B(f.t)}</b>
                <p className="m-0 mt-1 text-[12.5px] leading-snug" style={{ color: '#3C4B5E' }}>{B(f.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 · o que o NISAR ainda permite medir */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#F7FAFC', padding: '14px 20px', borderBottom: '1px solid #E3E8EF' }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>{en ? 'What NISAR can still measure' : 'O que o NISAR ainda permite medir'}</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            {SCI.facts.map(([k, v]) => (
              <div key={k[0]}><div className="text-[12px]" style={{ color: '#5B6B7F' }}>{L(lang, k)}</div><div className="text-[14px] font-bold">{L(lang, v)}</div></div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {SCI.future.map(([, h, d], i) => (
            <div key={h[0]} className="rounded-xl p-4" style={{ border: '1px solid #D5E3EC', background: i % 2 ? '#fff' : '#E9FAFD' }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: '#1E2A3A', color: '#fff' }}><Icon k={ICONS[i]} size={17} /></span>
                <b className="text-[15px]" style={{ color: '#1E2A3A' }}>{L(lang, h)}</b>
              </div>
              <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>{L(lang, d)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 text-[13.5px]" style={{ color: '#2B3A4D' }}>
          <b>{en ? 'Next for A.R.K.O: ' : 'Próximo passo do A.R.K.O: '}</b>
          {en ? 'add the NISAR GUNW product to measure ground motion and see a slope moving before it slides, as happened before the Nepal collapse.' : 'adicionar o produto NISAR GUNW para medir o movimento do solo e ver a encosta se mexendo antes de deslizar, como aconteceu antes do colapso no Nepal.'}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{en ? 'Honest limits of today’s data' : 'Limites honestos dos dados de hoje'}</h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13.5px]" style={{ color: '#2B3A4D' }}>
          {SCI.limits.map(b => <li key={b[0]} className="flex gap-2"><span style={{ color: '#DC2626', fontWeight: 800 }}>!</span>{L(lang, b)}</li>)}
          <li className="flex gap-2"><span style={{ color: '#DC2626', fontWeight: 800 }}>!</span>{en ? 'Forecasts use rules made by the team and have not yet been validated against past disasters.' : 'As previsões usam regras criadas pela equipe e ainda não foram validadas com desastres passados.'}</li>
        </ul>
      </div>

      <div className="card flex flex-wrap items-center gap-3" style={{ padding: 16 }}>
        <b style={{ fontSize: 13 }}>{en ? 'Open data and sources:' : 'Dados abertos e fontes:'}</b>
        {SCI.sources.map(([n, u]) => <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-[12.5px] font-bold" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#2563EB' }}>{n} ↗</a>)}
        <a href="https://gpm.nasa.gov/landslides/projects.html" target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-[12.5px] font-bold" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#2563EB' }}>NASA LHASA ↗</a>
        <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-[12.5px] font-bold" style={{ borderStyle: 'solid', borderWidth: 1, borderColor: '#BCD3F7', color: '#2563EB' }}>NASA FIRMS ↗</a>
        <span className="text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'Open source · MIT license' : 'Código aberto · licença MIT'}</span>
        <span style={{ flex: 1 }} />
        <button className="btn pri" style={{ flex: 'none', width: 'auto' }} onClick={() => go('inicio', 'map')}>{en ? 'Back to the map →' : 'Voltar ao mapa →'}</button>
      </div>
    </section>
  )
}
