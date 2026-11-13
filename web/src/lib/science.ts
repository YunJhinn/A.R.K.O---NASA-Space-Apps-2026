// Conteúdo científico (PT e EN): o que é o radar, polarizações, regras de detecção,
// limitações e aplicações futuras do NISAR. Usado na aba "Entenda o radar" e no detalhe do foco.
export type Lang = 'pt' | 'en'
type Bi = [string, string]
export const L = (lang: Lang, b: Bi) => (lang === 'pt' ? b[0] : b[1])

/** Polarização usada para detectar cada tipo de mudança (modo real) */
export const POL: Record<string, { pol: string; what: Bi }> = {
  agua: { pol: 'HH', what: ['HH: sinal de água e solo', 'HH: water and soil signal'] },
  solo: { pol: 'HH', what: ['HH: sinal de água e solo', 'HH: water and soil signal'] },
  arvore: { pol: 'HV', what: ['HV: sinal de volume da vegetação', 'HV: vegetation volume signal'] },
  fogo: { pol: 'HV', what: ['HV: sinal de volume da vegetação', 'HV: vegetation volume signal'] },
  vento: { pol: '—', what: ['Dado de tempo (não é radar)', 'Weather data (not radar)'] },
}

/** Link para imagem óptica de contexto (NASA Worldview) na área e data */
export function worldviewUrl(b: { oeste: number; leste: number; norte: number; sul: number }, date?: string) {
  const v = [b.oeste, b.sul, b.leste, b.norte].map(n => n.toFixed(3)).join(',')
  const l = 'Reference_Labels_15m,Coastlines_15m,VIIRS_NOAA20_CorrectedReflectance_TrueColor,MODIS_Terra_CorrectedReflectance_TrueColor'
  return `https://worldview.earthdata.nasa.gov/?v=${v}&l=${l}${date ? `&t=${date}` : ''}`
}

