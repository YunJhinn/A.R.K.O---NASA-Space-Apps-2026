// v7.3 · NISAR: o chão afundando sobre o aquífero (BETA).
// Uso excepcional do radar: nenhuma câmera vê água subterrânea, mas o NISAR mede milímetros de movimento do chão.
// Quando o aquífero é esvaziado, a argila se compacta e o chão desce; a soma de pares de 12 dias vira um mapa.
import { useEffect, useRef, useState } from 'react'
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
/** aquífero do app → alvo do NISAR processado pelo robô */
const ALVO: Record<string, { id: string; onde: [string, string] }> = {
  mexico: { id: 'mexico', onde: ['Cidade do México', 'Mexico City'] },
  india_nw: { id: 'delhi', onde: ['Nova Délhi e Haryana', 'New Delhi and Haryana'] },
}
const dataBR = (iso: string, en: boolean) => new Date(iso + 'T12:00:00').toLocaleDateString(en ? 'en-GB' : 'pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function cor(v: number, lim: number): [number, number, number] {
  // desceu (negativo) → roxo/vermelho escuro; subiu → azul; perto de zero → quase branco
  const x = Math.max(-1, Math.min(1, v / lim)), a = Math.abs(x)
  const alvo = x < 0 ? [122, 20, 80] : [3, 105, 161]
  return alvo.map(c => Math.round(250 + (c - 250) * Math.pow(a, 0.8))) as [number, number, number]
}

