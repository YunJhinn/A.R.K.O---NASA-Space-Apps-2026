# A.R.K.O — Advanced Reconnaissance & Knowledge Operations

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Leia em português](README.pt-BR.md)

A.R.K.O turns NISAR satellite radar (NASA-ISRO) into simple alerts, maps and answers about floods, fires and deforestation, for people who must act fast (Civil Defense) and people who teach and research (schools, universities). The Amazon is our pilot; the goal is any place on Earth that NISAR observes.

## What is in this repository

| Folder | What it holds |
| --- | --- |
| `app/` | The clickable prototype: one HTML file, no server. Open `app/index.html` in a browser. PT / EN switch and *Data: Example / Real NISAR* switch in the left menu. |
| `pipeline/` | Python scripts that search, read and compare real NISAR data and write the detections file. |
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
