// Alertas de COLAPSO de desastres conhecidos (v4). Não são detecções do A.R.K.O:
// cada um diz de onde veio (fonte com link) e em que fase está (ocorrido, sinal prévio, previsão).
// O A.R.K.O ainda não mede movimento do solo; isso está no plano (dados GUNW do NISAR).
import type { Alert } from './types'

type Lang = 'pt' | 'en'
type Bi = [string, string]
interface EventAlert { fase: NonNullable<Alert['fase']>; quando: Bi; t: Bi; l: string; m: Bi; pz: Bi; fontes: { src: string; url: string }[] }
interface EventCard { t: Bi; l: string; m: Bi; pz: Bi; etapas: EventAlert[] }

const ICIMOD = 'https://www.icimod.org/press-releases/second-major-himalayan-flood-in-seven-weeks-raises-new-questions-about-mountain-risk/'
const EVENTOS: Record<string, EventCard> = {
  nepal: {
   t: ['Perigo de novo colapso', 'Danger of a new collapse'],
   l: 'Lhende Khola · Nepal',
   m: ['Lago de barragem e encostas instáveis: alto risco de nova enxurrada.', 'Barrier lake and unstable slopes: high risk of another flood.'],
   pz: ['Alerta oficial', 'Official warning'],
   etapas: [
    {
      fase: 'previsao', quando: ['agora', 'now'],
      t: ['Previsão: perigo de novo colapso e de lago de barragem', 'Forecast: danger of a new collapse and a barrier lake'],
      l: 'Lhende Khola · Bhote Koshi · Nepal',
      m: ['O governo do Nepal alertou para alto risco de enxurrada vindo de um lago de barragem de cerca de 2 milhões de m³ formado pelos detritos na fronteira. Menos de sete semanas depois, outro colapso de rocha e gelo atingiu a bacia do Budhi Gandaki: o perigo segue alto na região.',
          'Nepal’s government warned of a high flood risk from a barrier lake of about 2 million m³ formed by debris at the border. Less than seven weeks later, another rock–ice collapse hit the Budhi Gandaki basin: the danger remains high in the region.'],
      pz: ['Alerta oficial · o A.R.K.O ainda não mede o movimento do solo', 'Official warning · A.R.K.O does not measure ground motion yet'],
      fontes: [{ src: 'NDRRMA via Outlook India', url: 'https://www.outlookindia.com/international/nepal-faces-fresh-flood-threat-from-new-barrier-lake-near-tibet-border' }, { src: 'ICIMOD', url: ICIMOD }],
    },
    {
      fase: 'ocorrido', quando: ['26 ago', '26 Aug'],
      t: ['Colapso ocorrido: rocha e gelo do Langtang Lirung', 'Collapse occurred: Langtang Lirung rock and ice'],
      l: 'Langtang Lirung · Rasuwa · Nepal',
      m: ['Em 26 ago 2026, cerca de 132 milhões de m³ de rocha e gelo caíram no vale do Lhende Khola e viraram uma enxurrada pelo Bhote Koshi e o Trishuli. O rio Trishuli subiu até 9 m em 30 minutos.',
          'On 26 Aug 2026, about 132 million m³ of rock and ice fell into the Lhende Khola valley and became a flood down the Bhote Koshi and the Trishuli. The Trishuli rose up to 9 m in 30 minutes.'],
      pz: ['Ocorrido em 26 ago 2026', 'Occurred on 26 Aug 2026'],
      fontes: [{ src: 'ICIMOD', url: ICIMOD }, { src: 'g1', url: 'https://g1.globo.com/meio-ambiente/noticia/2026/08/28/entenda-a-formacao-de-geleiras-e-o-rompimento-que-provocou-enchente-repentina-no-nepal.ghtml' }],
    },
    {
      fase: 'sinal', quando: ['jul–ago', 'Jul–Aug'],
      t: ['Sinal de colapso: encosta se movendo antes da queda', 'Collapse warning sign: slope moving before the fall'],
      l: 'Langtang Lirung · Nepal',
      m: ['O radar Sentinel-1 registrou até 40 cm de deformação na encosta entre 7 jul e 24 ago, nos 48 dias antes do colapso; dados do NISAR também mostraram movimento. É esse sinal que o A.R.K.O quer vigiar com os dados de movimento do solo do NISAR.',
          'Sentinel-1 radar recorded up to 40 cm of slope deformation between 7 Jul and 24 Aug, in the 48 days before the collapse; NISAR data also showed motion. This is the signal A.R.K.O wants to watch with NISAR ground-motion data.'],
      pz: ['Sinal de 7 jul a 24 ago 2026 · achado depois do desastre', 'Signal from 7 Jul to 24 Aug 2026 · found after the disaster'],
      fontes: [{ src: 'ICIMOD', url: ICIMOD }, { src: 'Remote Sensing (MDPI)', url: 'https://www.mdpi.com/2072-4292/18/21/3727' }],
    },
  ] },
}

export const FASE: Record<NonNullable<Alert['fase']>, Bi> = {
  previsao: ['Previsão', 'Forecast'], ocorrido: ['Ocorrido', 'Occurred'], sinal: ['Sinal prévio', 'Warning sign'],
}

export function eventAlerts(region: string, lang: Lang): Alert[] {
  const L = (b: Bi) => (lang === 'pt' ? b[0] : b[1])
  const ev = EVENTOS[region]
  if (!ev) return []
  const ordem = { sinal: 0, ocorrido: 1, previsao: 2 }
  const etapas = ev.etapas.slice().sort((a, b) => ordem[a.fase] - ordem[b.fase])
    .map(e => ({ fase: e.fase, quando: L(e.quando), t: L(e.t), m: L(e.m), fontes: e.fontes }))
  return [{ id: null, lvl: 'Alto', p: 100, t: L(ev.t), l: ev.l, ty: 'colapso', m: L(ev.m), pz: L(ev.pz), src: 'evento', fase: 'previsao',
    fontes: [...new Map(ev.etapas.flatMap(e => e.fontes).map(f => [f.url, f])).values()], etapas }]
}
