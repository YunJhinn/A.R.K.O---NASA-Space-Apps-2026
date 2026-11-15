# A.R.K.O · NISAR as a water management tool

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Leia em português](README.pt-BR.md)

**From the riverbank to the sinking ground.** A.R.K.O monitors rivers, headwaters and aquifers continuously, over decades, and warns **years in advance** when any of them is heading toward a critical point.

**App:** https://yunjhinn.github.io/A.R.K.O---NASA-Space-Apps-2026/app/index.html

## The problem

Water disappears slowly: banks without forest silt up the river, headwaters without vegetation weaken, too many wells drain the aquifer and the ground starts to sink. Water managers usually see scattered measurements and only react when the crisis arrives. What is missing is someone saying: *"the pattern changed in year X and, if it continues, the critical point arrives in year Y"*.

## How A.R.K.O solves it

1. **Monitors continuously**: series of up to 40 years (1985 → today), updated by a daily robot.
2. **Finds the inflection point**: the year the pattern changed (two Theil–Sen trend segments).
3. **Projects the scenario**: if nothing changes, when the critical point is reached, with a likely range.
4. **Warns early**: the alert turns on 10 years before the critical point. Red = critical, yellow = attention, green = within the normal range.
5. **Says what to do**: management priority and a suggested action for whoever can act.

## Where NISAR comes in

**NISAR** (NASA-ISRO, L-band radar, 12-day repeat) sees through clouds and smoke and measures the ground in centimetres. It is the app's home screen, with two measures:

| Product | What it measures | What it is for |
| --- | --- | --- |
| **GCOV** · surface change | Radar backscatter (HH/HV) compared between two passes: water outside the channel, forest loss, exposed banks | Knowing where to check first, even in the rainy season |
| **GUNW** · ground motion | Interferometry: how much the ground went down between passes | Finding where the aquifer is being drained. Mexico City: ~26 cm/yr, consistent with published studies |

## Screens

| Screen | What it shows |
| --- | --- |
| **NISAR Radar** | Surface change (GCOV) and ground motion (GUNW), with a priority list and GeoJSON/CSV export |
| **River history** | 10 rivers, 1985 → today: condition, why, likely cause, what to do, inflection and scenarios |
| **Aquifers** | 9 aquifers (GRACE/GRACE-FO, 2002 → today): trend, loss in km³, inflection and scenarios |
| **Future scenarios** | Araguaia headwaters (Landsat before/after, native vegetation, critical point) and every place ranked by urgency |
| **Validation** | Checks against real records and published studies |

## Data sources (all public)

| What | Source |
| --- | --- |
| Radar: surface and subsidence | NISAR GCOV and GUNW (NASA/ISRO, ASF DAAC) |
| River history and photos | Landsat 5/7/8/9 Collection 2 Level-2 (NASA/USGS) |
| Continuous monitor | HLS (NASA: Landsat 8/9 + Sentinel-2) |
| River and lake level | SWOT (NASA/CNES), Hydrocron service |
| Water stored in aquifers | GRACE and GRACE-FO (NASA/DLR/GFZ), GFZ GravIS grid |
| Native vegetation at headwaters | ESA CCI Land Cover and Impact Observatory/Esri LULC |

## Honest limits

- NISAR data is still in beta. When quality is not enough, the screen says "inconclusive".
- Critical points are A.R.K.O references (half the original water or forest, double the turbidity, 20% vegetation at the headwaters), always explained on screen.
- A scenario is not a forecast: it shows where things go if nothing changes.
- Satellites do not see sewage, pesticides or microplastics: they show the visible effect and point where to sample.

## Repository

| Folder | Contents |
| --- | --- |
| `web/` | React + TypeScript + Tailwind app. `npm install` and `npm run dev` inside `web/` |
| `pipeline/` | Python scripts that fetch and process the data (NISAR, Landsat, HLS, SWOT, GRACE, headwaters) |
| `data/` | Results read by the app (JSON, GeoJSON, images) |
| `app/` | App published on GitHub Pages |
| `docs/` | Team documentation, glossary and method (Portuguese) |

The robot (`.github/workflows/atualizar-nisar.yml`) runs `pipeline/atualizar.py` every day and updates `data/`. The NASA Earthdata password lives only in the repository Secrets (`EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`).

## Use of AI

This project was developed with the help of Claude (Anthropic), an AI assistant, for code (app and data pipeline), documentation and texts, all reviewed by the team. The A.R.K.O logo and the illustrated map icons are AI-generated and marked as such in the app. No AI model produces or alters the data, trends or alerts: every number comes from the satellite data and the statistical methods described above.

## Credits

NASA-ISRO SAR (NISAR), ASF DAAC · Landsat (NASA/USGS) · HLS (NASA) · SWOT (NASA/CNES) · GRACE/GRACE-FO (NASA/DLR/GFZ) · ESA CCI Land Cover · Impact Observatory/Esri · Microsoft Planetary Computer · Natural Earth.

A.R.K.O team · NASA Space Apps Challenge 2026.
