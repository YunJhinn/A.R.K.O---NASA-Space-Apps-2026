// v6.2 · "Validação": o que o A.R.K.O mostrava antes de desastres que aconteceram de verdade.
// Três casos: Rio Grande do Sul (enchente, jul 2026), Nepal (deslizamentos, ago–set 2026) e
// Moçambique (enchente do Limpopo, jan 2026, comparada com o resultado publicado pela NASA).
import { useEffect, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import type { LinhaTempoJson } from '../lib/types'
import { FONTES, LIMIARES, NEPAL_TAB, NP_LHASA, NP_MARCOS, RS_AGUA, RS_LHASA, RS_MARCOS, type Marco } from '../lib/validacao'

type Bi = [string, string]
const COR = { sinal: '#D97706', desastre: '#DC2626', radar: '#2563EB' }

/** Barras diárias do LHASA com as linhas de 10% e 25% e os marcos (sinal, desastre, radar) */
function Grafico({ v, marcos, agua, en }: { v: [string, number][]; marcos: Marco[]; agua?: [string, number][]; en: boolean }) {
  const W = 720, H = 190, top = 30, base = 150, n = v.length, bw = W / n
  const y = (p: number) => base - p * (base - top)
  const x = (d: string) => { const i = v.findIndex(e => e[0] >= d); return (i < 0 ? n - 1 : i) * bw + bw / 2 }
  const lbl = (d: string) => (en ? d.slice(3) + '/' + d.slice(0, 2) : d.slice(3) + '/' + d.slice(0, 2))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={en ? 'Daily LHASA chart with events' : 'Gráfico diário do LHASA com os eventos'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0.1, 0.25].map(l => (
        <g key={l}>
          <line x1={0} x2={W} y1={y(l)} y2={y(l)} stroke={l === 0.25 ? '#DC2626' : '#D97706'} strokeDasharray="4 4" strokeWidth={1} opacity={0.7} />
          <text x={4} y={y(l) - 3} textAnchor="start" fontSize={10} fontWeight={700} stroke="#fff" strokeWidth={3} paintOrder="stroke" fill={l === 0.25 ? '#B42318' : '#B54708'}>{l === 0.25 ? (en ? 'High 25%' : 'Alto 25%') : (en ? 'Medium 10%' : 'Médio 10%')}</text>
        </g>
      ))}
      {v.map(([d, p], i) => (
        <rect key={d} x={i * bw + 1} y={y(p)} width={Math.max(1, bw - 2)} height={base - y(p)} rx={1.5}
          fill={p >= 0.25 ? '#DC2626' : p >= 0.1 ? '#F59E0B' : '#C9CDD3'}><title>{`${lbl(d)}: ${Math.round(p * 100)}%`}</title></rect>
      ))}
      {agua?.filter(([d]) => d >= v[0][0] && d <= v[n - 1][0]).map(([d, a]) => (
        <g key={d}>
          <circle cx={x(d)} cy={base + 14} r={Math.max(4, Math.min(11, 3 + a / 2))} fill="#2563EB" opacity={a > 1 ? 0.9 : 0.35} />
          <text x={x(d)} y={base + 33} textAnchor="middle" fontSize={9.5} fill="#1D4ED8">{a.toLocaleString(en ? 'en' : 'pt-BR')} km²</text>
        </g>
      ))}
      {marcos.map((m, i) => (
        <g key={m.d + i}>
          <line x1={x(m.d)} x2={x(m.d)} y1={18} y2={base} stroke={COR[m.tipo]} strokeWidth={1.5} />
          <circle cx={x(m.d) + (i > 0 && x(m.d) - x(marcos[i - 1].d) < 18 ? 9 : 0)} cy={11} r={9} fill={COR[m.tipo]} />
          <text x={x(m.d) + (i > 0 && x(m.d) - x(marcos[i - 1].d) < 18 ? 9 : 0)} y={15} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">{i + 1}</text>
        </g>
      ))}
      <text x={0} y={H - 2} fontSize={10} fill="#5B6B7F">{lbl(v[0][0])}</text>
      <text x={W} y={H - 2} textAnchor="end" fontSize={10} fill="#5B6B7F">{lbl(v[n - 1][0])}</text>
    </svg>
  )
}

function Marcos({ marcos, en }: { marcos: Marco[]; en: boolean }) {
  return (
    <ol className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12.5px]">
      {marcos.map((m, i) => (
        <li key={i} className="flex items-center gap-1.5"><b className="grid h-[18px] w-[18px] place-items-center rounded-full text-[11px]" style={{ background: COR[m.tipo], color: '#fff' }}>{i + 1}</b>
          <span><b>{m.d.slice(3)}/{m.d.slice(0, 2)}</b> · {m.t[en ? 1 : 0]}</span></li>
      ))}
    </ol>
  )
}

