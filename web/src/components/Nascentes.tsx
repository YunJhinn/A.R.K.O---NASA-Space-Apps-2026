// v7.10 · Nascentes: a vegetação nativa num raio de 5 km protege a nascente (a água infiltra, o solo não erode e não
// assoreia o córrego). Mostra o antes e depois com fotos Landsat, a % de vegetação nativa ano a ano em dois mapas
// publicados (ESA CCI 300 m, 1992–2020; Impact Observatory/Esri 10 m, 2017–2023), o ponto de inflexão, o ponto crítico
// (20%, régua A.R.K.O baseada na Reserva Legal do Cerrado) e o ano em que o alerta acenderia no ritmo atual.
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../lib/store'

export interface NascenteJson {
  id: string; nome: string; onde: string; lon: number; lat: number; contexto: string; fonte_local: string
  raio_km: number; critico: number; critico_fonte: string
  nome_en?: string; onde_en?: string; contexto_en?: string; critico_fonte_en?: string; fonte_local_en?: string
  cci: { ano: number; nativo: number }[]; io: { ano: number; nativo: number }[]
  fotos: { ano: number; foto: string; imagens: string[] }[]; fontes: string[]
}
export const NASCENTES = ['araguaia']
export const JANELA_N = 10

/** Theil–Sen (mediana das inclinações) em pontos por ano */
function ritmo(p: { ano: number; nativo: number }[]) {
  const s: number[] = []
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) s.push((p[j].nativo - p[i].nativo) / (p[j].ano - p[i].ano))
  s.sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}

/** Leitura da nascente: valor atual, ritmo recente (mapa 10 m), ano em que chega ao ponto crítico e ano do alerta */
export function lerNascente(n: NascenteJson) {
  const io = n.io, cci = n.cci
  const ult = io[io.length - 1]
  const atual = [...io.slice(-3)].map(v => v.nativo).sort((a, b) => a - b)[1] ?? ult.nativo   // mediana dos 3 últimos anos
  const r = ritmo(io)                    // pontos/ano, 2017–2023
  const rLongo = ritmo(cci)              // pontos/ano, 1992–2020
  // mudança de padrão: num mapa anual de uso do solo a perda aparece como um degrau; pegamos o maior degrau (≥ 3 pontos)
  // e o ritmo depois dele (Theil–Sen), para dizer se a queda continuou, parou ou reverteu
  let I: { ano: number; salto: number; depois: number } | null = null
  for (let i = 1; i < cci.length; i++) { const d = cci[i].nativo - cci[i - 1].nativo; if (Math.abs(d) >= 3 && (!I || Math.abs(d) > Math.abs(I.salto))) I = { ano: cci[i].ano, salto: d, depois: 0 } }
  if (I) I.depois = ritmo(cci.filter(v => v.ano >= I!.ano))
  const perda = cci.length ? cci[cci.length - 1].nativo - cci[0].nativo : 0
  const ruido = 0.15                     // abaixo de 0,15 ponto/ano (1,5/década) tratamos como estável
  const cruza = atual <= n.critico ? ult.ano : r < -ruido ? Math.round(ult.ano + (atual - n.critico) / -r) : null
  const agora = new Date().getFullYear()
  const nivel: 'alerta' | 'atencao' | 'monitorar' | 'ok' = cruza == null ? 'ok' : cruza - agora <= JANELA_N ? 'alerta' : cruza - agora <= 25 ? 'atencao' : 'monitorar'
  return { atual, r, rLongo, I, perda, cruza, disparo: cruza == null ? null : cruza - JANELA_N, nivel, ult }
}

const COR = { alerta: '#B42318', atencao: '#93370D', monitorar: '#A15C07', ok: '#067647' }

