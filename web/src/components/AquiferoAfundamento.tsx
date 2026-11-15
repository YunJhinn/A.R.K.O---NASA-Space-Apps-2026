// v7.6 · NISAR GUNW: o chão afundando sobre o aquífero (BETA).
// Nenhuma câmera vê água subterrânea, mas o NISAR mede milímetros de movimento do chão. Quando o aquífero é
// esvaziado, a argila se compacta e o chão desce. Somando pares de passagens de 12 dias, temos um mapa sem câmera.
// v7.6: controle de qualidade na tela (cobertura, ponto de referência, valores impossíveis), faixa de ruído ±3 cm
// e um guia "como ler" para quem não é especialista.
import { useEffect, useMemo, useRef, useState } from 'react'
import { DATA_BASE } from '../lib/store'
import { fmt } from '../lib/rios'
import { Ajuda } from './Ajuda'

interface Afund {
  id: string; aquifero: string; nome: string; nome_en: string; caixa: number[]; inicio: string; fim: string; dias: number
  pares: { ref: string; sec: string }[]; colecao: string; lons: number[]; lats: number[]; cm: (number | null)[][]
  max_cm: number; taxa_max_cm_ano: number; area_5cm_km2: number; quente_cm: number
  cidades: Record<string, [number, number]>; estavel: [number, number]; quente: [number, number]
  literatura: { max_cm_ano: number; texto: string; ref: string; url: string }
  sinal_fonte: string; sinal_fonte_en?: string; ionosfera_corrigida: boolean; fonte: string; gerado: string
}
const ALVO: Record<string, { id: string; onde: [string, string] }> = {
  mexico: { id: 'mexico', onde: ['Cidade do México', 'Mexico City'] },
  india_nw: { id: 'delhi', onde: ['Nova Délhi e Haryana', 'New Delhi and Haryana'] },
}
const RUIDO = 3   // cm: abaixo disso não dá para separar movimento de ruído (atmosfera, soma de pares)
const dataBR = (iso: string, en: boolean) => new Date(iso + 'T12:00:00').toLocaleDateString(en ? 'en-GB' : 'pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function cor(v: number, lim: number): [number, number, number] {
  if (v > -RUIDO) {                       // estável ou "subida" pequena: tons neutros, para não sugerir subida real
    const a = Math.min(1, Math.max(0, v) / lim) * 0.35
    return [Math.round(246 - 40 * a), Math.round(247 - 25 * a), Math.round(249 - 5 * a)]
  }
  const a = Math.min(1, (-v - RUIDO) / (lim - RUIDO))
  const ini = [250, 232, 243], fim = [92, 10, 60]
  return ini.map((c, i) => Math.round(c + (fim[i] - c) * Math.pow(a, 0.75))) as [number, number, number]
}

/** controle de qualidade: o mapa só recebe selo "confiável" se cobrir a área e tiver referência estável */
function qualidade(ok: Afund, en: boolean) {
  const ny = ok.lats.length, nx = ok.lons.length
  let n = 0, val = 0, absurdo = 0
  const limite = Math.max(30, 3 * ok.literatura.max_cm_ano * ok.dias / 365)
  ok.cm.forEach(r => r.forEach(v => { n++; if (v != null) { val++; if (Math.abs(v) > limite) absurdo++ } }))
  const at = (lo: number, la: number) => {
    const i = ok.lons.reduce((b, x, k) => (Math.abs(x - lo) < Math.abs(ok.lons[b] - lo) ? k : b), 0)
    const j = ok.lats.reduce((b, y, k) => (Math.abs(y - la) < Math.abs(ok.lats[b] - la) ? k : b), 0)
    let c = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const v = ok.cm[j + a]?.[i + b]; if (v != null) c++ }
    return c >= 5
  }
  const cob = val / n, refOk = at(...ok.estavel), quenteOk = at(...ok.quente)
  const motivos: string[] = []
  if (cob < 0.6) motivos.push(en ? `the radar frame covers only ${Math.round(cob * 100)}% of the area` : `o quadro do radar cobre só ${Math.round(cob * 100)}% da área`)
  if (!refOk) motivos.push(en ? 'the stable reference point (▲) has no data, so values float' : 'o ponto de referência estável (▲) ficou sem dado, então os valores "flutuam"')
  if (!quenteOk) motivos.push(en ? 'the published sinking hotspot has no data' : 'o centro de afundamento já publicado ficou sem dado')
  if (absurdo / Math.max(1, val) > 0.01) motivos.push(en ? `${Math.round((absurdo / val) * 100)}% of cells have impossible values (phase-unwrapping errors)` : `${Math.round((absurdo / val) * 100)}% das células têm valores impossíveis (erro de desdobramento da fase)`)
  void ny; void nx
  return { confiavel: motivos.length === 0, motivos, cob, limite }
}

