# A.R.K.O — Advanced Reconnaissance & Knowledge Operations

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Leia em português](README.pt-BR.md)

A.R.K.O turns NISAR satellite radar (NASA-ISRO) into simple alerts, maps and answers about floods, fires and deforestation, for people who must act fast (Civil Defense) and people who teach and research (schools, universities). The Amazon is our pilot; the goal is any place on Earth that NISAR observes.

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
