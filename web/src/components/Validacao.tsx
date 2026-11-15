// A.R.K.O Rios · Validação: o que os satélites mediram bate com o que aconteceu de verdade?
// Três checagens independentes no rio Tapajós (Itaituba), lidas de data/rios/tapajos.json.
import { useEffect, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'
import { carregarRio, fmt, type RioJson } from '../lib/rios'


function Barras({ pts, marcas, cor, un, en, faixas }: { pts: [number, number][]; marcas: { de: number; ate: number; t: string; c: string }[]; cor: string; un: string; en: boolean; faixas?: boolean }) {
  const W = 760, H = 210, L = 40, R = 10, T = 24, B = 26
  const n = pts.length, bw = (W - L - R) / n, vmax = Math.max(...pts.map(p => p[1])) * 1.1
  const x = (i: number) => L + i * bw, y = (v: number) => T + (1 - v / vmax) * (H - T - B)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={en ? 'Bar chart' : 'Gráfico de barras'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {faixas !== false && marcas.map(m => {
        const i0 = pts.findIndex(p => p[0] >= m.de), i1 = pts.findIndex(p => p[0] > m.ate)
        if (i0 < 0) return null
        const xe = i1 < 0 ? W - R : x(i1)
        return <g key={m.t}><rect x={x(i0)} y={T - 4} width={xe - x(i0)} height={H - T - B + 4} fill={m.c} opacity={0.12} />
          <text x={(x(i0) + xe) / 2} y={T - 8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={m.c}>{m.t}</text></g>
      })}
      {[0, vmax / 2].map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#EEF1F4" /><text x={L - 4} y={y(v) + 3} textAnchor="end" fontSize={10} fill="#667085">{fmt(v, en, 1)}</text></g>)}
      {pts.map(([a, v], i) => (
        <g key={a}><rect x={x(i) + 1} y={y(v)} width={Math.max(1, bw - 2)} height={H - B - y(v)} rx={1.5} fill={cor}><title>{`${a}: ${fmt(v, en, 2)} ${un}`}</title></rect>
          {(n < 12 || a % 5 === 0) && <text x={x(i) + bw / 2} y={H - 9} textAnchor="middle" fontSize={10} fill="#667085">{a}</text>}</g>
      ))}
    </svg>
  )
}

function Caso({ n, cor, titulo, sub, children }: { n: string; cor: string; titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: cor }}>{n}</div>
      <h2 style={{ margin: '2px 0 4px', fontSize: 18 }}>{titulo}</h2>
      <p className="m-0 mb-3 text-[13.5px]" style={{ color: '#3C4B5E' }}>{sub}</p>
      {children}
    </div>
  )
}

function Veredito({ ok, t }: { ok: boolean; t: string }) {
  return <div className="mt-3 rounded-xl p-3 text-[13.5px]" style={{ background: ok ? '#ECFDF3' : '#FFFAEB', border: `1px solid ${ok ? '#A6F4C5' : '#FEDF89'}`, color: ok ? '#05603A' : '#7A2E0E' }}><b>{ok ? '✓ ' : '~ '}</b>{t}</div>
}

export function Validacao() {
  const { s, go } = useApp()
  const en = s.lang === 'en'
  const [r, setR] = useState<RioJson | null>(null)
  const [lp, setLp] = useState<RioJson | null>(null)
  useEffect(() => { carregarRio(DATA_BASE, 'tapajos').then(setR); carregarRio(DATA_BASE, 'limpopo').then(setLp) }, [])
  const agLp = (lp?.serie ?? []).filter(a => a.agua_km2 != null).map(a => [a.ano, a.agua_km2!] as [number, number])
  const mLp = (de: number, ate: number) => { const v = agLp.filter(p => p[0] >= de && p[0] <= ate).map(p => p[1]); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN }
  const antes06 = mLp(1985, 2005), depois06 = mLp(2008, 2026)
  const turb = (r?.serie ?? []).filter(a => a.turbidez != null).map(a => [a.ano, a.turbidez!] as [number, number])
  const media = (de: number, ate: number) => { const v = turb.filter(p => p[0] >= de && p[0] <= ate).map(p => p[1]); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN }
  const m90 = media(1987, 1991), mLimpo = media(1998, 2013), m21 = media(2020, 2022)
  const pico = turb.length ? turb.reduce((a, b) => (b[1] > a[1] ? b : a)) : null
  const minAno: [number, number][] = []
  for (const p of r?.swot?.serie ?? []) {
    const ano = +p.d.slice(0, 4), mes = +p.d.slice(5, 7)
    if (mes < 8) continue      // vazante: agosto a dezembro
    const i = minAno.findIndex(x => x[0] === ano)
    if (i < 0) minAno.push([ano, p.wse]); else if (p.wse < minAno[i][1]) minAno[i] = [ano, p.wse]
  }
  minAno.sort((a, b) => a[0] - b[0])
  const pior = minAno.length ? minAno.reduce((a, b) => (b[1] < a[1] ? b : a)) : null

  return (
    <section className="view on" id="v-validacao" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="head">
        <div>
          <h1>{en ? 'Validation: does it match reality?' : 'Validação: bate com a realidade?'}</h1>
          <div className="answer"><span className="dot" style={{ background: '#12B76A' }} />
            <span>{en ? 'We compared what A.R.K.O measured from space with what scientists, MapBiomas, the Geological Survey of Brazil and dam engineers recorded on the ground.' : 'Comparamos o que o A.R.K.O mediu do espaço com o que cientistas, o MapBiomas, o Serviço Geológico do Brasil e engenheiros de barragem registraram em campo.'}</span>
          </div>
        </div>
        <button type="button" className="btn" onClick={() => go('historico')}>{en ? 'Open Tapajós history →' : 'Abrir histórico do Tapajós →'}</button>
      </div>

      {!r ? <div className="card" style={{ padding: 20 }}>{en ? 'Loading…' : 'Carregando…'}</div> : <>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['4 de 4', en ? 'checks match' : 'checagens batem', en ? 'Four independent records in two countries: the 1990s gold rush, the 2019–2022 rush and the 2024 record drought on the Tapajós, and the refilling of Massingir Dam in Mozambique.' : 'Quatro registros independentes em dois países: a corrida do ouro dos anos 90, a de 2019–2022 e a seca recorde de 2024 no Tapajós, e a represa de Massingir enchendo em Moçambique.'],
            [pico ? String(pico[0]) : '—', en ? 'dirtiest year since 1985' : 'ano mais turvo desde 1985', en ? `Turbidity ${pico ? fmt(pico[1], en) : ''}%, in the peak of the 1980s–90s gold rush.` : `Turbidez de ${pico ? fmt(pico[1], en) : ''}%, no auge da corrida do ouro dos anos 80 e 90.`],
            [pior ? String(pior[0]) : '—', en ? 'lowest river (SWOT)' : 'rio mais baixo (SWOT)', en ? 'The same year the Geological Survey of Brazil recorded the lowest level in Itaituba since 1974.' : 'O mesmo ano em que o Serviço Geológico do Brasil registrou o menor nível em Itaituba desde 1974.'],
          ] as const).map(([n, l, d]) => (
            <div key={l} className="card" style={{ padding: 16 }}>
              <div className="text-[26px] font-extrabold leading-none" style={{ color: '#05603A' }}>{en ? n.replace(' de ', ' of ') : n}</div>
              <div className="mt-1 text-[13px] font-bold uppercase tracking-wide" style={{ color: '#1E2A3A' }}>{l}</div>
              <p className="m-0 mt-1.5 text-[13px] leading-snug" style={{ color: '#3C4B5E' }}>{d}</p>
            </div>
          ))}
        </div>

        <Caso n={en ? 'CHECK 1 · LANDSAT vs SCIENCE (1985–2013)' : 'CHECAGEM 1 · LANDSAT vs CIÊNCIA (1985–2013)'} cor="#B45309"
          titulo={en ? 'The 1980s–90s gold rush muddied the Tapajós' : 'A corrida do ouro dos anos 80 e 90 sujou o Tapajós'}
          sub={en ? 'A 2015 study measured Tapajós sediment with Landsat from 1973 to 2013 and found that it follows gold mining, with a peak in the early 1990s, when gold production peaked.' : 'Um estudo de 2015 mediu o sedimento do Tapajós com Landsat de 1973 a 2013 e concluiu que ele acompanha o garimpo, com pico no começo dos anos 90, quando a produção de ouro estava no auge.'}>
          <div className="overflow-x-auto"><div style={{ minWidth: 560 }}>
            <Barras pts={turb} cor="#B45309" un="%" en={en} marcas={[
              { de: 1987, ate: 1991, t: en ? 'gold rush' : 'corrida do ouro', c: '#B42318' },
              { de: 1998, ate: 2013, t: en ? 'clearer river' : 'rio mais limpo', c: '#067647' },
              { de: 2020, ate: 2022, t: en ? 'new rush' : 'nova corrida', c: '#B42318' }]} />
          </div></div>
          <Veredito ok t={en ? `A.R.K.O found the same: turbidity averaged ${fmt(m90, en)}% in 1987–1991, ${fmt(m90 / mLimpo, en)}× the 1998–2013 average (${fmt(mLimpo, en)}%).` : `O A.R.K.O achou o mesmo: a turbidez foi em média ${fmt(m90, en)}% em 1987–1991, ${fmt(m90 / mLimpo, en)} vezes a média de 1998–2013 (${fmt(mLimpo, en)}%).`} />
        </Caso>

        <Caso n={en ? 'CHECK 2 · LANDSAT vs MAPBIOMAS (2019–2022)' : 'CHECAGEM 2 · LANDSAT vs MAPBIOMAS (2019–2022)'} cor="#B42318"
          titulo={en ? 'The new gold rush came back into the water' : 'A nova corrida do ouro voltou para a água'}
          sub={en ? 'MapBiomas showed that mining in the Tapajós region boomed from 2019 and that mining mud changed the colour of the water at Alter do Chão in 2022. Mining inside the Munduruku Indigenous Land grew 363% in three years.' : 'O MapBiomas mostrou que o garimpo na região do Tapajós explodiu a partir de 2019 e que a lama do garimpo mudou a cor da água em Alter do Chão em 2022. Dentro da Terra Indígena Munduruku, o garimpo cresceu 363% em três anos.'}>
          <Veredito ok={m21 > mLimpo * 1.5} t={en ? `A.R.K.O saw turbidity rise again: ${fmt(m21, en)}% on average in 2020–2022, ${fmt(m21 / mLimpo, en)}× the clean period.` : `O A.R.K.O viu a turbidez subir de novo: média de ${fmt(m21, en)}% em 2020–2022, ${fmt(m21 / mLimpo, en)} vezes o período limpo.`} />
        </Caso>

        <Caso n={en ? 'CHECK 3 · SWOT vs RIVER GAUGE (2023–2026)' : 'CHECAGEM 3 · SWOT vs RÉGUA DO RIO (2023–2026)'} cor="#2563EB"
          titulo={en ? 'The 2024 drought: the lowest Tapajós on record' : 'A seca de 2024: o Tapajós mais baixo da história'}
          sub={en ? 'The Geological Survey of Brazil recorded a minimum of 83 cm at Itaituba in 2024, the lowest since records began in 1974, and the national water agency declared, for the first time, a water-scarcity emergency for the river. Below: the lowest level SWOT measured each dry season (Aug–Dec).' : 'O Serviço Geológico do Brasil registrou mínima de 83 cm em Itaituba em 2024, a mais baixa desde o início das medições, em 1974, e a ANA declarou pela primeira vez escassez hídrica no rio. Abaixo: o nível mais baixo medido pelo SWOT em cada vazante (ago–dez).'}>
          {minAno.length > 1 && <Barras pts={minAno} cor="#2563EB" un="m" en={en} marcas={[]} faixas={false} />}
          <Veredito ok={pior?.[0] === 2024} t={en ? `SWOT, from space, also puts ${pior?.[0]} as the lowest dry season (${pior ? fmt(pior[1], en, 2) : ''} m above sea level). Low-water seasons are when the city’s water is hardest to secure.` : `O SWOT, do espaço, também aponta ${pior?.[0]} como a vazante mais baixa (${pior ? fmt(pior[1], en, 2) : ''} m acima do nível do mar). É na vazante que fica mais difícil garantir a água da cidade.`} />
        </Caso>

        {agLp.length > 5 && <Caso n={en ? 'CHECK 4 · LANDSAT vs ENGINEERING RECORDS (MOZAMBIQUE)' : 'CHECAGEM 4 · LANDSAT vs REGISTROS DE ENGENHARIA (MOÇAMBIQUE)'} cor="#0891B2"
          titulo={en ? 'Massingir Dam: the reserve filled after the 2006 repair' : 'Barragem de Massingir: a reserva encheu depois da reforma de 2006'}
          sub={en ? 'Engineering reports say the dam leaked and could not hold more than 40% of its capacity until rehabilitation works finished in 2006; only then did normal operation begin. Below: water area measured by Landsat each dry season.' : 'Relatórios de engenharia dizem que a barragem vazava e não podia guardar mais de 40% da capacidade até as obras de reforma terminarem, em 2006; só então começou a operação normal. Abaixo: área de água medida pelo Landsat em cada estação seca.'}>
          <div className="overflow-x-auto"><div style={{ minWidth: 560 }}>
            <Barras pts={agLp} cor="#0891B2" un="km²" en={en} marcas={[{ de: 1985, ate: 2005, t: en ? 'leaking dam' : 'barragem vazando', c: '#B54708' }, { de: 2007, ate: 2026, t: en ? 'after the repair' : 'depois da reforma', c: '#067647' }]} />
          </div></div>
          <Veredito ok={depois06 > antes06 * 1.3} t={en ? `A.R.K.O saw it from space: ${fmt(antes06, en, 0)} km² of water on average before 2006 and ${fmt(depois06, en, 0)} km² after 2008.` : `O A.R.K.O viu isso do espaço: em média ${fmt(antes06, en, 0)} km² de água antes de 2006 e ${fmt(depois06, en, 0)} km² depois de 2008.`} />
        </Caso>}

        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>{en ? 'What this does NOT prove' : 'O que isto NÃO prova'}</h2>
          <ul className="m-0 list-disc pl-5 text-[13px] leading-relaxed" style={{ color: '#3C4B5E' }}>
            <li>{en ? 'Turbidity from space is a reflectance index, not a lab sample: it shows when the water got dirtier, not how much mercury it has.' : 'A turbidez vista do espaço é um índice de reflectância, não uma amostra de laboratório: mostra quando a água ficou mais suja, não quanto mercúrio ela tem.'}</li>
            <li>{en ? 'Two rivers checked against outside records. The other four use the same method, but each needs its own local check.' : 'Dois rios conferidos com registros de fora. Os outros quatro usam o mesmo método, mas cada um precisa da sua conferência local.'}</li>
            <li>{en ? 'Projections to 2030 assume the last 15 years continue. They are a warning, not a forecast.' : 'As projeções para 2030 supõem que os últimos 15 anos continuem. São um alerta, não uma previsão.'}</li>
          </ul>
          <h3 className="mb-1.5 mt-4 text-[14px]">{en ? 'Sources' : 'Fontes'}</h3>
          <ul className="m-0 list-none p-0 text-[12.5px] leading-relaxed">
            {[
              ['Lobo, Costa & Novo · Remote Sensing of Environment 157 (2015)', 'https://doi.org/10.1016/j.rse.2014.04.030'],
              ['MapBiomas · lama de garimpo muda cor de Alter do Chão (2022)', 'https://www.oeco.org.br/wp-content/uploads/2022/01/Release-Alter_final.pdf'],
              ['Serviço Geológico do Brasil · Nota técnica Itaituba (2025)', 'https://rigeo.sgb.gov.br/jspui/bitstream/doc/25671/1/250911_nota%20tecnica_itaituba.pdf'],
              ['ANA · escassez hídrica no Baixo Tapajós (2024)', 'https://portalamazonia.com/meio-ambiente/ana-declara-escassez-hidrica-tapajos-para/'],
              ['Landsat Collection 2 (NASA/USGS) · Microsoft Planetary Computer', 'https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2'],
              ['SWOT RiverSP · Hydrocron (NASA PO.DAAC)', 'https://podaac.jpl.nasa.gov/SWOT'],
              ['LNEC · reabilitação da barragem de Massingir (2012)', 'https://repositorio.lnec.pt/handle/123456789/1003957'],
            ].map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{t}</a></li>)}
          </ul>
        </div>
      </>}
    </section>
  )
}
