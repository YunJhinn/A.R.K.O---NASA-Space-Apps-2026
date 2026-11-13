# A.R.K.O · app web (React + TypeScript + Tailwind)

Interface do A.R.K.O. Os dados vêm do pipeline em Python (`../pipeline/atualizar.py`),
que grava `../data/` a cada passagem nova do satélite NISAR.

## Rodar no computador

```bash
cd web
npm install
npm run dev        # abre em http://localhost:5173
```

Em modo dev o app lê os arquivos direto de `../data/` (focos_app.json, linha_tempo.json, radar/*.jpg).

## Publicar

Não precisa compilar na mão: ao fazer push de mudanças em `web/`, o workflow
**Publicar app** (`.github/workflows/publicar-app.yml`) compila e grava o resultado em `app/`.
Para testar a versão final localmente: `npm run build && npm run preview`.

## Onde está cada coisa

| Pasta / arquivo | O que tem |
|---|---|
| `src/lib/store.tsx` | Estado global (período, filtros, Exemplo × NISAR real, idioma) e leitura de `data/` |
| `src/lib/demo.ts` | Dados ilustrativos do modo Exemplo |
| `src/lib/real.ts` | Converte os JSON do pipeline em focos, alertas e linha do tempo |
| `src/lib/useFocus.ts` | O que o mapa mostra: período inteiro ou uma data da linha do tempo |
| `src/lib/i18n.ts` | Tradução PT → EN (`t('texto')`) |
| `src/components/home/` | Início: painel principal, mapa, linha do tempo, alertas, período |
| `src/components/compare/` | Comparar períodos (antes e depois) |
| `src/components/phone/` | Versão celular |
| `src/components/Sprite.tsx` | Ícones (traço `i-*` e ilustrados 3D `x-*`) |
| `src/styles/legacy.css` | Estilos visuais do protótipo (vidro, painéis, mapa, marcadores) |
| `tailwind.config.js` | Cores e sombras do design (tipos de evento, azul marinho, painéis) |
| `src/lib/regions.ts` | Regiões de exemplo (Amazônia e Sul do Brasil) |
| `src/components/home/SearchBox.tsx` | Busca mundial (OpenStreetMap) |

Guia completo: `../docs/DOCUMENTACAO.pdf`.

## Textos e tradução

O app é escrito em português. Para um texto novo aparecer em inglês, adicione o par em
`EN` (texto fixo) ou uma regra em `RULES` (texto com números ou datas) em `src/lib/i18n.ts`.