export const SCI = {
  intro: {
    t: ['Entenda o radar', 'Understand the radar'] as Bi,
    d: ['Como o NISAR enxerga a Terra, por que ele vê o que satélites comuns não veem e como o A.R.K.O transforma o sinal em mudanças no mapa.', 'How NISAR sees the Earth, why it sees what regular satellites cannot, and how A.R.K.O turns the signal into changes on the map.'] as Bi,
  },
  facts: [
    [['Missão', 'Mission'], ['NASA + ISRO (Índia)', 'NASA + ISRO (India)']],
    [['Radar', 'Radar'], ['Banda L (24 cm) e banda S (10 cm)', 'L-band (24 cm) and S-band (10 cm)']],
    [['Revisita', 'Revisit'], ['A cada ~12 dias', 'About every 12 days']],
    [['Produto usado', 'Product used'], ['GCOV banda L · HH e HV', 'GCOV L-band · HH and HV']],
  ] as [Bi, Bi][],
  active: {
    t: ['Radar é sensoriamento ativo', 'Radar is active remote sensing'] as Bi,
    a: ['Satélites ópticos são passivos: dependem da luz do Sol refletida. À noite ou com nuvens, não veem o chão.', 'Optical satellites are passive: they depend on reflected sunlight. At night or under clouds, they cannot see the ground.'] as Bi,
    b: ['O NISAR é ativo: ele mesmo envia pulsos de micro-ondas e mede o eco. Funciona de dia, de noite e através das nuvens, justamente durante enchentes e queimadas.', 'NISAR is active: it sends its own microwave pulses and measures the echo. It works by day, by night and through clouds, exactly during floods and fires.'] as Bi,
  },
  senses: [
    ['LuMountain', ['Rugosidade e forma', 'Roughness and shape'], ['Superfícies ásperas, como floresta e cidade, devolvem mais sinal. Água parada é lisa como um espelho e devolve pouco, por isso aparece escura.', 'Rough surfaces, like forest and cities, return more signal. Still water is smooth as a mirror and returns little, so it looks dark.']],
    ['LuDroplets', ['Água e umidade', 'Water and moisture'], ['A água muda o “constante dielétrico” do solo e das plantas. O radar percebe solo molhado, áreas alagadas e umidade do solo.', 'Water changes the “dielectric constant” of soil and plants. Radar senses wet soil, flooded areas and soil moisture.']],
    ['LuMove', ['Movimento de centímetros', 'Centimeter-scale motion'], ['Comparando a fase de duas passagens (InSAR), dá para medir o chão subindo ou descendo, como em terremotos e afundamento do solo.', 'Comparing the phase of two passes (InSAR) measures the ground rising or sinking, as in earthquakes and subsidence.']],
  ] as [string, Bi, Bi][],
  pols: [
    ['HH', ['Envia horizontal, recebe horizontal', 'Sends horizontal, receives horizontal'], ['Muito sensível a água e solo. Água parada fica muito escura; água entre plantas (arroz, floresta alagada) fica muito clara.', 'Very sensitive to water and soil. Still water looks very dark; water among plants (rice, flooded forest) looks very bright.'], ['No A.R.K.O: água nova e água que recuou', 'In A.R.K.O: new water and water receded']],
    ['HV', ['Envia horizontal, recebe vertical', 'Sends horizontal, receives vertical'], ['O sinal “gira” quando bate em muitos galhos e folhas. Mede o volume da vegetação: floresta = alto; chão limpo = baixo.', 'The signal “rotates” when it hits many branches and leaves. It measures vegetation volume: forest = high; bare ground = low.'], ['No A.R.K.O: floresta perdida', 'In A.R.K.O: forest lost']],
  ] as [string, Bi, Bi, Bi][],
  rules: [
    [['Água nova', 'New water'], ['HH fica abaixo de −16 dB e cai mais de 4 dB', 'HH goes below −16 dB and drops more than 4 dB'], ['A superfície ficou lisa como água parada.', 'The surface became smooth like still water.']],
    [['Água que recuou', 'Water receded'], ['O contrário: HH sai de abaixo de −16 dB e sobe mais de 4 dB', 'The reverse: HH leaves below −16 dB and rises more than 4 dB'], ['Onde havia água, voltou a ter chão ou planta.', 'Where there was water, there is ground or plants again.']],
    [['Floresta perdida', 'Forest lost'], ['HV cai mais de 2,5 dB', 'HV drops more than 2.5 dB'], ['Menos galhos e folhas devolvendo o sinal.', 'Fewer branches and leaves returning the signal.']],
  ] as [Bi, Bi, Bi][],
  limits: [
    ['Dados provisórios: os dados calibrados do NISAR foram liberados em 20 de julho de 2026, para observações a partir de 17 de junho de 2026 (coleção “PROVISIONAL”, ainda em validação).', 'Provisional data: calibrated NISAR data were released on 20 July 2026, for observations from 17 June 2026 (“PROVISIONAL” collection, still being validated).'],
    ['Usamos a grade de 80 m por pixel (frequência B do GCOV) e só contamos focos com pelo menos 40 pixels (≈ 0,26 km²): mudanças menores não aparecem.', 'We use the 80 m grid (GCOV frequency B) and only count detections of at least 40 pixels (≈ 0.26 km²): smaller changes do not show.'],
    ['Chuva, vento e orvalho mudam o sinal por algumas horas e podem gerar falsos focos.', 'Rain, wind and dew change the signal for a few hours and can create false detections.'],
    ['Mostramos no máximo 25 focos por tipo e por passagem, os maiores.', 'We show at most 25 detections per type and per pass, the largest ones.'],
    ['O radar mede a mudança da superfície, não a causa: as possíveis causas vêm da física do sinal e devem ser confirmadas com imagem óptica (botão Worldview) ou com quem está no local.', 'Radar measures the surface change, not its cause: possible causes come from the physics of the signal and must be confirmed with an optical image (Worldview button) or people on site.'],
  ] as Bi[],
  future: [
    ['LuSprout', ['Agricultura', 'Agriculture'], ['Umidade do solo e crescimento das lavouras a cada 12 dias, para planejar irrigação e prever safras.', 'Soil moisture and crop growth every 12 days, to plan irrigation and forecast harvests.']],
    ['LuActivity', ['Terremotos e vulcões', 'Earthquakes and volcanoes'], ['Medir com InSAR quanto o chão se moveu, em centímetros.', 'Measure with InSAR how much the ground moved, in centimeters.']],
    ['LuBuilding2', ['Cidades e infraestrutura', 'Cities and infrastructure'], ['Afundamento do solo sob prédios, barragens e estradas.', 'Ground subsidence under buildings, dams and roads.']],
    ['LuSnowflake', ['Gelo e geleiras', 'Ice and glaciers'], ['Velocidade das geleiras e gelo marinho, ligados ao nível do mar.', 'Glacier speed and sea ice, linked to sea level.']],
    ['LuTrees', ['Biomassa florestal', 'Forest biomass'], ['Quanto carbono as florestas guardam e perdem.', 'How much carbon forests store and lose.']],
    ['LuWaves', ['Áreas úmidas', 'Wetlands'], ['Pantanal, várzeas e manguezais se expandindo e encolhendo.', 'Wetlands, floodplains and mangroves growing and shrinking.']],
  ] as [string, Bi, Bi][],
  sources: [
    ['NISAR · NASA JPL', 'https://nisar.jpl.nasa.gov/'],
    ['ASF DAAC · NISAR', 'https://asf.alaska.edu/datasets/daac/nisar/'],
    ['NASA Earthdata', 'https://www.earthdata.nasa.gov/'],
    ['NASA Worldview', 'https://worldview.earthdata.nasa.gov/'],
  ] as [string, string][],
}