function Legenda({ en, agua }: { en: boolean; agua?: boolean }) {
  const it: [string, string][] = [['#DC2626', en ? 'LHASA ≥25% (high)' : 'LHASA ≥25% (alto)'], ['#F59E0B', en ? 'LHASA 10–25%' : 'LHASA 10–25%'], ['#D97706', en ? 'warning sign' : 'sinal prévio'], ['#DC2626', en ? 'disaster (news / civil defense)' : 'desastre (imprensa / Defesa Civil)']]
  if (agua) it.push(['#2563EB', en ? 'NISAR: new water per pass' : 'NISAR: água nova por passagem'])
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: '#3C4B5E' }}>{it.map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><i style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />{l}</span>)}</div>
}

function Passos({ itens, en }: { itens: { c: string; t: Bi; d: Bi }[]; en: boolean }) {
  return (
    <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
      {itens.map((p, i) => (
        <li key={i} className="rounded-xl p-3" style={{ background: '#fff', border: `1px solid ${p.c}55`, borderTop: `4px solid ${p.c}` }}>
          <b className="text-[13.5px]" style={{ color: p.c }}>{p.t[en ? 1 : 0]}</b>
          <p className="m-0 mt-1 text-[13px] leading-snug" style={{ color: '#3C4B5E' }}>{p.d[en ? 1 : 0]}</p>
        </li>
      ))}
    </ol>
  )
}

