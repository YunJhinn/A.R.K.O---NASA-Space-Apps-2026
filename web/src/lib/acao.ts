// v5.5 · O que fazer com cada alerta: recomendação prática por tipo de perigo e nível.
// São orientações gerais de resposta (Defesa Civil, bombeiros, fiscalização), para apoiar quem decide.
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
    Alto: ['Alertar moradores de áreas baixas e margens de rio. Preparar abrigos e acompanhar o nível do rio com a Defesa Civil.', 'Warn residents of low areas and riverbanks. Prepare shelters and track the river level with civil defense.'],
    'Médio': ['Verificar no local os pontos de alagamento e avisar quem mora perto. Acompanhar na próxima passagem do radar.', 'Check the flooded spots on site and warn people living nearby. Follow up in the next radar pass.'],
  },
  geleira: {
    Alto: ['Alertar comunidades rio abaixo. Evitar o leito do rio e enviar equipe para monitorar o lago e o gelo.', 'Warn downstream communities. Stay away from the riverbed and send a team to monitor the lake and the ice.'],
    'Médio': ['Monitorar o gelo e o lago com imagens e equipe local. Avisar comunidades rio abaixo para ficarem atentas.', 'Monitor the ice and the lake with images and a local team. Ask downstream communities to stay alert.'],
  },
  colapso: {
    Alto: ['Manter o alerta oficial: comunidades rio abaixo longe do leito do rio e prontas para sair. Seguir as autoridades locais.', 'Keep the official warning: downstream communities away from the riverbed and ready to leave. Follow local authorities.'],
  },
  arvore: {
    Alto: ['Enviar fiscalização ambiental para conferir o desmatamento no local.', 'Send environmental inspectors to check the clearing on site.'],
    'Médio': ['Conferir na imagem óptica e, se confirmado, acionar a fiscalização ambiental.', 'Check the optical image and, if confirmed, call environmental inspectors.'],
  },
  solo: {
    Alto: ['A água está baixando: avaliar danos, limpar lama e organizar a volta segura das famílias.', 'The water is going down: assess damage, clear mud and organize the safe return of families.'],
    'Médio': ['Água baixando: checar estradas e casas antes de liberar o acesso.', 'Water going down: check roads and homes before reopening access.'],
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
