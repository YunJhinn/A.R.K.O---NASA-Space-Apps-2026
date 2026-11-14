// Quem pode usar o A.R.K.O e para quê (usado no primeiro acesso e em Aplicações futuras)
type Bi = [string, string]
export interface Uso { ic: string; quem: Bi; para: Bi; exemplo: Bi }

export const USOS: Uso[] = [
  {
    ic: 'sino', quem: ['Defesa Civil e governos', 'Civil defense and governments'],
    para: ['Prever e responder a enchentes, deslizamentos e incêndios.', 'Forecast and respond to floods, landslides and fires.'],
    exemplo: ['A aba Previsão mostra “Alagamento pode se espalhar” perto de um rio: a equipe avisa os moradores das áreas baixas e prepara abrigos antes da água chegar.',
      'The Forecast tab shows “Flooding may spread” near a river: the team warns low-lying residents and prepares shelters before the water arrives.'],
  },
  {
    ic: 'fogo', quem: ['Bombeiros e brigadas', 'Firefighters and brigades'],
    para: ['Saber onde está o fogo que pode fugir do controle.', 'Know where the fire that can get out of control is.'],
    exemplo: ['Só as “queimadas de risco” viram alerta, com o local exato e o link do mapa de ruas para mandar a equipe.',
      'Only “risky fires” become alerts, with the exact spot and a street-map link to send the team.'],
  },
  {
    ic: 'grafico', quem: ['Professores e estudantes', 'Teachers and students'],
    para: ['Estudar como uma região mudou e o que causou a mudança.', 'Study how a region changed and what caused it.'],
    exemplo: ['Em “Comparar períodos”, a turma vê, passagem a passagem, quanto de vegetação sumiu no Sul de junho a outubro e a causa provável de cada mudança.',
      'In “Compare periods”, the class sees, pass by pass, how much vegetation disappeared in Southern Brazil from June to October and the likely cause of each change.'],
  },
  {
    ic: 'arvore', quem: ['Agricultores', 'Farmers'],
    para: ['Acompanhar alagamento de lavouras, fogo vizinho e perigo de deslizamento.', 'Follow flooded fields, nearby fire and landslide danger.'],
    exemplo: ['Um produtor do vale do Taquari vê se a água nova está perto das lavouras e se há queimada de risco na vizinhança.',
      'A farmer in the Taquari valley sees whether new water is near the fields and whether there is a risky fire nearby.'],
  },
  {
    ic: 'casa', quem: ['Moradores e comunidades', 'Residents and communities'],
    para: ['Saber se há perigo perto de casa, em linguagem simples.', 'Know if there is danger near home, in plain language.'],
    exemplo: ['A faixa do topo responde em uma frase: há perigo agora? Onde? O que fazer?',
      'The top banner answers in one sentence: is there danger now? Where? What to do?'],
  },
  {
    ic: 'radar', quem: ['Pesquisadores e ONGs', 'Researchers and NGOs'],
    para: ['Usar dados abertos e hipóteses com provas para estudos e fiscalização.', 'Use open data and evidence-backed hypotheses for studies and monitoring.'],
    exemplo: ['Cada foco traz os valores do radar (HH e HV antes e depois) e o código é aberto para reproduzir os resultados.',
      'Each detection carries the radar values (HH and HV before and after), and the code is open to reproduce the results.'],
  },
]
