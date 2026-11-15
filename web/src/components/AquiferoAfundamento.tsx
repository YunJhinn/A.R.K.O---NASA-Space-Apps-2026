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
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#7A1450' }}>{en ? 'NISAR · the ground sinking (BETA)' : 'NISAR · o chão afundando (BETA)'}</div>
      <h3 className="m-0 mt-1 flex items-center text-[16px]">
        {en ? 'An image with no camera: the radar sees the aquifer through the ground' : 'Uma imagem sem câmera: o radar vê o aquífero pelo chão'}
        <Ajuda txt={en ? 'When more water is pumped than rain refills, the clay layers of the aquifer compact and the ground sinks, permanently: that storage space is lost. The NISAR radar (NASA–ISRO, L-band) compares two passes 12 days apart and measures how much the distance to the ground changed, down to millimetres (interferometry). Adding up a chain of passes gives the sinking over months. Each pixel here is ~500 m, rebuilt only from the radar phase.' : 'Quando se bombeia mais água do que a chuva repõe, as camadas de argila do aquífero se compactam e o chão afunda, para sempre: aquele espaço de guardar água se perde. O radar NISAR (NASA–ISRO, banda L) compara duas passagens com 12 dias de diferença e mede quanto a distância até o chão mudou, em milímetros (interferometria). Somando uma corrente de passagens, temos o afundamento em meses. Cada pixel aqui tem ~500 m, reconstruído só com a fase do radar.'} />
      </h3>
    </div>
  )

  if (!alvo) return (
    <div className="card" style={{ padding: 18 }}>
      {cabeca}
      <p className="m-0 mt-2 text-[13px] leading-relaxed" style={{ color: '#475467' }}>
        {en ? 'For this aquifer the ground-sinking map is not processed yet. The robot already does it for Mexico City and New Delhi (open "Valley of Mexico" or "Northwest India"); new areas only need a new box in the robot.'
          : 'Para este aquífero o mapa do chão afundando ainda não é processado. O robô já faz isso para a Cidade do México e Nova Délhi (abra "Vale do México" ou "noroeste da Índia"); áreas novas só precisam de uma nova caixa no robô.'}
      </p>
    </div>
  )
  if (!ok) return (
    <div className="card" style={{ padding: 18 }}>
      {cabeca}
      <p className="m-0 mt-2 text-[13px] leading-relaxed" style={{ color: '#475467' }}>
        {d === null ? (en ? 'Loading…' : 'Carregando…')
          : en ? `The NISAR box over ${alvo.onde[1]} is already in the robot; the first map appears here after its next run (it adds up all 12-day pairs since 2026).`
            : `A caixa do NISAR sobre ${alvo.onde[0]} já está no robô; o primeiro mapa aparece aqui depois da próxima rodada dele (ele soma todos os pares de 12 dias desde 2026).`}
      </p>
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
          <p className="mx-auto mt-1 max-w-[560px] text-[11.5px]" style={{ color: '#667085' }}>▲ {en ? 'stable reference point (rock): every value is relative to it. Grey: radar could not measure (water, fields that changed too much).' : 'ponto de referência estável (rocha): todos os valores são relativos a ele. Cinza: o radar não conseguiu medir (água, plantação que mudou demais).'}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#FDF2F8', border: '1px solid #FCCEEE' }}>
          <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#7A1450' }}>{en ? ok.nome_en : ok.nome}</div>
          <div className="mt-1 text-[12.5px]" style={{ color: '#475467' }}>{dataBR(ok.inicio, en)} → {dataBR(ok.fim, en)} · {ok.dias} {en ? 'days' : 'dias'} · {ok.pares.length} {en ? 'radar pairs' : 'pares do radar'}</div>
          <div className="mt-3 text-[30px] font-extrabold leading-none" style={{ color: '#7A1450' }}>{fmt(ok.max_cm, en, 1)} cm</div>
          <div className="text-[12.5px]" style={{ color: '#475467' }}>{en ? `fastest-sinking spots in ${ok.dias} days` : `nos pontos que mais afundaram em ${ok.dias} dias`}</div>
          <div className="mt-3 text-[13px] leading-relaxed" style={{ color: '#1E2A3A' }}>
            <div>{en ? 'Pace: ' : 'Ritmo: '}<b>{fmt(Math.abs(taxa), en, 1)} cm/{en ? 'year' : 'ano'}</b></div>
            <div>{en ? 'Area sinking 5 cm or more: ' : 'Área que afundou 5 cm ou mais: '}<b>{fmt(ok.area_5cm_km2, en, 0)} km²</b></div>
          </div>
          <div className="mt-3 rounded-lg p-2.5 text-[12.5px] leading-snug" style={{ background: bate ? '#ECFDF3' : '#FFFAEB', border: `1px solid ${bate ? '#ABEFC6' : '#FEDF89'}` }}>
            <b>{bate ? (en ? '✓ Matches published studies' : '✓ Bate com estudos publicados') : (en ? '! Differs from published studies' : '! Diferente dos estudos publicados')}</b><br />
            {en ? 'Literature: ' : 'Literatura: '}{ok.literatura.texto} · <a href={ok.literatura.url} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{ok.literatura.ref}</a>
          </div>
          <p className="m-0 mt-3 text-[12.5px] leading-relaxed" style={{ color: '#3C4B5E' }}>
            <b>{en ? 'What it means: ' : 'O que isso significa: '}</b>
            {en ? 'The aquifer is being emptied faster than it refills. Compacted clay does not swell back: this water storage is lost for good. Sinking also breaks pipes, drains and buildings, and makes floods worse.'
              : 'O aquífero está sendo esvaziado mais rápido do que se recarrega. A argila compactada não volta a inchar: esse espaço de guardar água se perde para sempre. O afundamento também quebra canos, esgoto e prédios e piora as enchentes.'}
          </p>
        </div>
      </div>
      <p className="m-0 mt-3 text-[12px] leading-relaxed" style={{ color: '#5B6B7F' }}>
        {en ? 'How it was measured: ' : 'Como foi medido: '}{ok.fonte}. {en ? 'Values are along the radar line of sight converted to approximate vertical (÷ cos 37°).' : 'Valores na linha de visada do radar convertidos para vertical aproximado (÷ cos 37°).'}{' '}
        {ok.ionosfera_corrigida ? (en ? 'Ionosphere corrected; troposphere not corrected (a few cm of noise).' : 'Ionosfera corrigida; troposfera não corrigida (alguns cm de ruído).') : (en ? 'Ionosphere and troposphere not corrected (a few cm of noise).' : 'Ionosfera e troposfera não corrigidas (alguns cm de ruído).')}{' '}
        {en ? 'Direction of the sign: ' : 'Direção do sinal: '}{en ? ok.sinal_fonte_en ?? ok.sinal_fonte : ok.sinal_fonte}{' '}
        {en ? 'BETA: NISAR provisional products, still in calibration.' : 'BETA: produtos provisórios do NISAR, ainda em calibração.'}
      </p>
    </div>
  )
}
