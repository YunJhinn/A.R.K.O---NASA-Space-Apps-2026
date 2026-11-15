// v5.5 · O que fazer com cada alerta: recomendação prática por tipo de perigo e nível.
// v7.2: para água, solo e mata, as sugestões são de conservação do rio (fiscalização, saneamento, comitê de bacia).
import type { Alert } from './types'

type Bi = [string, string]
const R: Record<string, Partial<Record<'Alto' | 'Médio' | 'Baixo', Bi>>> = {
  fogo: {
    Alto: ['Acionar bombeiros/brigada para o local agora. Avisar moradores num raio de 5 km sobre fumaça e risco do fogo avançar.', 'Send firefighters to the site now. Warn residents within 5 km about smoke and the fire spreading.'],
    'Médio': ['Enviar equipe para verificar se é queimada controlada ou incêndio. Acompanhar se o fogo cresce na próxima passagem do satélite.', 'Send a team to check if it is a controlled burn or a wildfire. Watch if it grows in the next satellite pass.'],
  },
  deslizamento: {
    Alto: ['Defesa Civil: vistoriar encostas e estradas. Alertar moradores de áreas de encosta para sair se a chuva continuar.', 'Civil defense: inspect slopes and roads. Warn hillside residents to leave if the rain continues.'],
    'Médio': ['Vistoriar as encostas mais próximas de casas e estradas. Deixar a rota de saída combinada com os moradores.', 'Inspect the slopes closest to homes and roads. Agree on an exit route with residents.'],
  },
  agua: {
    Alto: ['Conferir no local se é cheia natural, barragem ou obra alterando o leito. Avisar o comitê de bacia e a companhia de saneamento: água fora do leito arrasta lixo, esgoto e terra para o rio.', 'Check on site whether it is a natural flood, a dam or works changing the channel. Notify the basin committee and the water utility: water outside the channel carries waste, sewage and soil into the river.'],
    'Médio': ['Comparar com a imagem óptica (HLS) e com a cheia do mesmo mês em anos anteriores. Se não for cheia normal, pedir vistoria ambiental.', 'Compare with the optical image (HLS) and with the same month in past years. If it is not a normal flood, request an environmental inspection.'],
  },
  geleira: {
    Alto: ['Alertar comunidades rio abaixo. Evitar o leito do rio e enviar equipe para monitorar o lago e o gelo.', 'Warn downstream communities. Stay away from the riverbed and send a team to monitor the lake and the ice.'],
    'Médio': ['Monitorar o gelo e o lago com imagens e equipe local. Avisar comunidades rio abaixo para ficarem atentas.', 'Monitor the ice and the lake with images and a local team. Ask downstream communities to stay alert.'],
  },
  colapso: {
    Alto: ['Manter o alerta oficial: comunidades rio abaixo longe do leito do rio e prontas para sair. Seguir as autoridades locais.', 'Keep the official warning: downstream communities away from the riverbed and ready to leave. Follow local authorities.'],
  },
  arvore: {
    Alto: ['Enviar fiscalização ambiental: mata na margem é Área de Preservação Permanente (Código Florestal) e segura terra e lixo fora do rio.', 'Send environmental inspectors: riverbank forest is a legally protected area (Brazilian Forest Code) and keeps soil and waste out of the river.'],
    'Médio': ['Conferir na imagem óptica se é corte, queimada ou colheita. Se for desmate na margem, acionar a fiscalização e planejar o replantio.', 'Check the optical image for clearing, fire or harvest. If riverbank clearing is confirmed, call inspectors and plan replanting.'],
  },
  solo: {
    Alto: ['Leito exposto: avisar a companhia de saneamento sobre risco para a captação. Comparar com a seca dos anos anteriores e revisar outorgas de retirada de água neste trecho.', 'Exposed riverbed: warn the water utility about risk to the intake. Compare with past dry seasons and review water withdrawal permits on this stretch.'],
    'Médio': ['Acompanhar na próxima passagem. Se a margem seguir exposta fora da época seca, investigar retirada de água, assoreamento ou desvio.', 'Follow up in the next pass. If the bank stays exposed outside the dry season, investigate water withdrawal, silting or diversion.'],
  },
}
const BAIXO: Bi = ['Sem ação urgente: acompanhar na próxima atualização.', 'No urgent action: follow up in the next update.']

export function recomendacao(a: Pick<Alert, 'ty' | 'lvl'>, lang: string) {
  const r = R[a.ty]?.[a.lvl] ?? (a.lvl === 'Baixo' ? BAIXO : R[a.ty]?.['Médio'] ?? BAIXO)
  return r[lang === 'en' ? 1 : 0]
}

/** link para abrir o ponto num mapa de ruas (OpenStreetMap) */
export const osm = (lat: number, lon: number) => `https://www.openstreetmap.org/?mlat=${lat.toFixed(4)}&mlon=${lon.toFixed(4)}#map=13/${lat.toFixed(4)}/${lon.toFixed(4)}`
export const coord = (lat: number, lon: number) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'L' : 'O'}`
