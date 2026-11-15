// v7.2 · Radar NISAR dentro do Histórico do rio: o rio através das nuvens.
// Antes era uma aba separada ("Rio agora"); agora acompanha o rio escolhido.
import { useEffect } from 'react'
import { useApp } from '../lib/store'
import type { ContinuoJson, RioIndice } from '../lib/rios'
import { MapPanel } from './home/MapPanel'
import { AlertPanel } from './home/AlertPanel'
import { Ajuda } from './Ajuda'

const dataBR = (iso: string, en: boolean) => new Date(iso + 'T12:00:00').toLocaleDateString(en ? 'en-GB' : 'pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export function RadarRio({ info, c, en }: { info: RioIndice; c: ContinuoJson | null; en: boolean }) {
  const { ds, setRegion } = useApp()
  const tem = !!info.regiao && ds.realIndex.some(m => m.id === info.regiao)
  useEffect(() => { if (tem && ds.realMeta.id !== info.regiao) setRegion(info.regiao!, { src: 'real' }) }, [info.id, tem])   // eslint-disable-line
  const pronto = tem && ds.realMeta.id === info.regiao
  const hls = c?.ultima?.d ?? null
  const nisar = pronto ? ds.realMeta.depois : null
  const maisNovo = hls && nisar ? (nisar > hls ? 'nisar' : 'hls') : nisar ? 'nisar' : hls ? 'hls' : null

  return (
    <div id="radar-rio" className="card radar-rio">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.1em]" style={{ color: '#0E7490' }}>{en ? 'NISAR radar · the river through the clouds' : 'Radar NISAR · o rio através das nuvens'}</div>
          <h2 className="m-0 mt-1 flex items-center gap-1.5" style={{ fontSize: 18 }}>
            {en ? 'The river now, even under clouds' : 'O rio agora, mesmo com nuvem'}
            <Ajuda txt={en ? 'Landsat and HLS are cameras: with clouds or smoke they see nothing, and in the rainy season that can mean weeks without data. The NISAR radar (NASA–ISRO) sends its own microwave signal and sees through clouds, day or night, every ~12 days. Here it covers the gaps of the optical monitor.' : 'Landsat e HLS são câmeras: com nuvem ou fumaça não enxergam nada, e na época de chuva isso pode virar semanas sem dado. O radar NISAR (NASA–ISRO) manda o próprio sinal de micro-ondas e enxerga através das nuvens, de dia ou de noite, a cada ~12 dias. Aqui ele cobre os buracos do monitor óptico.'} />
          </h2>
        </div>
      </div>

      {/* as duas fontes rápidas lado a lado: qual é o dado mais novo deste rio */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg p-3 text-[13px]" style={{ background: maisNovo === 'hls' ? '#ECFDF3' : '#F8FAFC', border: `1px solid ${maisNovo === 'hls' ? '#ABEFC6' : '#E4E7EC'}` }}>
          <b>{en ? 'Optical (HLS, clear sky)' : 'Óptico (HLS, céu limpo)'}</b><br />
          {hls ? <>{en ? 'last clear image: ' : 'última imagem limpa: '}<b>{dataBR(hls, en)}</b></> : (en ? 'no clear image yet' : 'sem imagem limpa ainda')}
          {maisNovo === 'hls' && <span className="ml-1 text-[11.5px] font-bold" style={{ color: '#067647' }}>· {en ? 'newest' : 'mais recente'}</span>}
        </div>
        <div className="rounded-lg p-3 text-[13px]" style={{ background: maisNovo === 'nisar' ? '#ECFDF3' : '#F8FAFC', border: `1px solid ${maisNovo === 'nisar' ? '#ABEFC6' : '#E4E7EC'}` }}>
          <b>{en ? 'Radar (NISAR, through clouds)' : 'Radar (NISAR, através das nuvens)'}</b><br />
          {nisar ? <>{en ? 'last pass: ' : 'última passagem: '}<b>{dataBR(nisar, en)}</b></> : tem ? (en ? 'loading…' : 'carregando…') : info.regiao ? (en ? 'first pass on the way' : 'primeira passagem a caminho') : (en ? 'this stretch is not processed yet' : 'este trecho ainda não é processado')}
          {maisNovo === 'nisar' && <span className="ml-1 text-[11.5px] font-bold" style={{ color: '#067647' }}>· {en ? 'newest' : 'mais recente'}</span>}
        </div>
      </div>

      {!tem && info.regiao && (
        <p className="m-0 mt-3 text-[13px] leading-relaxed" style={{ color: '#475467' }}>
          {en
            ? `The NISAR box over ${info.cidade} is already in the robot; the first radar comparison appears here after its next run. Until then, this river is followed by the optical monitor (HLS) and the 40-year Landsat series above.`
            : `A caixa do NISAR sobre ${info.cidade} já está no robô; a primeira comparação do radar aparece aqui depois da próxima rodada dele. Até lá, este rio é acompanhado pelo monitor óptico (HLS) e pela série Landsat de 40 anos acima.`}
        </p>
      )}
      {!tem && !info.regiao && (
        <p className="m-0 mt-3 text-[13px] leading-relaxed" style={{ color: '#475467' }}>
          {en
            ? `The A.R.K.O robot does not process NISAR passes over ${info.cidade} yet, so this river is followed by the optical monitor (HLS) and the 40-year Landsat series above. Adding new stretches only needs a new box in the robot; it is on the plan in "Future applications".`
            : `O robô do A.R.K.O ainda não processa passagens do NISAR sobre ${info.cidade}; por isso este rio é acompanhado pelo monitor óptico (HLS) e pela série Landsat de 40 anos acima. Incluir um trecho novo só exige uma nova caixa no robô; está no plano em "Aplicações futuras".`}
        </p>
      )}

      {pronto && (
        <>
          <p className="m-0 mt-3 text-[12.5px] leading-relaxed" style={{ color: '#5B6B7F' }}>
            {en
              ? 'Each dot is a spot where the radar signal changed between the two passes: water outside the channel, exposed bank (water receded) or loss of vegetation near the river. They are hypotheses to check on the ground, not certainties.'
              : 'Cada ponto é um lugar onde o sinal do radar mudou entre as duas passagens: água fora do leito, margem exposta (a água recuou) ou perda de vegetação perto do rio. São hipóteses para conferir em campo, não certezas.'}
          </p>
          {ds.realMeta.beta && <p className="m-0 mt-2 text-[12.5px]" style={{ color: '#B54708' }}>{en ? 'BETA NISAR data (before final calibration): good for seeing where things changed, not for exact values.' : 'Dados BETA do NISAR (antes da calibração final): servem para ver onde mudou, não para valores exatos.'}</p>}
          <div className="home2 mt-3">
            <div className="body">
              <MapPanel />
              <AlertPanel />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
