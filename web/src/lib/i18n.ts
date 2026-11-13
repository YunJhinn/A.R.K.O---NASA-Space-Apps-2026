// Tradução PT → EN.
// O app é escrito em português; t('texto') devolve o texto em inglês quando o idioma é EN.
// Textos fixos ficam no dicionário EN; textos com números/datas usam as regras (RULES).
// @A@ @B@ @Y@ @AN@ @BN@ marcam as datas da comparação real (antes, depois, ano).
import type { Lang, RealDates } from './types'

export const cfg: { lang: Lang; rd: RealDates | null } = { lang: 'pt', rd: null }
export function setI18n(lang: Lang, rd: RealDates | null) { cfg.lang = lang; cfg.rd = rd }

export const EN: Record<string, string> = {
'Afastar':'Zoom out','Animar mudanças':'Animate changes','Antes ou depois':'Before or after','Aproximar':'Zoom in','Buscar cidade, rio ou região':'Search city, river or region','Camada':'Layer','Camadas':'Layers','Centralizar':'Center','Colorir focos por':'Color detections by','Comparar com o período anterior':'Compare with previous period','Detalhe do foco':'Detection detail','Fechar':'Close','Fechar detalhe':'Close detail','Filtrar alertas por risco':'Filter alerts by risk','Filtrar por tipo':'Filter by type','Filtrar por tipo de evento':'Filter by event type','Filtro de período':'Period filter','Fonte dos dados do mapa':'Map data source','Menu principal':'Main menu','Posição da comparação':'Comparison position','Telas do protótipo':'Prototype screens','Tipo de mudança':'Type of change','Escolher período':'Choose period',
'A data inicial precisa ser antes da final.':'The start date must be before the end date.',
'A perda se concentra no “arco do desmatamento”, onde floresta vira pasto e lavoura ao longo das estradas.':'Loss is concentrated in the “arc of deforestation”, where forest turns into pasture and cropland along roads.',
'Advanced Reconnaissance & Knowledge Operations. Usamos o radar do satélite NISAR, da NASA e da ISRO, que enxerga a Amazônia de dia, de noite e através das nuvens, e transformamos esse sinal em informação simples.':'Advanced Reconnaissance & Knowledge Operations. We use the radar of the NISAR satellite, from NASA and ISRO, which sees the Amazon day and night and through clouds, and turn that signal into simple information.',
'Alertas':'Alerts','Alertas e previsões':'Alerts and forecasts','Alertas e riscos primeiro':'Alerts and risks first','Alto':'High','Amazônia (todos os estados)':'Amazon (all states)','Antes / depois':'Before / after','Antes e depois':'Before and after','Ao vivo':'Live','Aplicar período':'Apply period',
'Arco do desmatamento':'Arc of deforestation','Arraste a barra para comparar os dois períodos no mesmo mapa':'Drag the bar to compare both periods on the same map','Atmosfera instável na região. Em monitoramento.':'Unstable atmosphere in the region. Being monitored.','Até':'To','Avisamos antes':'We warn ahead','Avisar minha equipe':'Alert my team','Bacia do Tapajós':'Tapajós basin','Baixo':'Low','Bem-vindo ao A.R.K.O':'Welcome to A.R.K.O',
'Botões e cards grandes para usar com uma mão, em pé, no barco ou no carro.':'Big buttons and cards to use with one hand, standing, on a boat or in a car.','Cancelar':'Cancel','Causa provável':'Likely cause','Celular':'Mobile',
'Chuvas acima da média nas cabeceiras do Solimões e do Negro elevaram os rios. O radar enxerga a água mesmo com nuvens.':'Above-average rain in the headwaters of the Solimões and Negro raised the rivers. Radar sees water even under clouds.',
'Colorir por':'Color by','Com os dados do radar e do tempo, indicamos o que pode acontecer.':'With radar and weather data, we point out what may happen.',
'Combinação de dados do radar e do tempo indica possibilidade do evento. Veja o alerta ao lado.':'Radar and weather data together point to a possible event. See the alert on the side.',
'Começar':'Start','Como funciona':'How it works','Tutoriais':'Tutorials', 'Esconder o radar': 'Hide radar', 'Mostrar o radar': 'Show radar','Como o A.R.K.O funciona':'How A.R.K.O works','Comparamos dois períodos':'We compare two periods','Comparar':'Compare','Comparar com':'Compare with','Comparar períodos':'Compare periods','Comparar períodos e explicar':'Compare periods and explain','Compartilhar':'Share','Compartilhar imagem':'Share image','Concentração de focos':'Detection density',
'Cores, ícones e níveis de risco iguais: quem aprendeu em um aparelho já sabe usar no outro.':'Same colors, icons and risk levels: learn it on one device and you know the other.',
'Curiosidade':'Curiosity','Dados':'Data','Dados NISAR atualizados':'NISAR data up to date','Dados ilustrativos · base Natural Earth · radar NISAR':'Illustrative data · Natural Earth basemap · NISAR radar','Datas personalizadas':'Custom dates','De':'From','Desde o início dos dados':'Since data began','Desmatamento':'Deforestation','Educação':'Education','Em andamento':'Ongoing',
'Em campo, a pergunta é “preciso agir agora?”. A tela abre respondendo isso, sem exigir zoom no mapa.':'In the field, the question is “do I need to act now?”. The screen opens by answering it, no map zoom needed.',
'Enchente':'Flood','Enchentes':'Floods','Encontro dos rios Negro e Solimões':'Meeting of the Negro and Solimões rivers','Escolha um período e veja o que mudou':'Pick a period and see what changed','Exemplo':'Example','Explorar o mapa':'Explore the map','Floresta perdida':'Forest lost','Foco detectado pelo radar':'Detection found by radar','Focos detectados':'Detections','Focos por semana':'Detections per week','Fonte externa: meteorologia':'External source: weather','Fonte: NASA–ISRO · ASF DAAC':'Source: NASA–ISRO · ASF DAAC','Fonte: NISAR':'Source: NISAR','Gestão e Defesa Civil':'Management and Civil Defense','Grau de mudança':'Degree of change','Início':'Home',
'Legenda':'Legend','Leve para internet fraca':'Light on weak internet','MENU':'MENU','Água nova em vários pontos':'New water in several spots','Rio recuou em vários pontos':'River receded in several spots','Dois modos: Exemplo e NISAR real':'Two modes: Example and Real NISAR','Amazônia inteira · dados ilustrativos para aprender a usar':'Whole Amazon · illustrative data to learn the app','Rio Madeira · sul do Amazonas':'Madeira River · southern Amazonas','Mudança entre @A@ e @B@':'Change between @A@ and @B@','DADOS':'DATA','Fonte dos dados':'Data source','Manaus e região · toque em um alerta para ver no mapa':'Manaus area · tap an alert to see it on the map','Mapa':'Map','Mapa de mudanças':'Change map','Mesma linguagem do desktop':'Same language as desktop',
'Mostramos o que mudou: mais água, menos floresta, solo mais seco.':'We show what changed: more water, less forest, drier soil.','Mostrar previsões':'Show forecasts','Médio':'Medium','Mês':'Month','Mês da detecção':'Month detected','NISAR real':'Real NISAR','Nenhum foco desse tipo no período.':'No detections of this type in the period.',
'O mapa carrega como imagem simples e só baixa detalhes quando a pessoa toca em um foco.':'The map loads as a simple image and fetches details only when someone taps a detection.','O que isso significa?':'What does this mean?',
'O radar detectou desmatamento nesta área no período escolhido.':'Radar detected deforestation in this area in the chosen period.','O radar detectou enchente nesta área no período escolhido.':'Radar detected flooding in this area in the chosen period.','O radar detectou queimada nesta área no período escolhido.':'Radar detected fire in this area in the chosen period.','O radar detectou solo seco nesta área no período escolhido.':'Radar detected dry soil in this area in the chosen period.',
'O radar mostra mais área com água parada e floresta alagada. Rios acima da média para a época.':'Radar shows more standing water and flooded forest. Rivers above average for the season.','O radar vê através das nuvens':'Radar sees through clouds',
'O satélite NISAR envia sinais de micro-ondas que atravessam nuvens, de dia e de noite.':'The NISAR satellite sends microwave signals that pass through clouds, day and night.','O solo ficou mais seco. Isso aumenta o risco de queimadas nas próximas semanas.':'The soil got drier. This raises the risk of fires in the coming weeks.',
'O ícone continua mostrando o tipo':'The icon still shows the type','Observado':'Observed','Observado pelo radar':'Observed by radar','Ou escolha um ou mais meses (clique no primeiro e no último)':'Or pick one or more months (click the first and the last)','PROTÓTIPO':'PROTOTYPE','PRÓXIMOS DIAS':'NEXT DAYS','Para quem é a sua visão?':'Who is your view for?',
'Pensada para a Ana Clara em campo: alertas primeiro, toque grande, pouca internet.':'Designed for Ana Clara in the field: alerts first, big touch targets, little internet.','Período':'Period','Período A (antes)':'Period A (before)','Período B (depois)':'Period B (after)','Período anterior':'Previous period','Período atual':'Current period','Por que alertas primeiro?':'Why alerts first?',
'Possíveis vendavais':'Possible windstorms','Possível enchente':'Possible flood','Possível queimada':'Possible fire','Possível tornado':'Possible tornado','Previsto':'Forecast','Previsão (alerta)':'Forecast (alert)','Previsão para os próximos dias':'Forecast for the next days','Primeiro acesso':'Onboarding','Próximo':'Next','Pular':'Skip','Queimada':'Fire','Queimadas':'Fires','RESUMO EM UMA FRASE':'ONE-SENTENCE SUMMARY','Radar':'Radar','Radar NISAR real':'Real NISAR radar','Radar da Amazônia':'Amazon radar','Alerta de riscos':'Risk alert','Região':'Region','Risco em análise':'Risk under analysis','Satélite óptico':'Optical satellite','Sem dados anteriores':'No earlier data','Sem período anterior com dados':'No earlier period with data','Sobre':'About','Solo seco':'Dry soil','Sul do Amazonas':'Southern Amazonas','Sul do Pará':'Southern Pará','Tente um período maior.':'Try a longer period.','Tipo':'Type','Todos':'All','Toque em um foco no mapa para ver o que mudou.':'Tap a detection on the map to see what changed.','Umidade média do solo':'Average soil moisture',
'Vamos ajustar a tela inicial para o que você mais precisa. Dá para mudar depois.':'We will tailor the home screen to what you need most. You can change it later.','Vendaval':'Windstorm','Ver focos no mapa':'See detections on map','Ver no mapa':'See on map','Ver no mapa →':'See on map →','Versão celular':'Mobile version','Voltar':'Back','Voltar ao início':'Back to home','fonte externa':'external source',
'Água, fogo, vegetação e solo vêm do radar NISAR. Ventos e tornados vêm de modelos do tempo (':'Water, fire, vegetation and soil come from NISAR radar. Winds and tornadoes come from weather models (',
'Área afetada':'Affected area','Área alagada':'Flooded area','Área queimada':'Burned area','Áreas de floresta viraram solo exposto, padrão típico de abertura de pasto.':'Forest areas became bare soil, a typical pattern of clearing for pasture.','▲ vs. anterior':'▲ vs. previous','▲ vs. período anterior':'▲ vs. previous period',
'Água nova':'New water','Água que recuou':'Water receded','Fogo ainda não medido nos dados reais':'Fire not measured yet in real data','@A@ – @B@ @Y@':'@A@ – @B@ @Y@','Passagem de @A@':'@A@ pass','Nenhuma passagem do NISAR nesse período':'No NISAR pass in this period','Nenhuma passagem do NISAR nesse período. Escolha 30 dias ou mais.':'No NISAR pass in this period. Pick 30 days or more.','Dados NISAR reais':'Real NISAR data','Passagens usadas: @AN@ e @BN@':'Passes used: @AN@ and @BN@','Alertas do radar':'Radar alerts','DETECTADO PELO RADAR':'DETECTED BY RADAR','Dados reais do NISAR: duas passagens (@A@ e @B@ @Y@) sobre o rio Madeira, sul do Amazonas. Fogo e previsões do tempo ainda não entram nesta versão.':'Real NISAR data: two passes (@A@ and @B@, @Y@) over the Madeira River, southern Amazonas. Fire and weather forecasts are not in this version yet.','Água nova fora do rio':'New water outside the river','Rio recuou com a seca':'River receded in the drought','Perda de floresta em grupo':'Clustered forest loss','Perda de floresta isolada':'Isolated forest loss','Detectado em @B@':'Detected @B@','Onde havia água em @A@, agora há margem exposta.':'Where there was water on @A@, there is now exposed bank.','Queda no sinal da vegetação. Pode ser corte ou queimada.':'Drop in the vegetation signal. Could be clearing or fire.','Pixels que eram terra passaram a refletir como água lisa (queda forte no sinal HH). Pode ser alagamento, lago novo ou mudança no leito do rio.':'Pixels that were land now reflect like smooth water (strong HH drop). Could be flooding, a new lake or a shift in the riverbed.','O sinal de volume da vegetação (HV) caiu: a floresta perdeu estrutura. Pode ser corte raso, queimada ou exploração seletiva.':'The vegetation volume signal (HV) dropped: the forest lost structure. Could be clear-cutting, fire or selective logging.','Onde havia água em @A@, o radar agora vê superfície exposta. É o rio baixando com a seca de @Y@.':'Where there was water on @A@, radar now sees exposed ground. It is the river dropping in the @Y@ drought.','Área que mudou':'Area changed','A · @A@':'A · @A@','B · @B@':'B · @B@','@A@ @Y@':'@A@ @Y@','@B@ @Y@':'@B@ @Y@','Antes · @A@':'Before · @A@','Depois · @B@':'After · @B@','@A@ · sem mudança':'@A@ · no change','Novo Aripuanã e região':'Novo Aripuanã area','Amazonas':'Amazonas','Pará':'Pará','Novembro':'November','Outubro':'October','Setembro':'September','Agosto':'August','Julho':'July','Junho':'June','Jun':'Jun','Jul':'Jul','Ago':'Aug','Set':'Sep','Out':'Oct','Nov':'Nov',
'Antes · Setembro':'Before · September','Depois · Novembro':'After · November','A · Agosto':'A · August','A · Julho':'A · July','A · Setembro':'A · September','B · Novembro':'B · November','B · Outubro':'B · October','Período A · Setembro':'Period A · September','Período B · Novembro':'Period B · November'};
const MO: Record<string, string> = {jan:'Jan',fev:'Feb',mar:'Mar',abr:'Apr',mai:'May',jun:'Jun',jul:'Jul',ago:'Aug',set:'Sep',out:'Oct',nov:'Nov',dez:'Dec'};
const MOL: Record<string, string> = {janeiro:'January',fevereiro:'February',março:'March',abril:'April',maio:'May',junho:'June',julho:'July',agosto:'August',setembro:'September',outubro:'October',novembro:'November',dezembro:'December'};
const TY: Record<string, string> = {'Desmatamento':'Deforestation','Enchente':'Flood','Queimada':'Fire','Solo seco':'Dry soil','Previsão':'Forecast','Vendaval':'Windstorm'};
const num = (s: string) =>s.replace(/(\d)\.(\d{3})\b/g,'$1,$2').replace(/(\d),(\d{1,2})\b(?!,)/g,'$1.$2');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RULES: [RegExp, (...a: any[]) => string][] = [
[/^(\d+) alertas ativos, (\d+) de alto risco nas próximas (\d+)h\.( Queimadas cresceram (\d+)% no último mês\.)?$/,(m,a,b,h,x,p)=>`${a} active alerts, ${b} high-risk in the next ${h}h.${x?` Fires grew ${p}% in the last month.`:''}`],
[/^(\d+) alertas de alto risco perto de você$/,(m,a)=>`${a} high-risk alerts near you`],
[/^(\d+) (dias|meses|ano)( anteriores)?$/,(m,a,u,x)=>`${x?'Previous ':''}${a} ${u==='dias'?'days':u==='meses'?'months':'year'}`],
[/^Últimos (\d+) (dias|meses)$/,(m,a,u)=>`Last ${a} ${u==='dias'?'days':'months'}`],
[/^vs\. (\d+) (dias|meses) anteriores$/,(m,a,u)=>`vs. previous ${a} ${u==='dias'?'days':'months'}`],
[/^([\d.]+) focos detectados em (.+) · clique em um foco para ver o que mudou$/,(m,a,p)=>`${num(a)} detections in ${tr(p)} · click a detection to see what changed`],
[/^(\d+) focos reais do NISAR \(@A@ → @B@\) · clique em um foco para ver o que mudou$/,(m,a)=>`${a} real NISAR detections (@A@ → @B@) · click a detection to see what changed`],
[/^(\d+) (jun|jul|ago|set|out|nov)? ?– (\d+) (jun|jul|ago|set|out|nov) (\d{4})$/,(m,a,b,c,d,y)=>`${b?MO[b]+' ':MO[d]+' '}${a} – ${MO[d]} ${c}, ${y}`],
[/^(Antes|Depois) · (\d+) (\w{3})$/,(m,w,d,mo)=>`${w==='Antes'?'Before':'After'} · ${MO[mo]||mo} ${d}`],
[/^(Jun|Jul|Ago|Set|Out|Nov) (\d+)$/,(m,mo,d)=>`${MO[mo.toLowerCase()]} ${d}`],
[/^(Junho|Julho|Agosto|Setembro|Outubro|Novembro) (\d{4})$/,(m,mo,y)=>`${MOL[mo.toLowerCase()]} ${y}`],
[/^Novembro (\d{4}) \(até dia (\d+)\)$/,(m,y,d)=>`November ${y} (through the ${d}th)`],
[/^(Setembro|Novembro) · ([\d.]+) km²$/,(m,mo,v)=>`${MOL[mo.toLowerCase()]} · ${num(v)} km²`],
[/^Detectado em (\w+) de (\d{4})$/,(m,mo,y)=>`Detected in ${MOL[mo.toLowerCase()]} ${y}`],
[/^Dado real NISAR · detectado em @B@ @Y@$/,()=>'Real NISAR data · detected @B@, @Y@'],
[/^Dados do radar NISAR disponíveis de (\d+) jun a (\d+) nov (\d{4})$/,(m,a,b,y)=>`NISAR radar data available from Jun ${a} to Nov ${b}, ${y}`],
[/^(Alto|Médio|Baixo) · (\d+)%$/,(m,l,p)=>`${tr(l)} · ${p}%`],
[/^(Estável|Moderado|Alto|Extremo) · (\d+)\/100$/,(m,l,g)=>`${({Estável:'Stable',Moderado:'Moderate',Alto:'High',Extremo:'Extreme'} as Record<string,string>)[l]} · ${g}/100`],
[/^A (área alagada|área queimada|floresta perdida) (cresceu|aumentou|diminuiu) (\d+)% (?:entre|de) (\w+) (?:e|a) (\w+)(\.?)$/,(m,k,v,p,a,b,dot)=>`${({'área alagada':'Flooded area','área queimada':'Burned area','floresta perdida':'Forest loss'} as Record<string,string>)[k]} ${v==='diminuiu'?'fell':'grew'} ${p}% from ${MOL[a]} to ${MOL[b]}${dot}`],
[/^Apareceu água parada onde antes não havia: o sinal caiu ([\d,]+) dB entre @A@ e @B@\.$/,(m,d)=>`Standing water appeared where there was none: the signal dropped ${num(d)} dB between @A@ and @B@.`],
[/^O sinal de volume \(HV\) do radar caiu ([\d,]+) dB entre @A@ e @B@: a floresta perdeu estrutura\. Pode ser desmatamento ou queimada; o radar sozinho não separa os dois\.$/,(m,d)=>`The radar volume signal (HV) dropped ${num(d)} dB between @A@ and @B@: the forest lost structure. It may be clearing or fire; radar alone cannot tell them apart.`],
[/^Onde havia água em @A@, o radar agora vê superfície exposta \(([\d,]+) dB a mais\): o rio recuou com a seca\.$/,(m,d)=>`Where there was water on @A@, radar now sees exposed ground (${num(d)} dB more): the river receded in the drought.`],
[/^Δ ([\d,]+) dB vs\. @A@$/,(m,d)=>`Δ ${num(d)} dB vs. @A@`],
[/^a (\d+) km de (.+)$/,(m,k,p)=>`${k} km from ${p}`],
[/^(Desmatamento|Enchente|Queimada|Solo seco|Previsão|Vendaval) em (.+)$/,(m,t,p)=>`${TY[t]} at ${tr(p)}`],
[/^(\d+) focos de queimada perto de (.+)$/,(m,n,p)=>`${n} fire detections near ${p}`],
[/^Notificações: (\d+) alertas$/,(m,n)=>`Notifications: ${n} alerts`],
[/^Escala de 0 a 100 que compara os dois períodos\. Acima de 50 é uma mudança alta\.$/,()=>'A 0–100 scale comparing both periods. Above 50 is a high change.'],
[/^A estação seca reduziu a umidade do solo de (\d+)% para (\d+)%, deixando a vegetação mais vulnerável ao fogo, principalmente no sul do Amazonas\.$/,(m,a,b)=>`The dry season cut soil moisture from ${a}% to ${b}%, leaving vegetation more vulnerable to fire, especially in southern Amazonas.`],
[/^O sinal da vegetação caiu: a floresta perdeu estrutura após o fogo\. São cerca de ([\d.]+) campos de futebol\.$/,(m,n)=>`The vegetation signal dropped: the forest lost structure after the fire. That is about ${num(n)} soccer fields.`],
[/^Rajadas acima de (\d+) km\/h sobre área recém-desmatada\.$/,(m,n)=>`Gusts above ${n} km/h over recently cleared land.`],
[/^Vegetação seca e umidade do solo caiu de (\d+)% para (\d+)%\.$/,(m,a,b)=>`Dry vegetation; soil moisture fell from ${a}% to ${b}%.`],
[/^Área alagada cresceu (\d+)% e o solo está saturado\.$/,(m,a)=>`Flooded area grew ${a}% and the soil is saturated.`],
[/^Selecione 7 dias, 30 dias ou datas personalizadas\. (.*)$/,()=>'Select 7 days, 30 days or custom dates. The map, numbers and alerts change together and always compare with the previous period.'],
[/^Toque de pelo menos (\d+) px$/,(m,n)=>`Touch targets of at least ${n} px`],
[/^Última passagem do satélite: (\d+)\/(\d+)\/(\d+)$/,(m,d,mo,y)=>`Last satellite pass: ${mo}/${d}/${y}`],
[/^Equipe A\.R\.K\.O · Space Apps (\d+)$/,(m,y)=>`Team A.R.K.O · Space Apps ${y}`],
[/^Radar NISAR GCOV banda L · @B@ @Y@ · (.+)$/,(m,s)=>`NISAR GCOV L-band radar · @B@, @Y@ · ${s}`],
[/^· @A@ → @B@ @Y@ · rio Madeira \(AM\) · (.+)$/,(m,s)=>`· @A@ → @B@, @Y@ · Madeira River (AM) · ${s}`],
[/^([\d.,]+) (→ [\d.,]+ )?km²$/,(m)=>num(m)],[/^[\d.,]+ → [\d.,]+$/,(m)=>num(m)],
[/^(▲|▼) ([\d,]+) p\.p\.( vs\. anterior)?$/,(m,a,v,x)=>`${a} ${num(v)} pp${x?' vs. previous':''}`],
[/^▲ (\d+)% vs\. anterior$/,(m,p)=>`▲ ${p}% vs. previous`],
[/^(\d+)–(\d+) dias$/,(m,a,b)=>`${a}–${b} days`],
[/^(.+) · (\d+)–(\d+) dias$/,(m,p,a,b)=>`${tr(p)} · ${a}–${b} days`],
[/^(\d+) focos? · @A@ → @B@$/,(m,n)=>`${n} detection${n==='1'?'':'s'} · @A@ → @B@`],
[/^(\d+) alertas do radar NISAR real, (\d+) de alto risco\. Floresta perdida: ([\d,]+) km² entre @A@ e @B@\.$/,(m,a,h,f)=>`${a} alerts from real NISAR radar, ${h} high-risk. Forest lost: ${num(f)} km² between @A@ and @B@.`],
[/^Entre @A@ e @B@ apareceu ([\d,]+) km² de água nova \((\d+) focos?\)\.$/,(m,a,n)=>`Between @A@ and @B@, ${num(a)} km² of new water appeared (${n} detection${n==='1'?'':'s'}).`],
[/^Entre @A@ e @B@ o radar achou ([\d,]+) km² de floresta perdida \((\d+) focos?\)\.$/,(m,a,n)=>`Between @A@ and @B@, radar found ${num(a)} km² of forest lost (${n} detection${n==='1'?'':'s'}).`],
[/^Entre @A@ e @B@ a água recuou em ([\d,]+) km² \((\d+) focos?\)\.$/,(m,a,n)=>`Between @A@ and @B@, water receded over ${num(a)} km² (${n} detection${n==='1'?'':'s'}).`],
[/^0 → ([\d,]+) km²$/,(m,a)=>`0 → ${num(a)} km²`],
[/^@B@ · ([\d,]+) km²$/,(m,a)=>`@B@ · ${num(a)} km²`],
[/^(\d+) alertas? de alto risco perto de você$/,(m,n)=>`${n} high-risk alert${n==='1'?'':'s'} near you`],
[/^(.+) · Detectado em @B@$/,(m,p)=>`${tr(p)} · Detected @B@`],
[/^([\d,]+) km² de água parada onde não havia em @A@\. O sinal caiu (\d+) dB\.$/,(m,a,d)=>`${num(a)} km² of standing water where there was none on @A@. The signal dropped ${d} dB.`],
[/^(\d+) focos próximos somam ([\d,]+) km² de (floresta perdida|água nova|margem exposta)\.$/,(m,n,a,k)=>`${n} nearby detections add up to ${num(a)} km² of ${({'floresta perdida':'forest lost','água nova':'new water','margem exposta':'exposed bank'} as Record<string,string>)[k]}.`],
[/^Rio Madeira \(AM\) · (\d+) focos reais · @A@ → @B@ @Y@$/,(m,n)=>`Madeira River (AM) · ${n} real detections · @A@ → @B@, @Y@`],
[/^Exemplo mostra a Amazônia inteira com dados ilustrativos, para entender o app\. NISAR real mostra o que o satélite detectou de verdade entre @A@ e @B@ de @Y@ no rio Madeira\. Troque quando quiser em Dados, no menu\.$/,()=>'Example shows the whole Amazon with illustrative data, to learn the app. Real NISAR shows what the satellite actually detected between @A@ and @B@, @Y@ on the Madeira River. Switch anytime under Data in the menu.'],
[/^@A@ · sem mudança$/,()=>'@A@ · no change'],
[/^Sul do Pará · (\d+)h$/,(m,h)=>`Southern Pará · ${h}h`],
];
const reEsc = (x: string) =>x.replace(/[.*+?^${}()|[\]\\/]/g,'\\$&');
function dkey(t: string) {const RD = cfg.rd; if (!RD) return t;let k=t;([[RD.bn,'@BN@'],[RD.an,'@AN@'],[RD.b,'@B@'],[RD.a,'@A@']] as [string,string][]).forEach(([v,p])=>{k=k.replace(new RegExp('(^|[^\\d])'+reEsc(v)+'(?![a-zà-ú\\d])','g'),'$1'+p)});if(k!==t)k=k.replace(new RegExp('(^|[^\\d])'+RD.y+'(?!\\d)','g'),'$1@Y@');return k}
function dval(v: string) {const RD = cfg.rd!; return v.replace(/@BN@/g,RD.bnEN).replace(/@AN@/g,RD.anEN).replace(/@B@/g,RD.bEN).replace(/@A@/g,RD.aEN).replace(/@Y@/g,RD.y)}