function Grafico({ n, en, anoInf }: { n: NascenteJson; en: boolean; anoInf: number | null }) {
  const W = 520, H = 150, P = { l: 30, r: 10, t: 10, b: 20 }
  const a0 = Math.min(n.cci[0]?.ano ?? 2017, n.io[0].ano), a1 = Math.max(n.io[n.io.length - 1].ano, new Date().getFullYear())
  const X = (a: number) => P.l + (a - a0) / (a1 - a0) * (W - P.l - P.r)
  const Y = (v: number) => P.t + (1 - v / 60) * (H - P.t - P.b)
  const linha = (p: { ano: number; nativo: number }[]) => p.map((v, i) => `${i ? 'L' : 'M'}${X(v.ano).toFixed(1)},${Y(v.nativo).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={en ? 'Native vegetation within 5 km, per year' : 'Vegetação nativa em 5 km, por ano'}>
      {[0, 20, 40, 60].map(v => <g key={v}><line x1={P.l} x2={W - P.r} y1={Y(v)} y2={Y(v)} stroke="#F2F4F7" /><text x={P.l - 4} y={Y(v) + 3} fontSize="9" textAnchor="end" fill="#98A2B3">{v}%</text></g>)}
      <rect x={P.l} y={Y(n.critico)} width={W - P.l - P.r} height={Y(0) - Y(n.critico)} fill="#FEF3F2" />
      <line x1={P.l} x2={W - P.r} y1={Y(n.critico)} y2={Y(n.critico)} stroke="#B42318" strokeDasharray="4 3" />
      <text x={W - P.r} y={Y(n.critico) - 3} fontSize="9.5" textAnchor="end" fill="#B42318" fontWeight="700">{en ? 'critical point' : 'ponto crítico'} {n.critico}%</text>
      {anoInf && <><line x1={X(anoInf)} x2={X(anoInf)} y1={P.t} y2={Y(0)} stroke="#7A5AF8" strokeDasharray="2 2" /><text x={X(anoInf) + 3} y={P.t + 8} fontSize="9.5" fill="#7A5AF8" fontWeight="700">{en ? 'inflection' : 'inflexão'} {anoInf}</text></>}
      <path d={linha(n.cci)} fill="none" stroke="#2E7D32" strokeWidth="2" />
      <path d={linha(n.io)} fill="none" stroke="#0B6E99" strokeWidth="2" />
      {n.io.map(v => <circle key={v.ano} cx={X(v.ano)} cy={Y(v.nativo)} r="2.4" fill="#0B6E99" />)}
      {[a0, 2000, 2010, 2020, a1].filter((a, i, s) => s.indexOf(a) === i && a >= a0 && a <= a1).map(a => <text key={a} x={X(a)} y={H - 6} fontSize="9" textAnchor="middle" fill="#98A2B3">{a}</text>)}
    </svg>
  )
}

function Foto({ n, ano, en }: { n: NascenteJson; ano: number; en: boolean }) {
  const f = n.fotos.find(x => x.ano === ano)
  // a foto cobre ±0,05° (≈10,6 km de largura nesta latitude): o círculo de 5 km ocupa ~94% da largura
  const r = 50 * n.raio_km / (0.1 * 111.32 * Math.cos(n.lat * Math.PI / 180))
  return (
    <figure className="m-0" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#EAECF0', borderRadius: 8, overflow: 'hidden' }}>
        {f && <img src={DATA_BASE + 'nascentes/' + f.foto} alt={`${n.nome} ${ano}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="1.5 1" />
          <circle cx="50" cy="50" r="1.4" fill="#2E90FA" stroke="#fff" strokeWidth="0.5" />
        </svg>
        <span style={{ position: 'absolute', left: 8, top: 8, background: 'rgba(11,31,51,.8)', color: '#fff', fontWeight: 800, fontSize: 13, padding: '2px 8px', borderRadius: 6 }}>{ano}</span>
      </div>
      <figcaption className="text-[11px]" style={{ color: '#667085', marginTop: 3 }}>{f ? `Landsat · ${f.imagens[0]}` : (en ? 'no clean image' : 'sem imagem limpa')}</figcaption>
    </figure>
  )
}