export function AquiferoAfundamento({ aq, en }: { aq: string; en: boolean }) {
  const alvo = ALVO[aq]
  const [d, setD] = useState<Afund | null | 'nada'>(null)
  const [guia, setGuia] = useState(true)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    setD(null)
    if (!alvo) { setD('nada'); return }
    fetch(DATA_BASE + `aquiferos/afundamento_${alvo.id}.json`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : 'nada')).then(setD).catch(() => setD('nada'))
  }, [aq])   // eslint-disable-line
  const ok = d && d !== 'nada' ? d : null
  const Q = useMemo(() => (ok ? qualidade(ok, en) : null), [ok, en])
  const lim = ok ? Math.max(8, Math.ceil(Math.abs(ok.max_cm) / 5) * 5) : 10

  useEffect(() => {
    if (!ok || !cv.current || !Q) return
    const ny = ok.lats.length, nx = ok.lons.length, c = cv.current, ctx = c.getContext('2d')!
    c.width = nx; c.height = ny
    const img = ctx.createImageData(nx, ny)
    ok.cm.forEach((row, j) => row.forEach((v, i) => {
      const k = (j * nx + i) * 4
      if (v == null || Math.abs(v) > Q.limite) { img.data.set([214, 217, 222, 255], k); return }
      const [r, g, b] = cor(v, lim); img.data.set([r, g, b, 255], k)
    }))
    ctx.putImageData(img, 0, 0)
  }, [ok, lim, Q])

  const cabeca = (
    <h3 className="m-0 flex items-center text-[14.5px]">
      {en ? 'Ground motion · NISAR InSAR (BETA)' : 'Movimento do solo · NISAR InSAR (BETA)'}
      <Ajuda txt={en ? 'GUNW product: NISAR pairs 12 days apart, chained and summed. ~500 m cells, relative to a stable rock point (▲). Line of sight converted to approx. vertical (÷ cos 37°). Ionosphere corrected; troposphere not (a few cm of noise).' : 'Produto GUNW: pares do NISAR com 12 dias de diferença, encadeados e somados. Células de ~500 m, relativas a um ponto de rocha estável (▲). Linha de visada convertida para vertical aprox. (÷ cos 37°). Ionosfera corrigida; troposfera não (alguns cm de ruído).'} />
    </h3>
  )

  if (!alvo) return (
    <div className="card flex flex-wrap items-center justify-between gap-2" style={{ padding: '12px 18px' }}>
      {cabeca}
      <span className="text-[12.5px]" style={{ color: '#667085' }}>{en ? 'Not processed for this aquifer · available: Valley of Mexico, NW India' : 'Não processado para este aquífero · disponível: Vale do México, NO da Índia'}</span>
    </div>
  )
  if (!ok || !Q) return (
    <div className="card flex flex-wrap items-center justify-between gap-2" style={{ padding: '12px 18px' }}>
      {cabeca}
      <span className="text-[12.5px]" style={{ color: '#667085' }}>{d === null ? (en ? 'Loading…' : 'Carregando…') : (en ? 'Waiting for the first robot run' : 'Aguardando a primeira rodada do robô')}</span>
    </div>
  )

  const [x0, y0, x1, y1] = ok.caixa
  const P = (lon: number, lat: number) => ({ left: `${((lon - x0) / (x1 - x0)) * 100}%`, top: `${((y1 - lat) / (y1 - y0)) * 100}%` })
  const taxa = ok.taxa_max_cm_ano, lit = ok.literatura.max_cm_ano
  const bate = Q.confiavel && Math.abs(taxa) >= lit * 0.4 && Math.abs(taxa) <= lit * 1.6
  const aspecto = ((x1 - x0) * Math.cos((((y0 + y1) / 2) * Math.PI) / 180)) / (y1 - y0)
  // lugar do mapa que mais afundou (para a frase de leitura)
  let pior = { n: '', v: 0 }
  Object.entries(ok.cidades).forEach(([n, [lo, la]]) => {
    const i = ok.lons.reduce((b, x, k) => (Math.abs(x - lo) < Math.abs(ok.lons[b] - lo) ? k : b), 0)
    const j = ok.lats.reduce((b, y, k) => (Math.abs(y - la) < Math.abs(ok.lats[b] - la) ? k : b), 0)
    const vs: number[] = []; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const v = ok.cm[j + a]?.[i + b]; if (v != null && Math.abs(v) <= Q.limite) vs.push(v) }
    vs.sort((p, q) => p - q); const m = vs.length ? vs[Math.floor(vs.length / 2)] : 0
    if (m < pior.v) pior = { n, v: m }
  })
  const meses = Math.round(ok.dias / 30.4)

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {cabeca}
        <button type="button" className="text-[12.5px] font-semibold" style={{ color: '#2563EB' }} onClick={() => setGuia(!guia)}>{guia ? (en ? 'Hide reading guide ▴' : 'Esconder guia de leitura ▴') : (en ? 'How to read this map ▾' : 'Como ler este mapa ▾')}</button>
      </div>

      {/* guia de leitura: para quem não é especialista entender o que está vendo */}
      {guia && (
        <div className="mt-3 grid gap-2 rounded-xl p-3 text-[12.5px] leading-snug sm:grid-cols-2 lg:grid-cols-4" style={{ background: '#F8FAFC', border: '1px solid #E4E7EC', color: '#344054' }}>
          <div><b style={{ color: '#101828' }}>1 · {en ? 'What it is' : 'O que é'}</b><br />{en ? `How much the ground went down in ${meses} months, measured by radar (no camera). Each pixel ≈ 500 m.` : `Quanto o chão desceu em ${meses} meses, medido pelo radar (sem câmera). Cada quadradinho ≈ 500 m.`}</div>
          <div><b style={{ color: '#101828' }}>2 · {en ? 'Colors' : 'Cores'}</b><br />{en ? 'Light pink → dark wine = sank more. White/light grey = stable (within ±3 cm of noise). Darker grey = no reliable measurement.' : 'Rosa claro → vinho escuro = afundou mais. Branco/cinza claro = estável (dentro de ±3 cm de ruído). Cinza mais escuro = sem medida confiável.'}</div>
          <div><b style={{ color: '#101828' }}>3 · {en ? 'Why it matters' : 'Por que importa'}</b><br />{en ? 'Sinking = the aquifer is being emptied faster than it refills; the clay compacts and that storage is lost for good.' : 'Afundar = o aquífero está sendo esvaziado mais rápido do que se recarrega; a argila se compacta e esse espaço de guardar água se perde para sempre.'}</div>
          <div><b style={{ color: '#101828' }}>4 · {en ? 'What to do' : 'O que fazer'}</b><br />{en ? 'Dark spots = where to review well permits, measure pumping and protect recharge first. Re-check after the next radar passes.' : 'Manchas escuras = onde revisar licenças de poços, medir o bombeamento e proteger a recarga primeiro. Conferir de novo nas próximas passagens.'}</div>
        </div>
      )}

      {/* leitura automática do mapa, em uma frase */}
      <div className="mt-3 rounded-lg px-3 py-2 text-[13.5px] leading-snug" style={{ background: Q.confiavel ? '#FDF2F8' : '#FFFAEB', border: `1px solid ${Q.confiavel ? '#FCCEEE' : '#FEDF89'}`, color: '#1E2A3A' }}>
        {Q.confiavel
          ? (en ? <>Reading: from <b>{dataBR(ok.inicio, en)}</b> to <b>{dataBR(ok.fim, en)}</b> the ground sank up to <b>{fmt(Math.abs(ok.max_cm), en, 1)} cm</b>{pior.n && <> (strongest near <b>{pior.n}</b>)</>}, a pace of <b>{fmt(Math.abs(taxa), en, 0)} cm/year</b>, over <b>{fmt(ok.area_5cm_km2, en, 0)} km²</b>.</>
            : <>Leitura: de <b>{dataBR(ok.inicio, en)}</b> a <b>{dataBR(ok.fim, en)}</b> o chão desceu até <b>{fmt(Math.abs(ok.max_cm), en, 1)} cm</b>{pior.n && <> (mais forte perto de <b>{pior.n}</b>)</>}, um ritmo de <b>{fmt(Math.abs(taxa), en, 0)} cm/ano</b>, em <b>{fmt(ok.area_5cm_km2, en, 0)} km²</b>.</>)
          : <><b>{en ? '⚠ Inconclusive in this run: do not use these numbers yet.' : '⚠ Inconclusivo nesta rodada: não use estes números ainda.'}</b> {en ? 'Why: ' : 'Motivo: '}{Q.motivos.join('; ')}. {en ? 'Next step: process a radar frame that covers the whole area.' : 'Próximo passo: processar um quadro do radar que cubra a área inteira.'}</>}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-lg" style={{ aspectRatio: String(aspecto), border: '1px solid #D0D5DD', opacity: Q.confiavel ? 1 : 0.55 }}>
            <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} aria-label={en ? 'Map of ground sinking measured by NISAR' : 'Mapa do chão afundando medido pelo NISAR'} />
            {Object.entries(ok.cidades).map(([n, [lo, la]]) => {
              const dir = (lo - x0) / (x1 - x0) > 0.7
              return <span key={n} className="absolute whitespace-nowrap text-[11.5px] font-bold" style={{ ...P(lo, la), transform: `translate(${dir ? '-100%' : '0'},-50%)`, color: '#101828', textShadow: '0 0 3px #fff,0 0 3px #fff,0 0 3px #fff' }}>{dir ? `${n} ●` : `● ${n}`}</span>
            })}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 text-[13px]" style={P(...ok.estavel)} title={en ? 'Stable reference (rock)' : 'Referência estável (rocha)'}>▲</span>
          </div>
          <div className="mx-auto mt-2 flex max-w-[560px] items-center gap-2 text-[11.5px]" style={{ color: '#475467' }}>
            <span className="whitespace-nowrap">{en ? 'sank' : 'afundou'} −{lim} cm</span>
            <div className="h-2.5 flex-1 rounded" style={{ background: `linear-gradient(90deg, rgb(${cor(-lim, lim)}), rgb(${cor(-RUIDO - 0.01, lim)}), rgb(${cor(0, lim)}))` }} />
            <span className="whitespace-nowrap">{en ? 'stable (±3 cm)' : 'estável (±3 cm)'}</span>
          </div>
          <p className="mx-auto mt-1 max-w-[560px] text-[11.5px]" style={{ color: '#667085' }}>▲ {en ? 'stable reference (rock)' : 'referência estável (rocha)'} · <i className="inline-block h-2 w-2 align-middle" style={{ background: 'rgb(214,217,222)' }} /> {en ? 'no reliable measurement' : 'sem medida confiável'}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#FDF2F8', border: '1px solid #FCCEEE' }}>
          <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#7A1450' }}>{en ? ok.nome_en : ok.nome}</div>
          <div className="mt-1 text-[12.5px]" style={{ color: '#475467' }}>{dataBR(ok.inicio, en)} → {dataBR(ok.fim, en)} · {ok.pares.length} {en ? 'radar pairs' : 'pares do radar'}</div>
          <div className="mt-3 text-[30px] font-extrabold leading-none" style={{ color: Q.confiavel ? '#7A1450' : '#98A2B3' }}>{fmt(ok.max_cm, en, 1)} cm</div>
          <div className="flex items-center text-[12.5px]" style={{ color: '#475467' }}>{en ? 'deepest sinking' : 'maior afundamento'}<Ajuda txt={en ? '1st percentile of the map: 99% of the cells sank less than this. Avoids being fooled by a single noisy pixel.' : 'Percentil 1 do mapa: 99% das células afundaram menos que isso. Evita ser enganado por um único quadradinho com ruído.'} /></div>
          <div className="mt-3 text-[13px] leading-relaxed" style={{ color: '#1E2A3A' }}>
            <div>{en ? 'Pace: ' : 'Ritmo: '}<b>{fmt(Math.abs(taxa), en, 1)} cm/{en ? 'year' : 'ano'}</b></div>
            <div>{en ? 'Area sunk ≥ 5 cm: ' : 'Área que afundou ≥ 5 cm: '}<b>{fmt(ok.area_5cm_km2, en, 0)} km²</b></div>
            <div>{en ? 'Area covered by radar: ' : 'Área coberta pelo radar: '}<b>{Math.round(Q.cob * 100)}%</b></div>
          </div>
          <div className="mt-3 rounded-lg p-2.5 text-[12.5px] leading-snug" style={{ background: bate ? '#ECFDF3' : '#FFFAEB', border: `1px solid ${bate ? '#ABEFC6' : '#FEDF89'}` }}>
            <b>{!Q.confiavel ? (en ? '— Not compared (inconclusive)' : '— Não comparado (inconclusivo)') : bate ? (en ? '✓ Matches published studies' : '✓ Bate com estudos publicados') : (en ? '! Differs from published studies' : '! Diferente dos estudos publicados')}</b><br />
            {ok.literatura.texto} · <a href={ok.literatura.url} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{ok.literatura.ref}</a>
          </div>
        </div>
      </div>
      <p className="m-0 mt-3 text-[11.5px]" style={{ color: '#667085' }}>
        {ok.fonte} · {ok.ionosfera_corrigida ? (en ? 'ionosphere corrected' : 'ionosfera corrigida') : (en ? 'no ionosphere correction' : 'sem correção de ionosfera')} · {en ? 'troposphere not corrected' : 'troposfera não corrigida'} · {en ? 'sign: ' : 'sinal: '}{en ? ok.sinal_fonte_en ?? ok.sinal_fonte : ok.sinal_fonte}
      </p>
    </div>
  )
}
