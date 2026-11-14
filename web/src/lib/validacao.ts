// v6.2 · Validação com desastres reais. Números medidos pelo A.R.K.O nos dados públicos da NASA:
//  - LHASA: arquivo diário em portal.nccs.nasa.gov (máximo num raio de ~10 km de cada cidade)
//  - NISAR: linha do tempo do próprio app (data/regioes/sul/linha_tempo.json)
// Os desastres vêm de fontes públicas (links abaixo). Script do teste: docs/validacao_lhasa.md
type Bi = [string, string]
export interface Marco { d: string; t: Bi; tipo: 'sinal' | 'desastre' | 'radar' }

/** LHASA, maior valor do dia no vale do Taquari (Lajeado, Estrela, Cruzeiro do Sul, Roca Sales, Santa Cruz do Sul) */
export const RS_LHASA: [string, number][] = [["07-13", 0.01], ["07-14", 0.0], ["07-15", 0.0], ["07-16", 0.0], ["07-17", 0.0], ["07-18", 0.0], ["07-19", 0.01], ["07-20", 0.27], ["07-21", 0.62], ["07-22", 0.13], ["07-23", 0.08], ["07-24", 0.01], ["07-25", 0.01], ["07-26", 0.01], ["07-27", 0.01], ["07-28", 0.41], ["07-29", 0.74], ["07-30", 0.08], ["07-31", 0.05], ["08-01", 0.0], ["08-02", 0.01], ["08-03", 0.01], ["08-04", 0.01], ["08-05", 0.01], ["08-06", 0.02], ["08-07", 0.04], ["08-08", 0.02], ["08-09", 0.02], ["08-10", 0.01], ["08-11", 0.0], ["08-12", 0.18], ["08-13", 0.5], ["08-14", 0.08], ["08-17", 0.01], ["08-18", 0.01], ["08-19", 0.0], ["08-20", 0.01], ["08-21", 0.01], ["08-22", 0.01], ["08-23", 0.0], ["08-24", 0.0], ["08-25", 0.0], ["08-26", 0.0], ["08-27", 0.0], ["08-28", 0.06], ["08-29", 0.27], ["08-30", 0.15], ["08-31", 0.03]]
/** NISAR, água nova (km²) em cada passagem sobre Porto Alegre e o vale do Taquari */
export const RS_AGUA: [string, number][] = [['06-29', 0.7], ['07-11', 0.3], ['07-23', 15.4], ['08-16', 9.7], ['08-28', 0], ['09-09', 12.3]]
export const RS_MARCOS: Marco[] = [
  { d: '07-20', tipo: 'sinal', t: ['LHASA passa de 25% (Roca Sales)', 'LHASA passes 25% (Roca Sales)'] },
  { d: '07-22', tipo: 'desastre', t: ['Taquari e Caí transbordam', 'Taquari and Caí overflow'] },
  { d: '07-23', tipo: 'radar', t: ['NISAR: 24 focos de água nova', 'NISAR: 24 new-water spots'] },
  { d: '07-27', tipo: 'desastre', t: ['Alerta vermelho: Sinos, Jacuí, Uruguai', 'Red alert: Sinos, Jacuí, Uruguay'] },
]
/** LHASA, maior valor do dia em Baglung e Myagdi (Nepal) */
export const NP_LHASA: [string, number][] = [["09-15", 0.08], ["09-16", 0.07], ["09-17", 0.08], ["09-18", 0.07], ["09-19", 0.07], ["09-20", 0.05], ["09-21", 0.05], ["09-22", 0.04], ["09-23", 0.27], ["09-24", 0.36], ["09-25", 0.96], ["09-26", 0.94], ["09-28", 0.12], ["09-29", 0.04], ["09-30", 0.01]]
export const NP_MARCOS: Marco[] = [
  { d: '09-23', tipo: 'sinal', t: ['LHASA passa de 25%', 'LHASA passes 25%'] },
  { d: '09-25', tipo: 'desastre', t: ['Deslizamentos: 12 mortes em Baglung', 'Landslides: 12 deaths in Baglung'] },
]

export const NEPAL_TAB: { lugar: string; data: Bi; antes: string; dia: string; pos: Bi; aviso: boolean }[] = [
  { lugar: 'Baglung', data: ['25 set', '25 Sep'], antes: '29%', dia: '96%', pos: ['1% mais altos do ano', 'top 1% of the year'], aviso: true },
  { lugar: 'Myagdi', data: ['25 set', '25 Sep'], antes: '36%', dia: '96%', pos: ['1% mais altos do ano', 'top 1% of the year'], aviso: true },
  { lugar: 'Palpa', data: ['25 set', '25 Sep'], antes: '30%', dia: '76%', pos: ['1% mais altos do ano', 'top 1% of the year'], aviso: true },
  { lugar: 'Jajarkot', data: ['15 ago', '15 Aug'], antes: '31%', dia: '31%', pos: ['6% mais altos do ano', 'top 6% of the year'], aviso: true },
  { lugar: 'Rolpa', data: ['13 ago', '13 Aug'], antes: '8%', dia: '66%', pos: ['1% mais altos do ano', 'top 1% of the year'], aviso: false },
]
/** % dos dias de 2026 em que cada limite teria disparado alerta (5 distritos do Nepal) */
export const LIMIARES: { lim: string; dias: string; pega: Bi; atual?: boolean }[] = [
  { lim: '10%', dias: '7–19%', pega: ['5 de 5 (4 com aviso antes), mas com alarme demais', '5 of 5 (4 warned before), but too many alarms'] },
  { lim: '25%', dias: '2–7%', pega: ['os mesmos 5 de 5 (4 com aviso antes)', 'the same 5 of 5 (4 warned before)'], atual: true },
  { lim: '50%', dias: '1–3%', pega: ['4 de 5, e só no próprio dia', '4 of 5, and only on the day itself'] },
]

export const FONTES: { t: string; url: string }[] = [
  { t: 'Diário do Comércio · Taquari e Caí transbordam (22 jul 2026)', url: 'https://diariodocomercio.com.br/geral/?p=4968' },
  { t: 'Agência Brasil · 59 mil atingidos, 218 municípios (27 jul 2026)', url: 'https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2026-07/chuvas-no-rio-grande-do-sul-atingem-mais-de-59-mil-pessoas' },
  { t: 'Diário do Litoral · MetSul: El Niño e novas cheias', url: 'https://www.diariodolitoral.com.br/nacional/brasil/metsul-confirma-el-nino-esta-ativo-no-brasil-e-previsao-indica-mais-chuvas-severas-e-enchentes-para-as-proximas-semanas-e-meses/' },
  { t: 'Watchers · Nepal, deslizamentos de 24–29 set 2026', url: 'https://watchers.news/2026/10/01/floods-and-landslides-kill-at-least-32-in-nepal/' },
  { t: 'Kathmandu Post · Rolpa, 13 ago 2026', url: 'https://kathmandupost.com/national/2026/08/15/monsoon-disasters-leave-85-dead-as-rains-continue' },
  { t: 'NASA SVS · NISAR mostra a enchente em Moçambique', url: 'https://svs.gsfc.nasa.gov/5661' },
  { t: 'NASA LHASA · arquivo diário', url: 'https://portal.nccs.nasa.gov/datashare/landslides/nrt/hazard/tif/' },
]
