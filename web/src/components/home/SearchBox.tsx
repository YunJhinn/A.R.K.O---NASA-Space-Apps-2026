import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../lib/store'
import { REGION_LIST, dentro, projetar } from '../../lib/regions'
import { realShort } from '../../lib/real'
import { norm } from '../../lib/util'
import { Icon } from '../Icon'

/** Um resultado da busca */
interface Place { name: string; detail: string; lon: number; lat: number; kind: 'local' | 'mundo'; id?: string; region?: string; src?: 'demo' | 'real' }

/**
 * Busca por qualquer lugar do mundo.
 * 1) primeiro procura nos lugares que o app já conhece (cidades e focos das regiões)
 * 2) depois pergunta ao OpenStreetMap (Nominatim) — funciona para qualquer país, cidade, rio ou região
 * Se o lugar está numa região com dados, o app abre essa região e marca o ponto no mapa.
 * Se não está, mostra quais regiões já têm dados.
 */
export function SearchBox() {
  const { s, t, ds, setRegion } = useApp()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [world, setWorld] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [miss, setMiss] = useState<Place | null>(null)
  const box = useRef<HTMLDivElement>(null)

  // lugares conhecidos (todas as regiões)
  const local: Place[] = []
  const k = norm(q.trim())
  if (k.length >= 2) {
    REGION_LIST.forEach(r => {
      if (norm(r.name).includes(k)) local.push({ name: r.name, detail: t('Região com dados de exemplo'), lon: NaN, lat: NaN, kind: 'local', region: r.id, src: 'demo' })
      const seen = new Set<string>()
      r.ev.filter(e => e.st === 'obs' && norm(e.pl).includes(k)).forEach(e => {
        if (seen.has(e.pl)) return; seen.add(e.pl)
        local.push({ name: e.pl, detail: `${t(ds.types[e.k].s)} · ${t(r.name)}`, lon: NaN, lat: NaN, kind: 'local', id: e.id, region: r.id, src: 'demo' })
      })
    })
    // regiões com dados reais do NISAR
    ds.realIndex.forEach(m => {
      if (norm(`${m.nome} ${m.pais} ${realShort(m)}`).includes(k)) local.push({ name: t(m.nome), detail: t('Região com dados reais do NISAR'), lon: NaN, lat: NaN, kind: 'local', region: m.id, src: 'real' })
    })
  }

  // busca mundial (OpenStreetMap / Nominatim), com espera de 450 ms entre teclas
  useEffect(() => {
    setMiss(null)
    if (k.length < 3) { setWorld([]); return }
    const ctl = new AbortController()
    const id = setTimeout(() => {
      setLoading(true)
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=${s.lang === 'en' ? 'en' : 'pt-BR'}&q=${encodeURIComponent(q.trim())}`
      fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
        .then(r => (r.ok ? r.json() : []))
        .then((rows: { display_name: string; name?: string; lon: string; lat: string }[]) => {
          setWorld(rows.map(r => {
            const parts = r.display_name.split(',').map(x => x.trim())
            return { name: r.name || parts[0], detail: parts.slice(1, 4).join(', '), lon: +r.lon, lat: +r.lat, kind: 'mundo' as const }
          }))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 450)
    return () => { clearTimeout(id); ctl.abort() }
  }, [k, q, s.lang])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !e.composedPath().includes(box.current)) setOpen(false) }
    document.addEventListener('click', close); return () => document.removeEventListener('click', close)
  }, [])

  const goMap = () => setTimeout(() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)

  const pick = (p: Place) => {
    const done = () => { setOpen(false); goMap() }
    // foco já conhecido (dados de exemplo)
    if (p.id && p.region) {
      setRegion(p.region, { src: 'demo', sel: p.id, preset: '1a', custom: null }); setQ(p.name); done(); return
    }
    // nome de região
    if (p.region && Number.isNaN(p.lon)) { setRegion(p.region, { src: p.src ?? 'demo' }); done(); return }
    const pin = { lon: p.lon, lat: p.lat, label: p.name }
    const realHit = ds.realIndex.find(m => dentro(m.imagem, p.lon, p.lat))
    const exHit = REGION_LIST.find(r => dentro(r.bounds, p.lon, p.lat))
    // no modo real, prefere dados reais; no exemplo, prefere o exemplo; sem nenhum dos dois, avisa
    const useReal = realHit && (s.src === 'real' || !exHit)
    if (useReal) { setRegion(realHit.id, { src: 'real', pin, sel: null }); done(); return }
    if (!exHit) { setMiss(p); return }
    // foco de exemplo mais perto do ponto buscado (até ~40 px no mapa)
    const { x, y } = projetar(exHit.bounds, p.lon, p.lat)
    const near = exHit.ev.filter(e => e.st === 'obs').map(e => ({ e, d: Math.hypot(e.x - x, e.y - y) })).sort((a, b) => a.d - b.d)[0]
    setRegion(exHit.id, { src: 'demo', pin, sel: near && near.d < 40 ? near.e.id : null, preset: '1a', custom: null }); done()
  }

  const results = [...local.slice(0, 5), ...world]
  return (
    <div className="relative ml-auto" ref={box}>
      <label className="search">
        <Icon k="busca" />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' && results[0]) pick(results[0]); if (e.key === 'Escape') setOpen(false) }}
          placeholder={t('Buscar cidade, rio ou região')} aria-label={t('Buscar cidade, rio ou região')} />
        {loading && <span className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-[var(--bd2)] border-t-[var(--acc)]" />}
      </label>
      {open && k.length >= 2 && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[380px] overflow-hidden rounded-lg border border-[var(--bd)] bg-white shadow-[0_18px_40px_rgba(12,35,66,.22)]">
          {miss ? (
            <div className="p-4">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-lg">📍</span>
                <div className="min-w-0">
                  <b className="block text-[14px]">{miss.name}</b>
                  <span className="block truncate text-[12px] text-[var(--mu)]">{miss.detail}</span>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-snug text-[var(--soft)]">{t('Ainda não monitoramos essa área. O A.R.K.O pode ser configurado para qualquer região coberta pelo NISAR. Regiões com dados agora:')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REGION_LIST.map(r => <button key={r.id} className="btn" onClick={() => { setRegion(r.id, { src: 'demo' }); setOpen(false); goMap() }}>{t(r.name)} · {t('Exemplo')}</button>)}
                {ds.realIndex.map(m => <button key={'r' + m.id} className="btn" onClick={() => { setRegion(m.id, { src: 'real' }); setOpen(false); goMap() }}>{t(realShort(m))} · {t('NISAR real')}</button>)}
              </div>
              <button className="mt-3 text-[12px] font-bold text-[var(--acc)]" onClick={() => setMiss(null)}>{t('← Voltar aos resultados')}</button>
            </div>
          ) : (
            <>
              {results.length === 0 && <div className="p-4 text-[13px] text-[var(--mu)]">{t(loading ? 'Buscando no mapa do mundo…' : 'Nenhum lugar encontrado.')}</div>}
              {results.map((p, i) => {
                const reg = p.region ?? (p.kind === 'mundo' ? (REGION_LIST.find(r => dentro(r.bounds, p.lon, p.lat))?.id ?? ds.realIndex.find(m => dentro(m.imagem, p.lon, p.lat))?.id) : undefined)
                return (
                  <button key={i} onClick={() => pick(p)} className="flex w-full items-center gap-3 border-b border-[var(--bd)] px-4 py-2.5 text-left transition last:border-0 hover:bg-[var(--accbg)]">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-[var(--surf2)] text-[var(--mu)]"><Icon k={p.kind === 'local' ? 'radar' : 'mapa'} size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13.5px]">{p.name}</b>
                      <span className="block truncate text-[12px] text-[var(--mu)]">{p.detail}</span>
                    </span>
                    {reg ? <span className="flex-none rounded bg-[#E6F4EA] px-2 py-0.5 text-[10.5px] font-extrabold uppercase text-[#1E7B34]">{t('Com dados')}</span>
                      : <span className="flex-none rounded bg-[var(--surf2)] px-2 py-0.5 text-[10.5px] font-extrabold uppercase text-[var(--sub)]">{t('Sem dados')}</span>}
                  </button>
                )
              })}
              <div className="bg-[var(--surf2)] px-4 py-2 text-[11px] text-[var(--sub)]">{t('Busca mundial: © OpenStreetMap')}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
