// Quem pode usar o A.R.K.O Rios e para quê (usado no primeiro acesso e em Aplicações futuras)
type Bi = [string, string]
export interface Uso { ic: string; quem: Bi; para: Bi; exemplo: Bi }

export const USOS: Uso[] = [
  {
    ic: 'agua', quem: ['Companhias de água e saneamento', 'Water and sanitation utilities'],
    para: ['Saber se a água que chega à captação está piorando, e por quê.', 'Know whether the water reaching the intake is getting worse, and why.'],
    exemplo: ['No Histórico do rio, a turbidez do Tapajós voltou a subir depois de 2020: a companhia reforça o tratamento e pede análise de mercúrio antes da próxima seca.',
      'In River history, Tapajós turbidity rose again after 2020: the utility steps up treatment and orders mercury tests before the next dry season.'],
  },
  {
    ic: 'alvo', quem: ['Órgãos ambientais e Ministério Público', 'Environment agencies and prosecutors'],
    para: ['Achar onde e quando a margem e a água começaram a mudar.', 'Find where and when the banks and the water started to change.'],
    exemplo: ['A curva de solo exposto e as fotos década a década mostram o ano em que a margem começou a ser aberta: vira prova para fiscalizar.',
      'The bare-soil curve and decade-by-decade photos show the year the banks started being cleared: evidence for enforcement.'],
  },
  {
    ic: 'casa', quem: ['Prefeituras e comitês de bacia', 'Cities and river basin committees'],
    para: ['Planejar a proteção da água para os próximos anos.', 'Plan water protection for the coming years.'],
    exemplo: ['A linha “se nada mudar” mostra onde a mata ciliar chega em 2030: o comitê escolhe os trechos para replantar primeiro.',
      'The “if nothing changes” line shows where riverside forest will be by 2030: the committee picks which stretches to replant first.'],
  },
  {
    ic: 'grafico', quem: ['Professores e estudantes', 'Teachers and students'],
    para: ['Estudar 40 anos de mudança no rio da própria cidade.', 'Study 40 years of change in their own city’s river.'],
    exemplo: ['A turma compara a foto de 1985 com a de 2025 e descobre por que a água do rio mudou de cor.',
      'The class compares the 1985 photo with the 2025 one and finds out why the river changed colour.'],
  },
  {
    ic: 'arvore', quem: ['Comunidades ribeirinhas e indígenas', 'Riverside and Indigenous communities'],
    para: ['Ter provas abertas do que está acontecendo com o rio de que dependem.', 'Have open evidence of what is happening to the river they depend on.'],
    exemplo: ['Rio abaixo do garimpo, a comunidade mostra a série de turbidez e as fotos para pedir proteção e água segura.',
      'Downstream of mining, the community shows the turbidity series and photos to demand protection and safe water.'],
  },
  {
    ic: 'radar', quem: ['Pesquisadores e ONGs', 'Researchers and NGOs'],
    para: ['Usar dados abertos e métodos reproduzíveis.', 'Use open data and reproducible methods.'],
    exemplo: ['Cada número vem de imagens Landsat e SWOT listadas, e os scripts estão no código aberto para refazer as contas.',
      'Each number comes from listed Landsat and SWOT images, and the scripts are open source to redo the math.'],
  },
]
