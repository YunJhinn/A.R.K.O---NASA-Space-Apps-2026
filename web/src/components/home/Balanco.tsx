// v7.5 · Balanço da região para gestão: estoque (Landsat, trecho de referência) + saldo das mudanças
// detectadas pelo NISAR ao longo das passagens + exportação dos focos para GIS.
import { useEffect, useMemo, useState } from 'react'
import { DATA_BASE, useApp } from '../../lib/store'
import { balanco, csvFocos } from '../../lib/gestao'
import { carregarRio, RIOS, type RioJson } from '../../lib/rios'
import { Ajuda } from '../Ajuda'

const f = (v: number, en: boolean, d = 1) => v.toLocaleString(en ? 'en' : 'pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d })
const pl = (n: number, um: string, v: string) => `${n} ${n === 1 ? um : v}`
const dCurta = (iso: string, en: boolean) => new Date(iso + 'T12:00:00').toLocaleDateString(en ? 'en-GB' : 'pt-BR', { day: '2-digit', month: 'short' })

export function Balanco() {
  const { s, ds, set } = useApp()
  const en = s.lang === 'en'
  const B = useMemo(() => balanco(ds.timeline), [ds.timeline])
  const rio = RIOS.find(r => r.regiao === ds.realMeta.id)
  const [ref, setRef] = useState<RioJson | null>(null)
  useEffect(() => { setRef(null); if (rio) carregarRio(DATA_BASE, rio.id).then(d => setRef(d ?? null)) }, [rio?.id])   // eslint-disable-line
  const ult = ref ? [...ref.serie].reverse().find(a => a.mata_ciliar != null || a.agua_km2 != null) : null

  const onde = ds.escopo.ativo ? (en ? ` · ≤ ${ds.escopo.raio} km` : ` · até ${ds.escopo.raio} km`) : ds.escopo.nome ? (en ? ' · whole pass' : ' · passagem inteira') : ''
  // v7.15 · zero aparece como "Nenhuma" (cinza), para não parecer dado faltando
  const val = (x: { km2: number; focos: number }, cor: string): [string, string] => (x.focos === 0 ? [en ? 'None' : 'Nenhuma', '#667085'] : [`${f(x.km2, en, 2)} km²`, cor])
  const baixarCSV = () => {
    const blob = new Blob([csvFocos(ds.timeline)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `arko_focos_${ds.realMeta.id}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const geo = `${DATA_BASE}${ds.realMeta.pasta}focos.geojson`

  const cel = (rot: string, v: string, sub: string, cor: string, ajuda?: string) => (
    <div className="bg-white px-4 py-2.5">
      <div className="flex items-center text-[11px] font-bold uppercase tracking-wide" style={{ color: '#667085' }}>{rot}{ajuda && <Ajuda txt={ajuda} />}</div>
      <div className="text-[20px] font-extrabold tabular-nums leading-tight" style={{ color: cor }}>{v}</div>
      <div className="text-[11.5px]" style={{ color: '#667085' }}>{sub}</div>
    </div>
  )

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #EAECF0' }}>
        <h3 className="m-0 flex items-center text-[14.5px]">
          {en ? 'Region balance' : 'Balanço da região'}
          {B.de && <span className="ml-2 text-[12px] font-normal" style={{ color: '#667085' }}>{dCurta(B.de, en)} → {dCurta(B.ate!, en)} · {B.n} {en ? 'radar comparisons' : 'comparações do radar'}<Ajuda txt={en ? 'Here each radar pass is compared with the previous one (about 12 days apart) and the changes are added up. The map below compares two dates directly (e.g. 3 Sep vs 21 Oct), so it can also show slow changes that add up between them. Both are correct; they answer different questions.' : 'Aqui cada passagem do radar é comparada com a anterior (cerca de 12 dias) e as mudanças são somadas. O mapa abaixo compara duas datas direto (ex.: 3 set com 21 out), então também mostra mudanças lentas que se acumulam entre elas. Os dois estão certos; respondem perguntas diferentes.'} /></span>}
        </h3>
        <div className="flex gap-2">
          <a href={geo} download={`arko_focos_${ds.realMeta.id}.geojson`} className="btn" style={{ fontSize: 12.5, padding: '5px 10px' }}>⬇ GeoJSON</a>
          <button type="button" onClick={baixarCSV} className="btn" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={!ds.timeline.length}>⬇ CSV {en ? '(all passes)' : '(todas as passagens)'}</button>
        </div>
      </div>
      {/* v7.13 · recorte: o radar cobre ~300 km; o trecho de referência tem ~20 km */}
      {ds.escopo.nome && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12.5px]" style={{ borderBottom: '1px solid #EAECF0', background: '#F8FAFC', color: '#475467' }}>
          <b style={{ color: '#101828' }}>{en ? 'Area:' : 'Área:'}</b>
          {ds.escopo.disponivel ? (
            <>
              {([['rio', en ? `Near the monitored river (≤ ${ds.escopo.raio} km)` : `Perto do rio monitorado (até ${ds.escopo.raio} km)`], ['tudo', en ? 'Whole radar pass (~300 km)' : 'Toda a passagem do radar (~300 km)']] as const).map(([k, t]) => (
                <button key={k} type="button" onClick={() => set({ escopo: k, sel: null })} className="rounded-full px-3 py-0.5 font-semibold"
                  style={{ background: s.escopo === k ? '#0B1F33' : '#fff', color: s.escopo === k ? '#fff' : '#101828', border: '1px solid #D0D5DD' }}>{t}</button>
              ))}
              <span>{ds.escopo.ativo
                ? (en ? `Only what the radar saw around ${ds.escopo.nome[1]}, the same stretch as the Landsat stock.` : `Só o que o radar viu em volta de ${ds.escopo.nome[0]}, o mesmo trecho do estoque Landsat.`)
                : (en ? 'All rivers in the radar pass; the stock columns stay on the reference stretch.' : 'Todos os rios da passagem do radar; as colunas de estoque continuam no trecho de referência.')}</span>
            </>
          ) : (
            <span>{en ? `The reference stretch (${ds.escopo.nome[1]}) is outside this radar pass: showing the whole pass (~300 km). The stock columns are from the reference stretch.` : `O trecho de referência (${ds.escopo.nome[0]}) fica fora desta passagem do radar: mostrando a passagem inteira (~300 km). As colunas de estoque são do trecho de referência.`}</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-px lg:grid-cols-5" style={{ background: '#EAECF0' }}>
        {cel(en ? 'Forest change (NISAR)' : 'Mudança na mata (NISAR)', val(B.r.arvore, '#2F9E44')[0], `${pl(B.r.arvore.focos, en ? 'spot' : 'foco', en ? 'spots' : 'focos')} · ${pl(B.r.arvore.passagens, en ? 'pass' : 'passagem', en ? 'passes' : 'passagens')}${onde}`, val(B.r.arvore, '#2F9E44')[1],
          en ? 'Sum of areas where the radar vegetation signal (HV) dropped, each pass compared with the previous one. Can be clearing, fire, harvest or drought: verify on site.' : 'Soma das áreas onde o sinal de vegetação do radar (HV) caiu, cada passagem comparada com a anterior. Pode ser corte, queimada, colheita ou seca: verificar em campo.')}
        {cel(en ? 'Water outside channel' : 'Água fora do leito', val(B.r.agua, '#1C7ED6')[0], `${pl(B.r.agua.focos, en ? 'spot' : 'foco', en ? 'spots' : 'focos')} · ${pl(B.r.agua.passagens, en ? 'pass' : 'passagem', en ? 'passes' : 'passagens')}${onde}`, val(B.r.agua, '#1C7ED6')[1],
          en ? 'Sum of areas that turned into still water between passes (strong HH drop).' : 'Soma das áreas que viraram água parada entre passagens (queda forte do HH).')}
        {cel(en ? 'Exposed bank' : 'Margem exposta', val(B.r.solo, '#B8692A')[0], `${pl(B.r.solo.focos, en ? 'spot' : 'foco', en ? 'spots' : 'focos')} · ${pl(B.r.solo.passagens, en ? 'pass' : 'passagem', en ? 'passes' : 'passagens')}${onde}`, val(B.r.solo, '#B8692A')[1],
          en ? 'Sum of areas where water left and the bed/bank became exposed.' : 'Soma das áreas onde a água saiu e o leito ou a margem ficou exposto.')}
        {cel(en ? 'Riparian forest (stock)' : 'Mata ciliar (estoque)', ult?.mata_ciliar != null ? `${f(ult.mata_ciliar, en, 0)}%` : '—', ref && ult ? `Landsat ${ult.ano} · ${ref.cidade}` : (en ? 'no reference stretch' : 'sem trecho de referência'), '#101828',
          en ? 'Share of the ~500 m band along the banks covered by dense vegetation (NDVI > 0.6), in the ~20 km Landsat reference stretch of this region. Stock, not change.' : 'Parte da faixa de ~500 m nas margens coberta por vegetação densa (NDVI > 0,6), no trecho de referência Landsat de ~20 km desta região. É estoque, não mudança.')}
        {cel(en ? 'Water area (stock)' : 'Área de água (estoque)', ult?.agua_km2 != null ? `${f(ult.agua_km2, en, 1)} km²` : '—', ref && ult ? `Landsat ${ult.ano} · ${en ? 'dry season' : 'estação seca'}` : '—', '#101828',
          en ? 'Open water in the ~20 km reference stretch (MNDWI > 0.1), dry-season median of the year.' : 'Água aberta no trecho de referência de ~20 km (MNDWI > 0,1), mediana da estação seca do ano.')}
      </div>
    </div>
  )
}
