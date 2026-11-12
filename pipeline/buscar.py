"""A.R.K.O · NASA Space Apps 2026
EN: step 1 - list NISAR GCOV passes over an area and period (ASF DAAC).
PT: passo 1 - lista as passagens NISAR GCOV sobre uma area e um periodo (ASF DAAC).
"""
"""Passo 1: lista as passagens do NISAR (GCOV) sobre a area do piloto."""
import json, re, earthaccess

BBOX = (-61.5, -4.0, -59.0, -2.5)          # oeste, sul, leste, norte (regiao de Manaus)
PERIODOS = {"antes": ("2026-09-01", "2026-09-30"), "depois": ("2026-10-20", "2026-11-10")}

out = {}
for nome, (ini, fim) in PERIODOS.items():
    res = earthaccess.search_data(short_name="NISAR_L2_GCOV_PROVISIONAL_V1",
                                  bounding_box=BBOX, temporal=(ini, fim))
    lst = []
    for g in res:
        n = g["umm"]["GranuleUR"]
        size = g.size if isinstance(getattr(g,"size",None),(int,float)) else g.size()
        lst.append({"nome": n, "mb": round(size or 0, 1), "links": g.data_links()[:1]})
    out[nome] = lst
    print(f"\n{nome.upper()} ({ini} a {fim}): {len(lst)} produtos")
    for x in lst:
        print("  ", x["nome"], f'{x["mb"]} MB')

json.dump(out, open("busca.json", "w"), indent=1)
print("\nSalvo em busca.json")