export function Nascentes() {
  const { s } = useApp()
  const en = s.lang === 'en'
  const [ns, setNs] = useState<NascenteJson[]>([])
  const [a, setA] = useState<number | null>(null)
  const [b, setB] = useState<number | null>(null)
  useEffect(() => {
    NASCENTES.forEach(i => fetch(DATA_BASE + 'nascentes/' + i + '.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => d && setNs(x => [...x.filter(y => y.id !== d.id), d])).catch(() => {}))
  }, [])
  const n = ns[0]
  const L = useMemo(() => (n ? lerNascente(n) : null), [n])
  useEffect(() => { if (n && a == null) { setA(n.fotos[0]?.ano ?? null); setB(n.fotos[n.fotos.length - 1]?.ano ?? null) } }, [n, a])
  if (!n || !L) return null
  const f1 = (v: number) => v.toLocaleString(en ? 'en' : 'pt-BR', { maximumFractionDigits: 1 })
  const anos = n.fotos.map(x => x.ano)
  const cor = COR[L.nivel]
  const status = L.nivel === 'ok' ? (en ? 'No risk on the horizon' : 'Sem risco no horizonte') : L.nivel === 'alerta' ? (en ? 'Alert' : 'Alerta') : L.nivel === 'atencao' ? (en ? 'Watch' : 'Atenção') : (en ? 'Monitor' : 'Monitorar')
  const anoInf = L.I ? L.I.ano : null
  const sel = (v: number | null, set: (x: number) => void) => (
    <select value={v ?? ''} onChange={e => set(Number(e.target.value))} className="rounded border px-1.5 py-0.5 text-[12.5px]" style={{ borderColor: '#D0D5DD' }}>
      {anos.map(x => <option key={x} value={x}>{x}</option>)}
    </select>
  )
  const Kpi = ({ t, v, d, c }: { t: string; v: string; d: string; c?: string }) => (
    <div className="rounded-lg" style={{ border: '1px solid #EAECF0', padding: '8px 10px' }}>
      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{t}</div>
      <div className="text-[20px] font-extrabold tabular-nums" style={{ color: c ?? '#101828' }}>{v}</div>
      <div className="text-[11px]" style={{ color: '#667085' }}>{d}</div>
    </div>
  )

  return (
    <div className="card" style={{ padding: 16, borderLeft: `4px solid ${cor}` }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{en ? 'Headwaters · the vegetation that protects the water' : 'Nascentes · a vegetação que protege a água'}</div>
          <h2 className="m-0 text-[18px] font-extrabold" style={{ color: '#101828' }}>{en ? n.nome_en ?? n.nome : n.nome} <span className="text-[13px] font-semibold" style={{ color: '#667085' }}>· {en ? n.onde_en ?? n.onde : n.onde}</span></h2>
          <div className="text-[12.5px]" style={{ color: '#475467' }}>{en ? n.contexto_en ?? n.contexto : n.contexto}</div>
        </div>
        <span className="rounded px-2.5 py-1 text-[12.5px] font-bold" style={{ background: cor + '14', color: cor }}>{status}</span>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[12.5px]" style={{ color: '#475467' }}>
            <b>{en ? 'Before' : 'Antes'}</b>{sel(a, setA)}<b>{en ? 'After' : 'Depois'}</b>{sel(b, setB)}
            <span style={{ color: '#98A2B3' }}>{en ? '· dashed circle = 5 km · blue dot = source' : '· círculo = 5 km · ponto azul = nascente'}</span>
          </div>
          <div className="flex gap-2">{a != null && <Foto n={n} ano={a} en={en} />}{b != null && <Foto n={n} ano={b} en={en} />}</div>
          <div className="text-[11px]" style={{ color: '#98A2B3', marginTop: 4 }}>{en ? 'True colour, end of dry season (Aug–Oct). Crops harvested look light/bare; cerrado looks olive-green.' : 'Cor real, fim da seca (ago–out). Lavoura colhida aparece clara/solo; cerrado aparece verde-oliva.'}</div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Kpi t={en ? 'Native vegetation now' : 'Vegetação nativa hoje'} v={`${f1(L.atual)}%`} d={en ? `within 5 km · 10 m map, median ${L.ult.ano - 2}–${L.ult.ano}` : `em 5 km · mapa 10 m, mediana ${L.ult.ano - 2}–${L.ult.ano}`} />
            <Kpi t={en ? 'Critical point' : 'Ponto crítico'} v={`${n.critico}%`} d={en ? 'A.R.K.O reference (Legal Reserve, Cerrado)' : 'régua A.R.K.O (Reserva Legal, Cerrado)'} c="#B42318" />
            <Kpi t={en ? 'Long-term change' : 'Mudança de longo prazo'} v={`${L.perda > 0 ? '+' : ''}${f1(L.perda)} pts`} d={`${n.cci[0]?.ano}→${n.cci[n.cci.length - 1]?.ano} · ESA CCI 300 m`} c={L.perda < -3 ? '#B54708' : undefined} />
            <Kpi t={en ? 'Current pace' : 'Ritmo atual'} v={`${L.r * 10 > 0 ? '+' : ''}${f1(L.r * 10)} pts/${en ? 'dec' : 'déc'}`} d={`${n.io[0].ano}–${L.ult.ano} · ${en ? '10 m map' : 'mapa 10 m'}`} />
          </div>
          <div className="rounded-lg text-[13px]" style={{ background: cor + '0F', padding: '8px 10px', color: '#101828' }}>
            {anoInf && L.I && <div><b>{en ? 'Inflection point' : 'Ponto de inflexão'} {anoInf}:</b> {en ? `native vegetation within 5 km ${L.I.salto < 0 ? 'dropped' : 'rose'} ${f1(Math.abs(L.I.salto))} points in ${anoInf}; since then the pattern is ` : `a vegetação nativa em 5 km ${L.I.salto < 0 ? 'caiu' : 'subiu'} ${f1(Math.abs(L.I.salto))} pontos em ${anoInf}; desde então o padrão é `}<b>{Math.abs(L.I.depois * 10) < 1.5 ? (en ? 'stable' : 'estável') : L.I.depois < 0 ? (en ? 'still falling' : 'de queda') : (en ? 'recovering' : 'de recuperação')}</b>.</div>}
            <div className="mt-1">
              <b>{en ? 'If nothing changes: ' : 'Se nada mudar: '}</b>
              {L.cruza == null
                ? (en ? `the current pace does not lead to ${n.critico}% — today it is ${f1(L.atual / n.critico)}× the critical point. The alert lights up automatically if the decline returns, ${JANELA_N} years before reaching ${n.critico}%.` : `o ritmo atual não leva a ${n.critico}% — hoje está em ${f1(L.atual / n.critico)}× o ponto crítico. O alerta acende sozinho se a queda voltar, ${JANELA_N} anos antes de chegar a ${n.critico}%.`)
                : (en ? <>reaches {n.critico}% around <b>{L.cruza}</b>; alert from <b>{L.disparo}</b>.</> : <>chega a {n.critico}% por volta de <b>{L.cruza}</b>; alerta a partir de <b>{L.disparo}</b>.</>)}
            </div>
          </div>
          <Grafico n={n} en={en} anoInf={anoInf} />
          <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: '#667085' }}>
            <span><span style={{ color: '#2E7D32', fontWeight: 800 }}>━</span> ESA CCI 300 m (1992–2020)</span>
            <span><span style={{ color: '#0B6E99', fontWeight: 800 }}>━</span> Impact Observatory/Esri 10 m (2017–2023)</span>
            <span>{en ? 'Different resolutions: compare the trend of each line, not one line against the other.' : 'Resoluções diferentes: compare a tendência de cada linha, não uma linha com a outra.'}</span>
          </div>
        </div>
      </div>
      <p className="m-0 mt-2 text-[11px]" style={{ color: '#98A2B3' }}>{en ? n.critico_fonte_en ?? n.critico_fonte : n.critico_fonte} · {en ? 'Sources' : 'Fontes'}: {n.fontes.join(' · ')} · {en ? n.fonte_local_en ?? n.fonte_local : n.fonte_local}</p>
    </div>
  )
}