export function AquiferoAfundamento({ aq, en }: { aq: string; en: boolean }) {
  const alvo = ALVO[aq]
  const [d, setD] = useState<Afund | null | 'nada'>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    setD(null)
    if (!alvo) { setD('nada'); return }
    fetch(DATA_BASE + `aquiferos/afundamento_${alvo.id}.json`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : 'nada')).then(setD).catch(() => setD('nada'))
  }, [aq])   // eslint-disable-line
  const ok = d && d !== 'nada' ? d : null
  const lim = ok ? Math.max(5, Math.ceil(Math.abs(ok.max_cm) / 5) * 5) : 10

  useEffect(() => {
    if (!ok || !cv.current) return
    const ny = ok.lats.length, nx = ok.lons.length, c = cv.current, ctx = c.getContext('2d')!
    c.width = nx; c.height = ny
    const img = ctx.createImageData(nx, ny)
    ok.cm.forEach((row, j) => row.forEach((v, i) => {
      const k = (j * nx + i) * 4
      if (v == null) { img.data.set([229, 231, 235, 255], k); return }
      const [r, g, b] = cor(v, lim); img.data.set([r, g, b, 255], k)
    }))
    ctx.putImageData(img, 0, 0)
  }, [ok, lim])

  const cabeca = (
    <h3 className="m-0 flex items-center text-[14.5px]">
      {en ? 'Vertical ground motion · NISAR InSAR (BETA)' : 'Movimento vertical do solo · NISAR InSAR (BETA)'}
      <Ajuda txt={en ? 'Pumping beyond recharge compacts the aquifer clay and the ground sinks permanently. NISAR (NASA–ISRO, L-band) GUNW pairs 12 days apart are chained and summed; ~500 m cells, relative to a stable rock point (▲). Line of sight converted to approx. vertical (÷ cos 37°). Grey = no reliable measurement.' : 'Bombear além da recarga compacta a argila do aquífero e o solo afunda de forma permanente. Pares GUNW do NISAR (NASA–ISRO, banda L) de 12 dias, encadeados e somados; células de ~500 m, relativas a um ponto de rocha estável (▲). Linha de visada convertida para vertical aprox. (÷ cos 37°). Cinza = sem medida confiável.'} />
    </h3>
  )

  if (!alvo) return (
    <div className="card flex flex-wrap items-center justify-between gap-2" style={{ padding: '12px 18px' }}>
      {cabeca}
      <span className="text-[12.5px]" style={{ color: '#667085' }}>{en ? 'Not processed for this aquifer · available: Valley of Mexico, NW India' : 'Não processado para este aquífero · disponível: Vale do México, NO da Índia'}</span>
    </div>
  )
  if (!ok) return (
    <div className="card flex flex-wrap items-center justify-between gap-2" style={{ padding: '12px 18px' }}>
      {cabeca}
      <span className="text-[12.5px]" style={{ color: '#667085' }}>{d === null ? (en ? 'Loading…' : 'Carregando…') : (en ? 'Waiting for the first robot run' : 'Aguardando a primeira rodada do robô')}</span>
    </div>
  )

  // posição de lon/lat em % da imagem
  const [x0, y0, x1, y1] = ok.caixa
  const P = (lon: number, lat: number) => ({ left: `${((lon - x0) / (x1 - x0)) * 100}%`, top: `${((y1 - lat) / (y1 - y0)) * 100}%` })
  const taxa = ok.taxa_max_cm_ano, lit = ok.literatura.max_cm_ano
  const bate = Math.abs(taxa) >= lit * 0.4 && Math.abs(taxa) <= lit * 1.6
  const aspecto = ((x1 - x0) * Math.cos((((y0 + y1) / 2) * Math.PI) / 180)) / (y1 - y0)

  return (
    <div className="card" style={{ padding: 20 }}>
      {cabeca}
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-lg" style={{ aspectRatio: String(aspecto), border: '1px solid #D0D5DD' }}>
            <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} aria-label={en ? 'Map of ground sinking measured by NISAR' : 'Mapa do chão afundando medido pelo NISAR'} />
            {Object.entries(ok.cidades).map(([n, [lo, la]]) => {
              const dir = (lo - x0) / (x1 - x0) > 0.7     // perto da borda direita: nome à esquerda do ponto
              return <span key={n} className="absolute whitespace-nowrap text-[11.5px] font-bold" style={{ ...P(lo, la), transform: `translate(${dir ? '-100%' : '0'},-50%)`, color: '#101828', textShadow: '0 0 3px #fff,0 0 3px #fff,0 0 3px #fff' }}>{dir ? `${n} ●` : `● ${n}`}</span>
            })}
            <span className="absolute -translate-x-1/2 -translate-y-1/2 text-[13px]" style={P(...ok.estavel)} title={en ? 'Stable reference (rock)' : 'Referência estável (rocha)'}>▲</span>
          </div>
          <div className="mx-auto mt-2 flex max-w-[560px] items-center gap-2 text-[11.5px]" style={{ color: '#475467' }}>
            <span>{en ? 'sank' : 'afundou'} −{lim} cm</span>
            <div className="h-2.5 flex-1 rounded" style={{ background: `linear-gradient(90deg, rgb(${cor(-lim, lim)}), rgb(${cor(0, lim)}), rgb(${cor(lim, lim)}))` }} />
            <span>+{lim} cm {en ? 'rose' : 'subiu'}</span>
          </div>
          <p className="mx-auto mt-1 max-w-[560px] text-[11.5px]" style={{ color: '#667085' }}>▲ {en ? 'stable reference' : 'referência estável'} · {en ? 'grey = no measurement' : 'cinza = sem medida'}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#FDF2F8', border: '1px solid #FCCEEE' }}>
          <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#7A1450' }}>{en ? ok.nome_en : ok.nome}</div>
          <div className="mt-1 text-[12.5px]" style={{ color: '#475467' }}>{dataBR(ok.inicio, en)} → {dataBR(ok.fim, en)} · {ok.dias} {en ? 'days' : 'dias'} · {ok.pares.length} {en ? 'radar pairs' : 'pares do radar'}</div>
          <div className="mt-3 text-[30px] font-extrabold leading-none" style={{ color: '#7A1450' }}>{fmt(ok.max_cm, en, 1)} cm</div>
          <div className="text-[12.5px]" style={{ color: '#475467' }}>{en ? 'p01 (fastest-sinking cells)' : 'p01 (células que mais afundaram)'}</div>
          <div className="mt-3 text-[13px] leading-relaxed" style={{ color: '#1E2A3A' }}>
            <div>{en ? 'Pace: ' : 'Ritmo: '}<b>{fmt(Math.abs(taxa), en, 1)} cm/{en ? 'year' : 'ano'}</b></div>
            <div>{en ? 'Area ≤ −5 cm: ' : 'Área ≤ −5 cm: '}<b>{fmt(ok.area_5cm_km2, en, 0)} km²</b></div>
          </div>
          <div className="mt-3 rounded-lg p-2.5 text-[12.5px] leading-snug" style={{ background: bate ? '#ECFDF3' : '#FFFAEB', border: `1px solid ${bate ? '#ABEFC6' : '#FEDF89'}` }}>
            <b>{bate ? (en ? '✓ Matches published studies' : '✓ Bate com estudos publicados') : (en ? '! Differs from published studies' : '! Diferente dos estudos publicados')}</b><br />
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
