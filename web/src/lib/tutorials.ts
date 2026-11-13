// Conteúdo dos tutoriais (PT e EN lado a lado). Cada tema ensina uma parte do sistema.
export type TutAction = 'inicio' | 'map' | 'alerts' | 'comparar' | 'celular' | 'ob' | 'search' | 'regions' | 'futuro'

export interface TutText { t: string; d: string; steps: string[]; tip: string; ex: string }
export interface Tut { id: string; ic: string; group: 'start' | 'explore' | 'analyze' | 'more'; act?: TutAction; pt: TutText; en: TutText }

export const TUT_GROUPS: Record<Tut['group'], [string, string]> = {
  start: ['Primeiros passos', 'Getting started'],
  explore: ['Explorar o mapa', 'Exploring the map'],
  analyze: ['Analisar mudanças', 'Analyzing change'],
  more: ['Mais recursos', 'More features'],
}

export const TUTORIALS: Tut[] = [
  {
    id: 'visao', ic: 'radar', group: 'start', act: 'ob',
    pt: {
      t: 'Visão geral do A.R.K.O',
      d: 'O A.R.K.O lê o radar do satélite NISAR (NASA e ISRO), que enxerga o chão de dia, de noite e através das nuvens, e transforma esse sinal em alertas, mapas e comparações fáceis de entender.',
      steps: [
        'A tela Início responde primeiro “o que mudou?”: o painel azul no topo resume água nova, floresta perdida, água que recuou e área queimada.',
        'Logo abaixo ficam o Mapa de mudanças (onde aconteceu) e o painel Alerta de riscos (o que precisa de atenção).',
        'O menu lateral leva às outras partes: Comparar períodos, Versão celular, Tutoriais e Como funciona.',
        'Tudo na tela muda junto: ao trocar região, período ou fonte de dados, mapa, números e alertas se atualizam.',
      ],
      tip: 'Clique em “Como funciona” no menu para rever a apresentação rápida a qualquer momento.',
      ex: 'Uma técnica da Defesa Civil abre o A.R.K.O de manhã: olha o painel azul para ver o resumo, confere os alertas laranja e, se algo for alto risco, clica em “Ver no mapa”.',
    },
    en: {
      t: 'A.R.K.O overview',
      d: 'A.R.K.O reads the radar of the NISAR satellite (NASA and ISRO), which sees the ground by day, by night and through clouds, and turns that signal into alerts, maps and comparisons that are easy to understand.',
      steps: [
        'The Home screen answers “what changed?” first: the blue panel at the top sums up new water, forest lost, water receded and burned area.',
        'Below it are the Change map (where it happened) and the Risk alert panel (what needs attention).',
        'The side menu leads to the other parts: Compare periods, Mobile version, Tutorials and How it works.',
        'Everything moves together: when you change region, period or data source, the map, numbers and alerts update.',
      ],
      tip: 'Click “How it works” in the menu to replay the quick introduction at any time.',
      ex: 'A civil-defense officer opens A.R.K.O in the morning: checks the blue panel for the summary, reviews the orange alerts and, if something is high risk, clicks “See on map”.',
    },
  },
  {
    id: 'dados', ic: 'camadas', group: 'start', act: 'inicio',
    pt: {
      t: 'Exemplo ou NISAR real',
      d: 'O app tem duas fontes de dados. Exemplo usa dados ilustrativos para aprender a usar todas as funções. NISAR real mostra o que o satélite detectou de verdade.',
      steps: [
        'No menu lateral, em DADOS, escolha Exemplo ou NISAR real. Também dá para trocar no mapa, pelo seletor “Dados”.',
        'Exemplo tem duas regiões (Amazônia e Sul do Brasil), com queimadas, enchentes, previsões e um ano de histórico.',
        'NISAR real tem três regiões: rio Madeira (AM), Porto Alegre e vale do Taquari (RS) e Daca e rio Jamuna (Bangladesh).',
        'Os dados reais são atualizados automaticamente todos os dias: quando o NISAR passa de novo sobre uma região, a nova passagem entra na linha do tempo.',
      ],
      tip: 'No modo real, fogo e previsões do tempo ainda não são medidos. Esses números aparecem como “—”.',
      ex: 'Para aprender, comece no Exemplo e teste tudo sem medo. Depois troque para NISAR real e escolha Sul do Brasil para ver o que o satélite achou em Porto Alegre.',
    },
    en: {
      t: 'Example or real NISAR',
      d: 'The app has two data sources. Example uses illustrative data so you can learn every feature. Real NISAR shows what the satellite actually detected.',
      steps: [
        'In the side menu, under DATA, pick Example or Real NISAR. You can also switch on the map, with the “Data” selector.',
        'Example has two regions (Amazon and Southern Brazil), with fires, floods, forecasts and one year of history.',
        'Real NISAR has three regions: Madeira River (AM), Porto Alegre and the Taquari valley (RS), and Dhaka and the Jamuna river (Bangladesh).',
        'Real data updates automatically every day: when NISAR passes over a region again, the new pass joins the timeline.',
      ],
      tip: 'In real mode, fire and weather forecasts are not measured yet. Those numbers show as “—”.',
      ex: 'To learn, start with Example and try everything freely. Then switch to Real NISAR and pick Southern Brazil to see what the satellite found in Porto Alegre.',
    },
  },
  {
    id: 'regioes', ic: 'busca', group: 'start', act: 'search',
    pt: {
      t: 'Escolher e buscar regiões',
      d: 'Você pode trocar de região pelo menu ou buscar qualquer cidade, rio ou lugar do mundo pela lupa.',
      steps: [
        'No menu lateral, em REGIÃO, escolha a região. No modo real é uma lista; no modo Exemplo são dois botões.',
        'Para buscar, clique na lupa (“Buscar cidade, rio ou região”) no canto superior direito do Início ou de Comparar períodos.',
        'Digite pelo menos 2 letras e escolha um resultado. Se o lugar estiver dentro de uma região com dados, o app abre essa região e marca o ponto no mapa com um alfinete.',
        'Se o lugar estiver fora das áreas com dados, o app avisa e oferece botões para abrir as regiões disponíveis.',
        'Para tirar o alfinete do mapa, clique no × ao lado do nome do lugar.',
      ],
      tip: 'A busca usa o OpenStreetMap, então funciona com nomes em português, inglês e no idioma local (ex.: “Daca” ou “Dhaka”).',
      ex: 'Você mora em Canoas (RS): digite “Canoas” na lupa, escolha o resultado e o mapa abre no Sul do Brasil com um alfinete em cima da sua cidade.',
    },
    en: {
      t: 'Choosing and searching regions',
      d: 'You can switch regions from the menu or search any city, river or place in the world with the magnifier.',
      steps: [
        'In the side menu, under REGION, pick the region. In real mode it is a list; in Example mode it is two buttons.',
        'To search, click the magnifier (“Search city, river or region”) at the top right of Home or Compare periods.',
        'Type at least 2 letters and pick a result. If the place is inside a region with data, the app opens that region and marks the spot on the map with a pin.',
        'If the place is outside the areas with data, the app says so and offers buttons to open the available regions.',
        'To remove the pin from the map, click the × next to the place name.',
      ],
      tip: 'Search uses OpenStreetMap, so it works with names in Portuguese, English and the local language (e.g. “Daca” or “Dhaka”).',
      ex: 'You live in Canoas (RS): type “Canoas” in the search box, pick the result and the map opens on Southern Brazil with a pin on your city.',
    },
  },
  {
    id: 'favoritos', ic: 'relogio', group: 'start', act: 'regions',
    pt: {
      t: 'Favoritas e recentes',
      d: 'Guarde as regiões que você acompanha e volte para elas com um clique.',
      steps: [
        'No painel azul do Início, clique em “☆ Favoritar região”. A estrela fica cheia e o botão vira “Favoritada”.',
        'No menu lateral, em MINHAS REGIÕES, a aba ★ Favoritas lista o que você guardou.',
        'A aba 🕘 Recentes guarda sozinha as últimas regiões e lugares que você abriu ou buscou.',
        'Clique em um item da lista para abrir a região. Clique na estrela ao lado dele para favoritar ou desfavoritar.',
      ],
      tip: 'As listas ficam salvas no seu navegador: continuam lá quando você fecha e abre o site de novo no mesmo computador.',
      ex: 'Um pesquisador acompanha Bangladesh e o RS: favorita os dois e, todo dia, troca entre eles com um clique em MINHAS REGIÕES.',
    },
    en: {
      t: 'Favorites and recent',
      d: 'Save the regions you follow and get back to them in one click.',
      steps: [
        'In the blue panel on Home, click “☆ Save region”. The star fills in and the button turns into “Saved”.',
        'In the side menu, under MY REGIONS, the ★ Favorites tab lists what you saved.',
        'The 🕘 Recent tab automatically keeps the last regions and places you opened or searched.',
        'Click an item to open the region. Click the star next to it to save or unsave it.',
      ],
      tip: 'The lists are stored in your browser: they stay there when you close and reopen the site on the same computer.',
      ex: 'A researcher follows Bangladesh and RS: saves both and switches between them every day with one click under MY REGIONS.',
    },
  },
  {
    id: 'periodo', ic: 'cal', group: 'explore', act: 'inicio',
    pt: {
      t: 'Período e datas',
      d: 'Escolha o intervalo de tempo que quer analisar. Painel, mapa e alertas mostram só o que aconteceu nesse intervalo.',
      steps: [
        'Na barra Período, escolha 7 dias, 30 dias, 3 meses, 6 meses ou 1 ano.',
        'Para datas exatas, clique no botão escuro com as datas, à direita, e escolha início e fim no calendário.',
        'Deixe “Comparar com” ligado para ver, nos cartões do painel, a comparação com o período anterior ou com a passagem anterior do NISAR.',
        'No modo NISAR real, o período usa as passagens do satélite que caem dentro do intervalo. Se nenhuma passagem cair nele, o app avisa para escolher um período maior.',
      ],
      tip: 'O NISAR passa sobre cada região a cada ~12 dias. Para dados reais, 30 dias ou mais costuma dar o melhor resultado.',
      ex: 'Quer saber o que mudou no último mês? Clique em 30 dias. Quer ver só a semana da enchente? Abra o calendário e escolha as datas exatas.',
    },
    en: {
      t: 'Period and dates',
      d: 'Pick the time span you want to analyze. Panel, map and alerts show only what happened in it.',
      steps: [
        'In the Period bar, pick 7 days, 30 days, 3 months, 6 months or 1 year.',
        'For exact dates, click the dark button with the dates on the right and pick start and end in the calendar.',
        'Keep “Compare with” on to see, on the panel cards, the comparison with the previous period or the previous NISAR pass.',
        'In Real NISAR mode, the period uses the satellite passes that fall inside it. If no pass falls inside, the app asks you to pick a longer period.',
      ],
      tip: 'NISAR passes over each region about every 12 days. For real data, 30 days or more usually works best.',
      ex: 'Want to know what changed last month? Click 30 days. Want only the flood week? Open the calendar and pick the exact dates.',
    },
  },
  {
    id: 'linha', ic: 'play', group: 'explore', act: 'map',
    pt: {
      t: 'Linha do tempo',
      d: 'A linha do tempo fica logo abaixo do mapa. Cada barra é uma passagem do NISAR (ou uma semana, no modo Exemplo), e a altura mostra quantos focos foram detectados.',
      steps: [
        'Escolha o modo no topo da linha do tempo: “Uma data” mostra só uma passagem; “Período” junta várias.',
        'No modo Período, clique na data inicial e depois na final. Também dá para arrastar o mouse sobre as barras.',
        'Os seletores De e Até, embaixo, fazem a mesma coisa com mais precisão.',
        'Aperte ▶ para animar: em “Uma data” ele passa de data em data; em “Período” ele vai somando os focos até o fim.',
        'Clique em “Ver tudo” para voltar a ver todas as passagens.',
      ],
      tip: 'Use “Uma data” para achar quando algo apareceu e “Período” para ver tudo o que aconteceu num intervalo.',
      ex: 'Para descobrir quando a água subiu em Porto Alegre, escolha “Uma data” e aperte ▶: as passagens vão uma a uma e você vê em qual delas os ícones de água aparecem.',
    },
    en: {
      t: 'Timeline',
      d: 'The timeline sits right below the map. Each bar is a NISAR pass (or a week, in Example mode), and its height shows how many detections were found.',
      steps: [
        'Pick the mode at the top of the timeline: “One date” shows a single pass; “Period” joins several.',
        'In Period mode, click the start date and then the end date. You can also drag the mouse over the bars.',
        'The From and To selectors below do the same with more precision.',
        'Press ▶ to animate: in “One date” it steps date by date; in “Period” it keeps adding detections until the end.',
        'Click “Show all” to see all passes again.',
      ],
      tip: 'Use “One date” to find when something appeared and “Period” to see everything that happened in a span.',
      ex: 'To find out when water rose in Porto Alegre, pick “One date” and press ▶: passes go one by one and you see in which one the water icons appear.',
    },
  },
  {
    id: 'mapa', ic: 'mapa', group: 'explore', act: 'map',
    pt: {
      t: 'Mapa de mudanças',
      d: 'O mapa mostra onde cada mudança aconteceu. Cada ícone é um foco: um ponto onde o radar viu o chão mudar.',
      steps: [
        'Os ícones indicam o tipo: casinha com água = água nova (enchente), árvore cortada = floresta perdida, chão rachado = água que recuou, fogueira = queimada.',
        'Use os botões de tipo acima do mapa (Todos, Queimadas, Água nova, Desmatamento, Água que recuou) para mostrar só um tipo. O número em cada botão é a quantidade de focos.',
        'Clique em um foco para abrir o cartão com o que mudou, quando, o tamanho da área e o grau de confiança.',
        'Use + e − para dar zoom, o alvo para centralizar e o botão LEGENDA, no canto do mapa, para ver o significado de cada ícone.',
        'Em “Colorir por”, escolha Tipo (cor de cada mudança) ou Mês (cor da data em que aconteceu).',
      ],
      tip: 'No modo Exemplo, “Mostrar previsões” desenha também o que pode acontecer nos próximos dias, com contorno tracejado.',
      ex: 'Só quer ver desmatamento? Clique em Desmatamento acima do mapa e depois em um ícone de árvore cortada para ver a área perdida e a data.',
    },
    en: {
      t: 'Change map',
      d: 'The map shows where each change happened. Each icon is a detection: a spot where the radar saw the ground change.',
      steps: [
        'Icons show the type: house with water = new water (flood), cut tree = forest lost, cracked ground = water receded, campfire = fire.',
        'Use the type buttons above the map (All, Fires, New water, Deforestation, Water receded) to show one type. The number on each button is the detection count.',
        'Click a detection to open its card: what changed, when, the area size and the confidence level.',
        'Use + and − to zoom, the target to recenter, and the LEGEND button in the map corner to see what each icon means.',
        'In “Color by”, pick Type (a color per change) or Month (a color per date).',
      ],
      tip: 'In Example mode, “Show forecasts” also draws what may happen in the next days, with a dashed outline.',
      ex: 'Only want deforestation? Click Deforestation above the map, then a cut-tree icon to see the area lost and the date.',
    },
  },
  {
    id: 'alertas', ic: 'sino', group: 'analyze', act: 'alerts',
    pt: {
      t: 'Alertas de riscos',
      d: 'O painel laranja à direita do mapa junta os focos mais importantes em alertas fáceis de ler, do mais urgente para o menos urgente.',
      steps: [
        'No topo do painel, os contadores Alto, Médio e Baixo mostram quantos alertas há de cada nível. Clique em um nível para filtrar.',
        'Cada alerta diz o que aconteceu, perto de qual cidade, a área somada e a data da detecção.',
        'A etiqueta colorida (ex.: ALTO · 98%) mostra o nível de risco e a confiança da detecção.',
        'Clique em “Ver no mapa” para o mapa ir direto até o lugar do alerta.',
        'O sino no topo da tela e o número vermelho em Alertas, no menu, mostram quantos alertas estão ativos.',
      ],
      tip: 'Alertas de “Água que recuou” perto de rios grandes costumam ser margem exposta na seca, não necessariamente dano.',
      ex: 'Um alerta ALTO diz “Água nova em vários pontos a 35 km de Venâncio Aires”: clique em “Ver no mapa” e o mapa vai direto para o lugar.',
    },
    en: {
      t: 'Risk alerts',
      d: 'The orange panel to the right of the map groups the most important detections into easy-to-read alerts, from most to least urgent.',
      steps: [
        'At the top of the panel, the High, Medium and Low counters show how many alerts each level has. Click a level to filter.',
        'Each alert says what happened, near which city, the combined area and the detection date.',
        'The colored tag (e.g. HIGH · 98%) shows the risk level and the detection confidence.',
        'Click “See on map” to jump the map straight to the alert location.',
        'The bell at the top of the screen and the red number on Alerts in the menu show how many alerts are active.',
      ],
      tip: '“Water receded” alerts near large rivers are often riverbanks exposed by drought, not necessarily damage.',
      ex: 'A HIGH alert says “New water in several spots 35 km from Venâncio Aires”: click “See on map” and the map jumps straight there.',
    },
  },
  {
    id: 'comparar', ic: 'grafico', group: 'analyze', act: 'comparar',
    pt: {
      t: 'Comparar períodos',
      d: 'Coloque dois momentos lado a lado no mesmo mapa e veja exatamente o que mudou entre eles.',
      steps: [
        'Abra “Comparar períodos” no menu lateral.',
        'Escolha o Tipo de mudança, o Período A (antes) e o Período B (depois). No modo real, cada período é uma passagem do NISAR.',
        'Em Região, escolha qualquer região real ou de exemplo, ou use a lupa para buscar um lugar.',
        'Arraste a barra azul embaixo do mapa: à esquerda aparece A, à direita aparece B.',
        'À direita, o resumo em uma frase, a tabela Focos por tipo e o Grau de mudança explicam a diferença. “Causa provável” sugere o que pode ter acontecido.',
      ],
      tip: 'Use “Compartilhar imagem” para levar a comparação para uma apresentação ou relatório.',
      ex: 'Uma professora mostra à turma o antes e depois em Bangladesh: escolhe Bangladesh em Região, Água nova em Tipo e arrasta a barra azul devagar enquanto explica.',
    },
    en: {
      t: 'Compare periods',
      d: 'Put two moments side by side on the same map and see exactly what changed between them.',
      steps: [
        'Open “Compare periods” in the side menu.',
        'Pick the Type of change, Period A (before) and Period B (after). In real mode, each period is a NISAR pass.',
        'Under Region, pick any real or example region, or use the magnifier to search a place.',
        'Drag the blue bar below the map: A shows on the left, B on the right.',
        'On the right, the one-sentence summary, the Detections by type table and the Degree of change explain the difference. “Likely cause” suggests what may have happened.',
      ],
      tip: 'Use “Share image” to take the comparison into a presentation or report.',
      ex: 'A teacher shows the class before and after in Bangladesh: picks Bangladesh under Region, New water under Type and slowly drags the blue bar while explaining.',
    },
  },
  {
    id: 'ciencia', ic: 'radar', group: 'analyze', act: 'map',
    pt: {
      t: 'Causas prováveis, hipóteses e polarizações',
      d: 'Entenda por que algo mudou: hipóteses tiradas dos dados reais, o contexto do lugar com fontes e qual sinal do radar mostrou a mudança.',
      steps: [
        'Use NISAR real e, no cabeçalho do Mapa de mudanças, clique em “🔎 Causas prováveis”.',
        'No topo da janela fica a HIPÓTESE da região: o que provavelmente causou as mudanças, os dados reais que apoiam essa ideia e o contexto do lugar com fontes.',
        'Logo abaixo, a tabela mostra quantos focos de cada tipo apareceram em cada passagem do satélite, com uma explicação “Em palavras simples”.',
        'Clique em um foco no mapa e em “Causas prováveis” no cartão: no topo aparece a “Hipótese para este foco”, calculada com o histórico daquele ponto.',
        'Clique em “📡 Polarização” no cartão para ver qual sinal (HH ou HV) mostrou a mudança e quantas vezes o eco mudou.',
        'Use “Conferir qual foi na imagem óptica (NASA Worldview)” para confirmar a hipótese numa foto de satélite comum.',
      ],
      tip: 'As hipóteses são recalculadas a cada nova passagem do satélite, usando todo o histórico do lugar. São hipóteses, não conclusões: confirme na imagem óptica.',
      ex: 'Em Bangladesh, um foco de água que recuou em 16 out mostra “Fim de um alagamento que começou em 29 ago”, porque o radar viu água nova naquele mesmo ponto em 29 ago.',
    },
    en: {
      t: 'Likely causes, hypotheses and polarizations',
      d: 'Understand why something changed: hypotheses drawn from real data, the place’s context with sources, and which radar signal showed the change.',
      steps: [
        'Use Real NISAR and, in the Change map header, click “🔎 Likely causes”.',
        'At the top of the window is the region’s HYPOTHESIS: what probably caused the changes, the real data supporting it and the place’s context with sources.',
        'Below, the table shows how many detections of each type appeared in each satellite pass, with an “In plain words” explanation.',
        'Click a detection on the map and “Likely causes” on its card: the top shows the “Hypothesis for this focus”, built from that spot’s history.',
        'Click “📡 Polarization” on the card to see which signal (HH or HV) showed the change and how many times the echo changed.',
        'Use “Check which one in the optical image (NASA Worldview)” to confirm the hypothesis in a regular satellite photo.',
      ],
      tip: 'Hypotheses are recalculated with every new satellite pass, using the place’s whole history. They are hypotheses, not conclusions: confirm in the optical image.',
      ex: 'In Bangladesh, a receded-water detection on 16 Oct shows “End of a flood that began on 29 Aug”, because radar saw new water at that same spot on 29 Aug.',
    },
  },
  {
    id: 'futuro', ic: 'radar', group: 'more', act: 'futuro',
    pt: {
      t: 'Aplicações futuras',
      d: 'O que mais o NISAR consegue medir e para onde o A.R.K.O pode crescer.',
      steps: [
        'No menu lateral, clique em “Aplicações futuras”.',
        'No topo, veja os dados da missão NISAR: agências, tipo de radar, revisita e o produto que usamos.',
        'Os cartões mostram usos futuros: agricultura, terremotos, cidades, gelo, biomassa e áreas úmidas.',
        'Embaixo estão os próximos passos do A.R.K.O e os limites honestos dos dados de hoje.',
      ],
      tip: 'Os links de fontes levam aos sites oficiais do NISAR, do ASF DAAC, do Earthdata e do Worldview.',
      ex: 'Um agricultor poderia receber, a cada 12 dias, um aviso de solo muito seco na sua região, mesmo com o céu nublado.',
    },
    en: {
      t: 'Future applications',
      d: 'What else NISAR can measure and where A.R.K.O can grow.',
      steps: [
        'In the side menu, click “Future applications”.',
        'At the top, see the NISAR mission facts: agencies, radar type, revisit and the product we use.',
        'The cards show future uses: agriculture, earthquakes, cities, ice, biomass and wetlands.',
        'Below are A.R.K.O’s next steps and the honest limits of today’s data.',
      ],
      tip: 'The source links lead to the official NISAR, ASF DAAC, Earthdata and Worldview sites.',
      ex: 'A farmer could get, every 12 days, a very-dry-soil warning for their area, even under cloudy skies.',
    },
  },
  {
    id: 'celular', ic: 'celular', group: 'more', act: 'celular',
    pt: {
      t: 'Versão celular',
      d: 'Uma versão pensada para quem está em campo: alertas primeiro, botões grandes e leve para internet fraca.',
      steps: [
        'Abra “Versão celular” no menu lateral para ver o protótipo do app no celular.',
        'Use as abas na parte de baixo do celular (Alertas, Mapa, Comparar e Sobre) para trocar de tela.',
        'Toque em um alerta para abrir o mapa já focado nele.',
        'Ao lado do celular estão as decisões de design e o porquê de cada uma.',
      ],
      tip: 'Cores, ícones e níveis de risco são iguais no celular e no computador: quem aprende em um já sabe usar o outro.',
      ex: 'Em campo, o agente abre a versão celular, vê o alerta mais urgente no topo e toca nele para saber exatamente onde ir.',
    },
    en: {
      t: 'Mobile version',
      d: 'A version made for people in the field: alerts first, large buttons, and light on weak connections.',
      steps: [
        'Open “Mobile version” in the side menu to see the phone app prototype.',
        'Use the tabs at the bottom of the phone (Alerts, Map, Compare and About) to switch screens.',
        'Tap an alert to open the map focused on it.',
        'Next to the phone are the design decisions and the reason for each one.',
      ],
      tip: 'Colors, icons and risk levels are the same on phone and desktop: learn one and you know the other.',
      ex: 'In the field, the agent opens the mobile version, sees the most urgent alert at the top and taps it to know exactly where to go.',
    },
  },
  {
    id: 'fonte', ic: 'nuvem', group: 'more', act: 'inicio',
    pt: {
      t: 'De onde vêm os dados',
      d: 'Os dados reais vêm do produto GCOV (banda L) do NISAR, baixado do arquivo ASF DAAC da NASA, e são processados automaticamente.',
      steps: [
        'Todos os dias um robô no GitHub procura passagens novas do NISAR sobre cada região.',
        'Quando acha uma passagem nova, ele compara com a anterior: queda forte do sinal HH indica água nova; o contrário, água que recuou; queda do sinal HV indica perda de floresta.',
        'O resultado vira os focos, alertas e a linha do tempo que você vê no app.',
        'O quadro “Dados NISAR reais”, no pé do menu, mostra quais passagens estão em uso.',
      ],
      tip: 'O radar atravessa nuvens e funciona à noite. Por isso ele enxerga enchentes mesmo com o céu fechado, quando satélites ópticos não conseguem.',
      ex: 'Choveu forte e o céu está fechado há dias? O radar continua enxergando: na próxima passagem do NISAR, as áreas alagadas aparecem no mapa.',
    },
    en: {
      t: 'Where the data comes from',
      d: 'Real data comes from the NISAR GCOV product (L-band), downloaded from NASA’s ASF DAAC archive, and is processed automatically.',
      steps: [
        'Every day a robot on GitHub looks for new NISAR passes over each region.',
        'When it finds one, it compares it with the previous pass: a strong drop in the HH signal means new water; the reverse, water receded; a drop in the HV signal means forest loss.',
        'The result becomes the detections, alerts and timeline you see in the app.',
        'The “Real NISAR data” box at the bottom of the menu shows which passes are in use.',
      ],
      tip: 'Radar sees through clouds and works at night. That is why it spots floods under overcast skies, when optical satellites cannot.',
      ex: 'Heavy rain and cloudy skies for days? The radar still sees: on the next NISAR pass, flooded areas show up on the map.',
    },
  },
  {
    id: 'idioma', ic: 'info', group: 'more', act: 'inicio',
    pt: {
      t: 'Idioma e acessibilidade',
      d: 'O app funciona em português e em inglês, com teclado e leitor de tela.',
      steps: [
        'No topo do menu lateral, clique em PT ou EN para trocar o idioma de todo o app.',
        'Use Tab para andar pelos botões e Enter para clicar. Esc fecha janelas como o primeiro acesso.',
        'Cores nunca são a única pista: cada tipo de mudança também tem ícone e nome.',
      ],
      tip: 'Datas e números também mudam de formato junto com o idioma.',
      ex: 'Vai apresentar para uma banca estrangeira? Clique em EN no topo do menu e todo o app fica em inglês, inclusive datas e números.',
    },
    en: {
      t: 'Language and accessibility',
      d: 'The app works in Portuguese and English, with keyboard and screen reader.',
      steps: [
        'At the top of the side menu, click PT or EN to switch the whole app language.',
        'Use Tab to move between buttons and Enter to click. Esc closes windows such as the first-access intro.',
        'Color is never the only cue: each type of change also has an icon and a name.',
      ],
      tip: 'Dates and numbers also change format with the language.',
      ex: 'Presenting to an international panel? Click EN at the top of the menu and the whole app switches to English, dates and numbers included.',
    },
  },
]

export const ACT_LABEL: Record<TutAction, [string, string]> = {
  inicio: ['Abrir o Início', 'Open Home'],
  map: ['Ir para o mapa', 'Go to the map'],
  alerts: ['Ir para os alertas', 'Go to alerts'],
  comparar: ['Abrir Comparar períodos', 'Open Compare periods'],
  celular: ['Abrir a versão celular', 'Open the mobile version'],
  ob: ['Rever o primeiro acesso', 'Replay the first-access intro'],
  search: ['Experimentar a busca', 'Try the search'],
  regions: ['Ver Minhas regiões', 'See My regions'],
  futuro: ['Abrir Aplicações futuras', 'Open Future applications'],
}
