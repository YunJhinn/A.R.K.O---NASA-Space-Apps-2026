# A.R.K.O Rivers — Advanced Reconnaissance & Knowledge Operations

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Leia em português](README.pt-BR.md)

A.R.K.O Rivers uses NASA satellites to **conserve the rivers that supply drinking water**. For each river it tells, year by year since 1985, what happened to the water (turbidity, water area, riverside forest, bare banks, glacier ice), why it probably happened, where it is heading by 2030 if nothing changes, and who can act. Less than 1% of Earth's water is fresh and available to drink, and rivers are where we are degrading it.

## A.R.K.O Rivers in one minute

| Layer | Satellite | Years | What it shows |
| --- | --- | --- | --- |
| River history | **Landsat 4–9** (NASA/USGS) | 1985 → today | Water turbidity, water area, riverside forest, bare soil on the banks, glacier ice |
| River level | **SWOT** (NASA/CNES) | 2023 → today | Water surface height of the river reach that supplies the city |
| Continuous monitor | **HLS** (NASA: Landsat 8/9 + Sentinel-2) | every 2–5 days (cloud-free) | Each new image compared with the normal for its month; out-of-normal images become alerts |
| River now | **NISAR** (NASA/ISRO) | every ~12 days | New water, receding water and banks losing vegetation, through clouds |
| Aquifers | **GRACE / GRACE-FO** (NASA/DLR/GFZ) | 2002 → today, monthly | Water stored under and on the ground over 7 aquifers; stricter alert because damage is almost irreversible |
| Risks in the basin | **LHASA** and **FIRMS** (NASA) | daily | Extreme rain (sediment) and fire (ash and soil) |

**10 rivers (4 in Goiás: João Leite reservoir and Meia Ponte, which supply Goiânia, Araguaia at Aruanã and Serra da Mesa) and 7 aquifers (Goiás, Urucuia, Guarani, Greater Amazon, Bengal, NW India, Ogallala).** Also: Tapajós (gold mining), Madeira (dredges and clearing), Guaíba in Porto Alegre (city and floods), Dhaka's rivers (city growing over water), Trishuli headwaters in Nepal (melting ice) and Massingir Dam in Mozambique (droughts).

**Validated against real records (4 of 4):** the 1980s–90s gold rush and the 2019–2022 gold rush on the Tapajós (Lobo et al. 2015; MapBiomas), the record low water of 2024 at Itaituba (Geological Survey of Brazil) and the refilling of Massingir Dam after its 2006 repair. See `docs/arko_rios_metodo.md`.

**What it cannot see:** sewage chemicals, pesticides and microplastics are not visible from space. The satellite shows the visible effect and tells where and when to collect lab samples.

Scripts: `pipeline/rios_landsat.py` (40-year series, open data, no login) and `pipeline/rios_swot.py` (river level, open Hydrocron API). Also `pipeline/rios_hls.py` (continuous monitor, incremental). The daily robot refreshes HLS, SWOT and NISAR.

---

*Earlier versions of A.R.K.O focused on disaster alerts; that work is still in the app ("River now", "Alerts") and in the history below.*


## What is in this repository

| Folder | What it holds |
| --- | --- |
| `web/` | **App source (v2.0): React + TypeScript + Tailwind.** Run `npm install` and `npm run dev` inside `web/`. See `web/README.md`. |
| `app/` | The published app (built from `web/` by GitHub Actions). Open it on GitHub Pages. PT / EN, *Example / Real NISAR*, region and world search in the left menu and header. |
| `pipeline/` | Python scripts that search, read and compare real NISAR data and write the detections and timeline files. |
| `data/` | Results from real NISAR data: `focos.json`, `focos.geojson` (open in QGIS or geojson.io) and the radar image. |
| `docs/` | Links to the pitch, roadmap, design-thinking documents and Figma. |

## Real data, step by step

We compared two real NISAR passes over the Madeira River (Amazonas, Brazil): **September 3** and **October 21, 2026**, same orbit (track 132, frame 175). Result: **10 detections** (7 vegetation loss, 2 water that disappeared in the drought, 1 new water).

1. **Search** — `buscar.py` lists NISAR passes (GCOV product, L-band) for an area and period in NASA's public archive (ASF DAAC).
2. **Compare** — `processar.py` streams only the needed part of two passes (~80 m grid), compares the radar signal point by point and flags changes:
   - new water: HH drops more than 4 dB and falls below −16 dB
   - water gone: the reverse
   - vegetation loss: HV drops more than 2.5 dB where there was forest
3. **Build app files** — `imagem_app.py` groups changes into detections (area in km², 0–100 degree of change, nearest town) and draws the background radar image.
4. **Show** — the prototype has two modes, *Example* and *Real NISAR*. The switch (left menu and map) changes the whole app: top numbers, map, alerts, comparison, mobile view and onboarding.

### Run it yourself

```bash
cd pipeline
python -m venv .venv
.venv/Scripts/activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python login.py               # once: your free NASA Earthdata account (urs.earthdata.nasa.gov)
python buscar.py              # list passes
python processar.py           # compare two passes -> focos.json + conferencia.png
python imagem_app.py          # radar image + focos_app.json
```

To run another region of the world, change `BBOX` / dates in `buscar.py` and the two product names in `processar.py`.

## Honest limits

- Radar alone cannot tell clearing from fire, so we label it **vegetation loss**.
- Thresholds are simple and not yet validated with field data.
- Wind and tornado alerts in the prototype come from weather models, not NISAR, and are marked **external source**. Items in *Example* mode are illustrative.

## Data source and credit

NASA-ISRO Synthetic Aperture Radar (NISAR) — L-band GCOV, PROVISIONAL release, distributed by the Alaska Satellite Facility DAAC (ASF DAAC). NISAR data are open and free. Basemap: Natural Earth.

## Team

Team A.R.K.O · NASA Space Apps Challenge 2026.

## Automatic updates

`pipeline/atualizar.py` runs every day on GitHub Actions (`.github/workflows/atualizar-nisar.yml`):

1. It lists the NISAR passes of the pilot orbit (track 132, frame 175) on ASF DAAC.
2. If there is a newer pass, it compares it with a pass at least 45 days earlier of the same orbit.
3. It rewrites `data/` (`focos_app.json`, `radar.jpg`, `focos.geojson`, `historico.json`) and adds the new pass to the timeline (`linha_tempo.json` + `radar/YYYY-MM-DD.jpg`), then commits.
4. The app reads `data/focos_app.json` and `data/linha_tempo.json` when it opens, so the *Real NISAR* mode and the animated timeline always show the newest passes, with no rebuild.

Setup (once): add the repository secrets `EARTHDATA_USERNAME` and `EARTHDATA_PASSWORD` (Settings → Secrets and variables → Actions). To run it now: Actions → *Atualizar dados NISAR* → Run workflow.

## v2.0 — what is new

- **App rebuilt in React + TypeScript + Tailwind** (`web/`), Python stays as the data pipeline (`pipeline/`).
- **Weather-broadcast style**: dark radar maps, illustrated 3D icons, main data panel and *Risk alert* panel.
- **Animated timeline** under the map: one point per real NISAR pass, updated automatically every ~12 days. Pick a date, drag or press play.
- **Compare periods** shows the icons on both sides and the number of detections by type.
- **World search**: type any place (OpenStreetMap). Places inside a region with data open that region with a pin; others show which regions have data.
- **Two example regions**: Amazon (pilot, also with real NISAR data) and Southern Brazil (floods and windstorms).

Full guide to the project files: `docs/DOCUMENTACAO.pdf` (Portuguese).
