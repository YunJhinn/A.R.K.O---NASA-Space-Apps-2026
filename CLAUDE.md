# A.R.K.O · instruções para o Claude

Leia este arquivo inteiro antes de mexer em qualquer coisa. Responda sempre em **português do Brasil**, com frases curtas e simples.

## O que é o projeto

O A.R.K.O é um sistema web que cruza 5 missões de satélite da NASA (NISAR, Landsat, HLS, SWOT e GRACE/GRACE-FO) para mostrar onde rios, nascentes e aquíferos estão perdendo água, por quê e quanto tempo falta até o ponto crítico. Nasceu no NASA Space Apps Challenge 2026, no desafio "Dancing with the SARs". O posicionamento é: **NISAR como ferramenta de gestão da água**.

- Equipe: João Vitor Alves (tecnologia, design e dados; dono do repositório, GitHub `yunjhinn`), Danillo Peixoto (comunicação e negócios), Joe Pereira (tecnologia e dados).
- O MVP foi entregue no Space Apps. Mudanças agora são melhorias depois do evento.

## Endereços

| O quê | Endereço | Pasta |
|---|---|---|
| Sistema (MVP) | https://yunjhinn.github.io/A.R.K.O---NASA-Space-Apps-2026/app/index.html | `app/` (gerada, não editar) |
| Endereço principal | https://yunjhinn.github.io/A.R.K.O---NASA-Space-Apps-2026/ | `index.html` da raiz: só redireciona para `app/`. **Não substituir.** |
| Landing page | https://yunjhinn.github.io/A.R.K.O---NASA-Space-Apps-2026/landing/ | `landing/` (HTML único + `assets/`) |
| Repositório | https://github.com/YunJhinn/A.R.K.O---NASA-Space-Apps-2026 | — |

## Estrutura

- `web/` · código do app em React 19 + TypeScript + Vite + Tailwind. Rotas por hash: `#inicio` (Radar NISAR), `#historico`, `#aquiferos`, `#cenarios`, `#validacao`. Estilos em `web/src/styles/` (`legacy.css` define as variáveis de cor no segundo `:root`), lógica em `web/src/lib/`, telas em `web/src/components/`.
- `app/` · versão compilada do `web/`. **Nunca editar à mão.** O GitHub Actions gera sozinho.
- `data/` · JSON e imagens que o app lê ao abrir (`../data/` a partir do app). **Escrito pelo robô diário.** Não editar à mão, salvo pedido explícito.
- `pipeline/` · scripts Python que baixam e processam os dados (`atualizar.py` é o ponto de entrada; `rios_landsat.py`, `rios_hls.py`, `rios_swot.py`, `aquiferos_grace.py`, `nascentes.py`, `nisar_afundamento.py`, `riscos.py`...).
- `landing/` · landing page estática. Usa fotos de `../data/` e links para `../app/`.
- `docs/` · documentação, demo em PDF e `LINKS.md` com a fonte de cada dado.

## Como publicar (automático)

- Push na `main` com mudança em `web/**` → workflow **Publicar app** compila e grava `app/`, depois atualiza o GitHub Pages (2 a 3 min).
- Workflow **Atualizar dados NISAR** roda todo dia às 06:17 (Brasília), executa `python pipeline/atualizar.py` e faz commit em `data/` quando há dado novo.
- Mudança só em `landing/` ou na raiz é publicada pelo GitHub Pages direto (1 a 2 min).

## Regras que não mudam

1. **Commits só com a identidade do dono:** `git -c user.name=yunjhinn -c user.email=joaovtoralves@gmail.com commit ...`. **Sem linhas `Co-Authored-By`** nem outra assinatura de IA na mensagem.
2. **Nunca colocar senha ou token em código, commit ou GitHub.** A senha do NASA Earthdata fica só no `_netrc` local ou nos GitHub Secrets `EARTHDATA_USERNAME` e `EARTHDATA_PASSWORD`.
3. **Antes de dar push, rode `git pull --rebase --autostash`.** O robô faz commits todo dia. Não publique enquanto o workflow "Atualizar dados NISAR" estiver rodando.
4. **Nada falso.** Todo número precisa de fonte (satélite, estudo ou registro oficial). Projeção é chamada de projeção ("se nada mudar, por volta de 2046"). Hipótese é marcada como hipótese. Quando o dado não é confiável, o sistema mostra "inconclusivo".
5. **Linguagem precisa:** não é "tempo real", é "monitoramento contínuo, atualizado todo dia" (NISAR passa a cada ~12 dias). Não é "qualquer lugar do mundo" hoje, é "regiões de demonstração, pronto para escalar". Não existe parceria formal com a NASA: usamos dados abertos e o projeto nasceu no Space Apps.
6. **Marca de IA:** a logo e os ícones foram gerados com IA. No app, a etiqueta "IA" ao lado da logo e o texto "logo e ícones: gerados por IA" ficam (regra do Space Apps).
7. O app é bilíngue (PT e EN, em `web/src/lib/i18n.ts`). Todo texto novo precisa das duas versões.
8. Não exponha e-mails pessoais ou de trabalho da equipe. O contato público do projeto é yunjhinn@gmail.com e o WhatsApp (62) 99611-0385.
9. Mude só o que foi pedido. Se achar outro problema, avise em vez de corrigir por conta própria.
10. Se errar, diga claramente o que errou e o que corrigiu.

## Padrão de qualidade antes de entregar

- `cd web && npm ci && npx tsc -b && npm run build` sem erro.
- Abra o app compilado (por exemplo `npx vite preview`, ou um servidor na raiz do repositório para o app achar `../data/`) e **olhe as telas afetadas** no computador (1440 px) e no celular (390 px). Tire print e confira.
- Confira os textos em PT e em EN.
- Explique ao João o que mudou em poucas linhas, sem jargão.

## Identidade visual

- Cores: azul-marinho `#04111C` (menu e fundos escuros), azul profundo `#07213A`, azul-água `#2BD9F0`, azul-água claro `#7DF3FF`, azul `#1A8CFF`, azul de destaque `#0B78C4` (botões, links e abas no app), papel `#F1F6F8`.
- Cores com significado não mudam: vermelho = em risco, amarelo/laranja = atenção, verde = sem risco, e as cores de cada tipo de dado (água, mata, solo).
- Fontes: Archivo Black / Archivo 800 nos títulos e no nome A.R.K.O; Inter nos textos. No app, os títulos usam Space Grotesk.
- Logo: olho com íris de planeta de água, pupila em gota e um satélite em órbita. Arquivos oficiais na pasta "ARKO_Logos_Oficiais" (SVG e PNG; a colorida para fundo escuro é a principal).

## Fatos usados na comunicação (com fonte)

- ONU (UNU-INWEH, 20/01/2026): o mundo entrou na "era da falência hídrica global"; cerca de 70% dos grandes aquíferos em declínio. https://unu.edu/inweh/news/world-enters-era-of-global-water-bankruptcy
- Goiás e DF: −122 km³ de água subterrânea desde 2002 (GRACE, no app).
- Rio Meia Ponte (Goiânia): "Atenção: piorando"; área de água hoje 40% abaixo do melhor período (2010–2019); ponto crítico estimado por volta de 2046; mata ciliar 17,5% (meta 24,9%).
- Cidade do México afundando cerca de 26 cm por ano (NISAR, no app).
- Validação: 4 de 4 checagens batem (tela Validação).
- Cenários futuros: 19 em alerta, 2 atenção, 12 monitorar, 27 sem risco.

Se um número mudar no app (o robô atualiza todo dia), atualize também a landing e os materiais.