// ---- datas da linha do tempo ----
const MPT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "2026-09-03" → "3 set 2026" (PT) ou "Sep 3, 2026" (EN) */
export function fmtDate(iso: string, withYear = true) {
  const [y, m, d] = iso.split('-').map(Number)
  if (cfg.lang === 'en') return `${MEN[m - 1]} ${d}${withYear ? `, ${y}` : ''}`
  return `${d} ${MPT[m - 1]}${withYear ? ` ${y}` : ''}`
}
RULES.push(
  [/^([\d.]+) focos reais do NISAR até (.+) · clique em um foco para ver o que mudou$/, (m, n, d) => `${num(n)} real NISAR detections up to ${d} · click a detection to see what changed`],
  [/^([\d.]+) focos detectados até (.+) · clique em um foco para ver o que mudou$/, (m, n, d) => `${num(n)} detections up to ${d} · click a detection to see what changed`],
  [/^· (.+) · rio Madeira \(AM\) · (.+)$/, (m, d, s) => `· ${d} · Madeira River (AM) · ${s}`],
  [/^Radar NISAR GCOV banda L · (.+) · (.+)$/, (m, d, s) => `NISAR GCOV L-band radar · ${d} · ${s}`],
  [/^Até (.+)$/, (m, d) => `Up to ${d}`],
  [/^Passagem do NISAR · (.+)$/, (m, d) => `NISAR pass · ${d}`],
  [/^Semana até (.+)$/, (m, d) => `Week ending ${d}`],
  [/^(\d+) focos? nesta passagem$/, (m, n) => `${n} detection${n === '1' ? '' : 's'} in this pass`],
  [/^(\d+) passagens do NISAR · próxima a cada ~12 dias$/, (m, n) => `${n} NISAR passes · next one every ~12 days`],
  [/^(\d+) focos? · (?:Passagem de|NISAR pass of) (.+)$/, (m, n, d) => `${n} detection${n === '1' ? '' : 's'} · NISAR pass of ${d}`],
  [/^(\d+) focos? · (?:Semana até|Week ending) (.+)$/, (m, n, d) => `${n} detection${n === '1' ? '' : 's'} · Week ending ${d}`],
  [/^([\d.]+) focos reais do NISAR · Passagem de (.+) · clique em um foco para ver o que mudou$/, (m, n, d) => `${num(n)} real NISAR detections · pass of ${d} · click a detection to see what changed`],
  [/^([\d.]+) focos detectados · Semana até (.+) · clique em um foco para ver o que mudou$/, (m, n, d) => `${num(n)} detections · week ending ${d} · click a detection to see what changed`],
  [/^Passagem de (\w{3} \d+, \d{4})$/, (m, d) => `NISAR pass of ${d}`],
  [/^NISAR · Passagem de (.+)$/, (m, d) => `NISAR · pass of ${d}`],
  [/^Em (.+) o radar achou (\d+) focos? de (água nova|floresta perdida|água que recuou); em (.+) foram (\d+)\.$/, (m, b, n, k, a, na) => `On ${b} the radar found ${n} ${({ 'água nova': 'new water', 'floresta perdida': 'forest loss', 'água que recuou': 'receded water' } as Record<string, string>)[k]} detection${n === '1' ? '' : 's'}; on ${a} there were ${na}.`],
  [/^([\d.,]+) km² → ([\d.,]+) km²$/, (m, a, b) => `${num(a)} km² → ${num(b)} km²`],
  [/^(Queimada|Enchente|Desmatamento|Solo seco|Água nova|Água que recuou) · (Amazônia|Sul do Brasil)$/, (m, k, r) => `${TY[k] ?? k} · ${r === 'Amazônia' ? 'Amazon' : 'Southern Brazil'}`],
  [/^Passagens de (.+) a (.+)$/, (m, a, b) => `NISAR passes from ${a} to ${b}`],
  [/^NISAR · Passagens de (.+) a (.+)$/, (m, a, b) => `NISAR · passes ${a} to ${b}`],
  [/^De (\w{3} \d+) a (.+)$/, (m, a, b) => `${a} to ${b}`],
  [/^(\d+) focos? · Passagens de (.+) a (.+)$/, (m, n, a, b) => `${n} detection${n === '1' ? '' : 's'} · passes ${a} to ${b}`],
  [/^(\d+) focos? · De (.+) a (.+)$/, (m, n, a, b) => `${n} detection${n === '1' ? '' : 's'} · ${a} to ${b}`],
  [/^([\d.]+) focos reais do NISAR · Passagens de (.+) a (.+) · clique em um foco para ver o que mudou$/, (m, n, a, b) => `${num(n)} real NISAR detections · passes ${a} to ${b} · click a detection to see what changed`],
  [/^([\d.]+) focos detectados · De (.+) a (.+) · clique em um foco para ver o que mudou$/, (m, n, a, b) => `${num(n)} detections · ${a} to ${b} · click a detection to see what changed`],
  [/^(\d+) regiões reais · passagens de jun a out 2026$/, (m, n) => `${n} real regions · passes from Jun to Oct 2026`],
  [/^Antes · (.+)$/, (m, d) => `Before · ${d}`],
  [/^Depois · (.+)$/, (m, d) => `After · ${d}`],
)
Object.assign(EN, {
  'Linha do tempo': 'Timeline', 'Rio Madeira · Amazonas': 'Madeira River · Amazonas', 'Porto Alegre e vale do Taquari · RS': 'Porto Alegre and Taquari valley · RS',
  'Daca e rio Jamuna · Bangladesh': 'Dhaka and Jamuna river · Bangladesh', 'Radar de Bangladesh': 'Bangladesh radar', 'Bangladesh': 'Bangladesh', 'Daca': 'Dhaka', 'Rio Madeira': 'Madeira River',
  '@A@ → @B@ @Y@': '@A@ → @B@, @Y@', 'Dados reais do NISAR: duas passagens (@A@ e @B@ @Y@) sobre': 'Real NISAR data: two passes (@A@ and @B@, @Y@) over',
  'Fogo e previsões do tempo ainda não entram nesta versão.': 'Fire and weather forecasts are not in this version yet.', 'toque em um alerta para ver no mapa': 'tap an alert to see it on the map',
  'Exemplo mostra regiões com dados ilustrativos, para entender o app. NISAR real mostra o que o satélite detectou de verdade no rio Madeira (AM), em Porto Alegre (RS) e em Bangladesh. Troque quando quiser em Dados, no menu.': 'Example shows regions with illustrative data, to learn the app. Real NISAR shows what the satellite actually detected on the Madeira River (AM), in Porto Alegre (RS) and in Bangladesh. Switch anytime under Data in the menu.',
  'MINHAS REGIÕES': 'MY REGIONS', 'Aqui há muita lavoura: parte da perda de vegetação pode ser colheita, não desmatamento.': 'There is a lot of farmland here: part of the vegetation loss may be harvest, not deforestation.', 'Favoritas': 'Favorites', 'Recentes': 'Recent', 'Favoritar região': 'Save region', 'Favoritada': 'Saved',
  'Remover dos favoritos': 'Remove from favorites', 'Nenhuma região favoritada ainda. Use a estrela no painel.': 'No saved regions yet. Use the star on the panel.',
  'As regiões que você abrir ou buscar aparecem aqui.': 'Regions you open or search appear here.', 'Dados reais': 'Real data', 'Exemplo · ': 'Example · ', 'Dados reais · ': 'Real data · ',
  'Região com dados reais do NISAR': 'Region with real NISAR data', 'Uma data': 'One date', 'Modo da linha do tempo': 'Timeline mode', 'Jun → Nov 2026': 'Jun → Nov 2026',
  'Agora clique na data final do período': 'Now click the end date of the period', 'Clique no início e no fim, ou arraste': 'Click the start and the end, or drag', 'REGIÃO': 'REGION', 'Sul do Brasil (PR, SC e RS)': 'Southern Brazil (PR, SC and RS)', 'Sul do Brasil': 'Southern Brazil', 'Amazônia': 'Amazon', 'Radar do Sul do Brasil': 'Southern Brazil radar',
  'Região com dados de exemplo': 'Region with example data', 'Com dados': 'Has data', 'Sem dados': 'No data', 'Busca mundial: © OpenStreetMap': 'World search: © OpenStreetMap',
  'Buscando no mapa do mundo…': 'Searching the world map…', 'Nenhum lugar encontrado.': 'No place found.', '← Voltar aos resultados': '← Back to results',
  'Ainda não monitoramos essa área. O A.R.K.O pode ser configurado para qualquer região coberta pelo NISAR. Regiões com dados agora:': 'We do not monitor this area yet. A.R.K.O can be set up for any region NISAR covers. Regions with data now:',
  'A área alagada mais que dobrou no último mês.': 'Flooded area more than doubled in the last month.', 'Porto Alegre e região · toque em um alerta para ver no mapa': 'Porto Alegre area · tap an alert to see it on the map',
  'Delta do Jacuí e lago Guaíba': 'Jacuí delta and Guaíba lake', 'O radar mostra água parada sobre áreas urbanas e lavouras. O nível do Guaíba segue acima da cota de inundação.': 'Radar shows standing water over urban areas and farmland. Guaíba lake stays above flood level.',
  'Guaíba acima da cota de inundação e solo saturado.': 'Guaíba above flood level and saturated soil.', 'Rajadas acima de 80 km/h com chuva forte.': 'Gusts above 80 km/h with heavy rain.',
  'Rio Itajaí-Açu subindo após chuva contínua.': 'Itajaí-Açu river rising after continuous rain.', 'Oeste de Santa Catarina': 'Western Santa Catarina', 'Serra Gaúcha · RS': 'Serra Gaúcha · RS', 'Vale do Itajaí · SC': 'Itajaí Valley · SC',
  'Chuva acima da média na serra encheu os rios Taquari, Caí e Jacuí, que desaguam no lago Guaíba. O radar enxerga a água mesmo com o céu fechado.': 'Above-average rain in the highlands filled the Taquari, Caí and Jacuí rivers, which flow into Guaíba lake. Radar sees water even under overcast skies.',
  'Com o solo encharcado e a chuva frequente, os focos de fogo caíram no Sul nos últimos meses.': 'With soaked soil and frequent rain, fire detections dropped in the South in recent months.',
  'A perda de vegetação nativa se concentra no oeste de Santa Catarina e no centro do Paraná, ligada à expansão agrícola.': 'Native vegetation loss is concentrated in western Santa Catarina and central Paraná, linked to farm expansion.', 'Focos por tipo': 'Detections by type', 'Focos encontrados em cada passagem do NISAR': 'Detections found in each NISAR pass', 'Focos detectados em cada mês': 'Detections in each month', 'Período inteiro': 'Whole period', 'Tocar animação': 'Play animation', 'Pausar': 'Pause',
  'Passagem sem canal de vegetação (modo SHSV)': 'Pass without the vegetation channel (SHSV mode)',
  'Arraste para escolher a data': 'Drag to choose the date', 'Ver tudo': 'Show all', 'Escolher data na linha do tempo': 'Choose a date on the timeline',
  'Mostra só os focos da data escolhida': 'Shows only the detections from the chosen date',
  'Semanas de exemplo': 'Example weeks', 'Passagens reais do NISAR': 'Real NISAR passes',
})

export function tr(s: string): string {
  if (cfg.lang !== 'en' || s == null) return s
  const t = s.trim(); if (!t) return s
  if (EN[t] !== undefined) return s.replace(t, EN[t])
  for (const [re, f] of RULES) if (re.test(t)) return s.replace(t, t.replace(re, f))
  const k = dkey(t)
  if (k !== t) {
    if (EN[k] !== undefined) return s.replace(t, dval(EN[k]))
    for (const [re, f] of RULES) if (re.test(k)) return s.replace(t, dval(k.replace(re, f)))
  }
  return s
}