export function Validacao() {
  const { s, setRegion, go, ds } = useApp()
  const realIndex = ds.realIndex
  const en = s.lang === 'en', B = (x: Bi) => x[en ? 1 : 0]
  const [moz, setMoz] = useState<LinhaTempoJson | null | 'nao'>(null)
  useEffect(() => {
    fetch(DATA_BASE + 'regioes/mocambique/linha_tempo.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : 'nao')).then(setMoz).catch(() => setMoz('nao'))
  }, [])
  const abrir = (id: string) => { if (realIndex.some(m => m.id === id)) { setRegion(id, { src: 'real' }); go('inicio') } }
  const tem = (id: string) => realIndex.some(m => m.id === id)
  const mozPass = moz && moz !== 'nao' ? moz.passagens : []
  const agua = (p: (typeof mozPass)[number]) => p.focos.filter(f => f.tipo === 'agua').reduce((a, f) => a + (f.area_km2 ?? 0), 0)
  const fmt = (n: number) => n.toLocaleString(en ? 'en' : 'pt-BR', { maximumFractionDigits: 1 })
  const btn = (id: string, l: Bi) => tem(id) && <button type="button" className="btn" onClick={() => abrir(id)} style={{ fontSize: 13 }}>{B(l)} →</button>

  return (
    <section className="view on" id="v-validacao" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Validation with real disasters' : 'Validação com desastres reais'}</h1>
          <div className="answer"><span className="dot" style={{ background: '#12B76A' }} />
            <span>{en ? 'We went back in time: what did A.R.K.O show before disasters that really happened in 2026?' : 'Voltamos no tempo: o que o A.R.K.O mostrava antes de desastres que aconteceram de verdade em 2026?'}</span>
          </div>
        </div>
      </div>

      {/* resumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ['1–2', en ? 'days of warning' : 'dias de aviso', en ? 'In RS and Nepal, the landslide/rain signal crossed 25% one to two days before the disaster.' : 'No RS e no Nepal, o sinal de chuva/deslizamento passou de 25% um a dois dias antes do desastre.'],
          ['5 de 6', en ? 'warned in advance' : 'com aviso antes', en ? 'Of 6 places with real disasters (RS and Nepal), 5 had the signal above 25% before the day; all 6 by the day itself.' : 'De 6 locais com desastre real (RS e Nepal), 5 tiveram o sinal acima de 25% antes do dia; todos os 6 até o próprio dia.'],
          ['1 dia', en ? 'to see the water' : 'para ver a água', en ? 'NISAR confirmed the RS flood on the next pass, 1 day after the rivers overflowed, through the clouds.' : 'O NISAR confirmou a enchente do RS na passagem seguinte, 1 dia depois de os rios transbordarem, através das nuvens.'],
        ] as const).map(([n, l, d]) => (
          <div key={l} className="card" style={{ padding: 16 }}>
            <div className="text-[26px] font-extrabold leading-none" style={{ color: '#05603A' }}>{en ? n.replace(' de ', ' of ').replace('dia', 'day') : n}</div>
            <div className="mt-1 text-[13px] font-bold uppercase tracking-wide" style={{ color: '#1E2A3A' }}>{l}</div>
            <p className="m-0 mt-1.5 text-[13px] leading-snug" style={{ color: '#3C4B5E' }}>{d}</p>
          </div>
        ))}
      </div>

      {/* 1 · RS */}
      <div className="card" style={{ padding: 20 }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#2563EB' }}>{en ? 'CASE 1 · FLOOD' : 'CASO 1 · ENCHENTE'}</div>
            <h2 style={{ margin: '2px 0 4px', fontSize: 18 }}>{en ? 'Rio Grande do Sul · July 2026' : 'Rio Grande do Sul · julho de 2026'}</h2>
            <p className="m-0 text-[13.5px]" style={{ color: '#3C4B5E' }}>{en ? 'The Taquari and Caí rivers overflowed on 22 July; by 27 July, 218 municipalities and 59,000 people were affected.' : 'Os rios Taquari e Caí transbordaram em 22 de julho; até 27 de julho, 218 municípios e 59 mil pessoas foram atingidos.'}</p>
          </div>
          {btn('sul', ['Ver o RS no mapa', 'See RS on the map'])}
        </div>
        <div className="mt-3 overflow-x-auto"><div style={{ minWidth: 560 }}><Grafico v={RS_LHASA} marcos={RS_MARCOS} agua={RS_AGUA} en={en} /></div></div>
        <Marcos marcos={RS_MARCOS} en={en} />
        <Legenda en={en} agua />
        <h3 className="mb-2 mt-4 text-[14.5px]">{en ? 'How we could have read it before' : 'Como dava para ler antes'}</h3>
        <Passos en={en} itens={[
          { c: '#D97706', t: ['20 jul · sinal (2 dias antes)', '20 Jul · signal (2 days before)'], d: ['O LHASA, que usa a chuva medida por satélite, passou de 25% em Roca Sales e chegou a 62% no dia 21 no vale do Taquari. Antes disso, o mês todo ficou perto de zero.', 'LHASA, which uses satellite-measured rain, passed 25% in Roca Sales and reached 62% on the 21st in the Taquari valley. Before that, the whole month stayed near zero.'] },
          { c: '#DC2626', t: ['22 jul · enchente', '22 Jul · flood'], d: ['Taquari e Caí transbordam. Com o alerta do dia 20, a Defesa Civil teria 1 a 2 dias para avisar moradores das margens e preparar abrigos.', 'Taquari and Caí overflow. With the alert on the 20th, civil defense would have had 1–2 days to warn riverside residents and prepare shelters.'] },
          { c: '#2563EB', t: ['23 jul · radar confirma', '23 Jul · radar confirms'], d: ['Na passagem seguinte, o NISAR viu 15 km² de água nova (24 focos: Triunfo, Santa Cruz do Sul, Estrela, Eldorado do Sul). Nas duas passagens anteriores, menos de 1 km².', 'On the next pass, NISAR saw 15 km² of new water (24 spots: Triunfo, Santa Cruz do Sul, Estrela, Eldorado do Sul). In the two previous passes, less than 1 km².'] },
        ]} />
        <div className="mt-3 rounded-xl p-4" style={{ background: '#FEF3F2', border: '1px solid #FECDCA' }}>
          <b className="text-[14px]" style={{ color: '#912018' }}>{en ? 'The trend: it was going to get worse' : 'A tendência: ia piorar'}</b>
          <ul className="m-0 mt-1.5 list-disc pl-5 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>
            <li>{en ? 'Three rain peaks in three weeks (21 Jul, 29 Jul, 13 Aug), each above 25%: the ground did not have time to dry.' : 'Três picos de chuva em três semanas (21/07, 29/07 e 13/08), todos acima de 25%: o chão não teve tempo de secar.'}</li>
            <li>{en ? 'NISAR still saw new water on 16 Aug (9.7 km²): waterlogged soil makes each new rain turn into flooding faster.' : 'O NISAR ainda via água nova em 16/08 (9,7 km²): com o solo encharcado, cada chuva nova vira cheia mais rápido.'}</li>
            <li>{en ? 'MetSul warned that, with El Niño active, this flood would be the first of a sequence, as in 2024.' : 'A MetSul avisou que, com o El Niño ativo, essa enchente seria a primeira de uma sequência, como em 2024.'}</li>
            <li><b>{en ? 'Reading A.R.K.O would give: ' : 'A leitura que o A.R.K.O daria: '}</b>{en ? '"repeated strong rain + water that does not go down + season of El Niño = high risk of new floods in the same places". This is the pattern the forecast tab looks for.' : '"chuva forte repetida + água que não baixa + estação de El Niño = risco alto de novas cheias nos mesmos lugares". É esse padrão que a aba Previsão procura.'}</li>
          </ul>
        </div>
        <p className="m-0 mt-3 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'About May 2024: NISAR was not in orbit yet (launched July 2025) and the LHASA archive we read starts in 2025, so we cannot test that flood with the same data. A next step is to use the full LHASA history to compare today with the days before 2024.' : 'Sobre maio de 2024: o NISAR ainda não estava em órbita (lançado em julho de 2025) e o arquivo do LHASA que lemos começa em 2025, então não dá para testar aquela enchente com os mesmos dados. Um próximo passo é usar o histórico completo do LHASA para comparar hoje com os dias antes de 2024.'}</p>
      </div>

      {/* 2 · Nepal */}
      <div className="card" style={{ padding: 20 }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#7C3AED' }}>{en ? 'CASE 2 · LANDSLIDES' : 'CASO 2 · DESLIZAMENTOS'}</div>
            <h2 style={{ margin: '2px 0 4px', fontSize: 18 }}>{en ? 'Nepal · August and September 2026' : 'Nepal · agosto e setembro de 2026'}</h2>
            <p className="m-0 text-[13.5px]" style={{ color: '#3C4B5E' }}>{en ? 'Five districts with deadly landslides. Below: Baglung and Myagdi in September.' : 'Cinco distritos com deslizamentos que mataram pessoas. No gráfico: Baglung e Myagdi em setembro.'}</p>
          </div>
          {btn('nepal', ['Ver o Nepal no mapa', 'See Nepal on the map'])}
        </div>
        <div className="mt-3 overflow-x-auto"><div style={{ minWidth: 560 }}><Grafico v={NP_LHASA} marcos={NP_MARCOS} en={en} /></div></div>
        <Marcos marcos={NP_MARCOS} en={en} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr style={{ textAlign: 'left', color: '#5B6B7F', borderBottom: '1px solid #E3E8EF' }}>
              <th className="py-1.5">{en ? 'District' : 'Distrito'}</th><th>{en ? 'Disaster' : 'Desastre'}</th><th>{en ? '1–2 days before' : '1–2 dias antes'}</th><th>{en ? 'On the day' : 'No dia'}</th><th>{en ? 'Place in the year' : 'Posição no ano'}</th><th>{en ? 'Warning before?' : 'Aviso antes?'}</th>
            </tr></thead>
            <tbody>{NEPAL_TAB.map(r => (
              <tr key={r.lugar} style={{ borderBottom: '1px solid #F0F2F5' }}>
                <td className="py-1.5 font-bold">{r.lugar}</td><td>{B(r.data)}</td><td>{r.antes}</td><td className="font-bold">{r.dia}</td><td>{B(r.pos)}</td>
                <td style={{ color: r.aviso ? '#05603A' : '#B42318', fontWeight: 700 }}>{r.aviso ? (en ? 'Yes' : 'Sim') : (en ? 'No, only on the day' : 'Não, só no dia')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* 3 · Moçambique */}
      <div className="card" style={{ padding: 20 }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#0E7490' }}>{en ? 'CASE 3 · FLOOD, CHECKED AGAINST NASA' : 'CASO 3 · ENCHENTE, CONFERIDA COM A NASA'}</div>
            <h2 style={{ margin: '2px 0 4px', fontSize: 18 }}>{en ? 'Mozambique · Limpopo River · January 2026' : 'Moçambique · rio Limpopo · janeiro de 2026'}</h2>
            <p className="m-0 text-[13.5px]" style={{ color: '#3C4B5E' }}>{en ? 'More than 300,000 people displaced in Gaza province. NASA compared NISAR images of 5 and 17 January and showed the water over Chókwè. We run the same comparison with A.R.K.O\'s own rules, to see if we find the same thing.' : 'Mais de 300 mil desalojados na província de Gaza. A NASA comparou imagens do NISAR de 5 e 17 de janeiro e mostrou a água sobre Chókwè. Rodamos a mesma comparação com as regras do próprio A.R.K.O, para ver se achamos a mesma coisa.'}</p>
          </div>
          {btn('mocambique', ['Ver Moçambique no mapa', 'See Mozambique on the map'])}
        </div>
        {mozPass.length >= 2 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {mozPass.slice(1).map(p => {
              const a = agua(p), nf = p.focos.filter(f => f.tipo === 'agua').length
              return (
                <div key={p.data} className="rounded-xl p-3" style={{ background: a > 5 ? '#EFF8FF' : '#F7FAFC', border: `1px solid ${a > 5 ? '#B2DDFF' : '#E3E8EF'}` }}>
                  <div className="text-[12px]" style={{ color: '#5B6B7F' }}>{p.comparado_com} → {p.data}</div>
                  <div className="text-[20px] font-extrabold" style={{ color: '#1D4ED8' }}>{fmt(a)} km²</div>
                  <div className="text-[12.5px]" style={{ color: '#3C4B5E' }}>{en ? `new water in ${nf} spots` : `de água nova em ${nf} focos`}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl p-3 text-[13px]" style={{ background: '#FFFAEB', border: '1px solid #FEDF89', color: '#7A2E0E' }}>
            {moz === null ? (en ? 'Loading…' : 'Carregando…') : (en ? 'Waiting for the robot to process the NISAR BETA passes (24 Dec, 5 Jan and 17 Jan). The result appears here on its own.' : 'Aguardando o robô processar as passagens BETA do NISAR (24 dez, 5 jan e 17 jan). O resultado aparece aqui sozinho.')}
          </div>
        )}
        <p className="m-0 mt-2 text-[12.5px]" style={{ color: '#5B6B7F' }}>{en ? 'BETA data: released before the final calibration. Good to see where the water is; areas in km² may change in the calibrated version.' : 'Dados BETA: liberados antes da calibração final. Servem para ver onde está a água; as áreas em km² podem mudar na versão calibrada.'}</p>
      </div>

      {/* 4 · limiares */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>{en ? 'What we changed because of this test' : 'O que mudamos por causa deste teste'}</h2>
        <p className="m-0 mb-3 text-[13.5px]" style={{ color: '#3C4B5E' }}>{en ? 'The "high landslide risk" alert used to fire at 10%. In Nepal that meant an alert on 7–19% of the days of the year: too many alarms, and people stop paying attention. Now it fires at 25%.' : 'O alerta de "risco alto de deslizamento" disparava em 10%. No Nepal, isso dava alerta em 7% a 19% dos dias do ano: alarme demais, e as pessoas deixam de prestar atenção. Agora ele dispara em 25%.'}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {LIMIARES.map(l => (
            <div key={l.lim} className="rounded-xl p-3" style={{ background: l.atual ? '#ECFDF3' : '#F7FAFC', border: `1px solid ${l.atual ? '#A6F4C5' : '#E3E8EF'}` }}>
              <b className="text-[15px]">{en ? 'Limit' : 'Limite'} {l.lim}{l.atual && <span className="ml-2 rounded px-1.5 py-0.5 text-[11px]" style={{ background: '#05603A', color: '#fff' }}>{en ? 'NOW' : 'AGORA'}</span>}</b>
              <div className="mt-1 text-[13px]" style={{ color: '#3C4B5E' }}>{en ? `Alert on ${l.dias} of days` : `Alerta em ${l.dias} dos dias`}</div>
              <div className="text-[13px]" style={{ color: '#3C4B5E' }}>{en ? 'Disasters caught: ' : 'Desastres pegos: '}{B(l.pega)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 · limites honestos e fontes */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{en ? 'What this test does NOT prove' : 'O que este teste NÃO prova'}</h2>
        <ul className="m-0 list-disc pl-5 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>
          <li>{en ? 'Few cases (6 places in Brazil and Nepal tested with LHASA, plus Mozambique with radar): it is a first check, not a final statistic.' : 'Poucos casos (6 locais no Brasil e no Nepal testados com o LHASA, mais Moçambique com o radar): é uma primeira conferência, não uma estatística final.'}</li>
          <li>{en ? 'LHASA is a landslide model; we use it as a sign of extreme rain for floods too. The ideal for floods is to add river level and rain forecasts.' : 'O LHASA é um modelo de deslizamento; usamos também como sinal de chuva extrema para enchentes. O ideal para enchente é somar nível dos rios e previsão de chuva.'}</li>
          <li>{en ? 'Disaster locations come from the news and are the district or town seat, not the exact point.' : 'O local de cada desastre vem da imprensa e é a sede do distrito ou da cidade, não o ponto exato.'}</li>
          <li>{en ? 'A.R.K.O supports the decision; official alerts remain with civil defense.' : 'O A.R.K.O apoia a decisão; o alerta oficial continua sendo da Defesa Civil.'}</li>
        </ul>
        <h3 className="mb-1.5 mt-4 text-[14px]">{en ? 'Sources' : 'Fontes'}</h3>
        <ul className="m-0 list-none p-0 text-[12.5px] leading-relaxed">
          {FONTES.map(f => <li key={f.url}><a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{f.t}</a></li>)}
        </ul>
      </div>
    </section>
  )
}
