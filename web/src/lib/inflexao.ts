// v7.6 · Ponto de inflexão: o ano em que o padrão de longo prazo mudou.
// Fenômenos lentos (esvaziamento de aquífero, assoreamento, perda de mata) não "disparam" um alerta num dia:
// o sinal é a MUDANÇA DE PADRÃO. Procuramos o ano que melhor divide a série em dois trechos com tendências
// diferentes (Theil–Sen em cada trecho) e só aceitamos se:
//   · cada trecho tem pelo menos 6 anos;
//   · dividir explica ≥ 35% da variação que uma reta única não explica;
//   · a diferença entre as tendências é ≥ 6× o erro aproximado da inclinação.
// Calibrado nos 9 aquíferos do GRACE para não acusar quebra em tudo (testado em 2026-11-15).
export interface Inflexao {
  ano: number; antes: number; depois: number; sig: boolean; ganho: number
  /** a quebra cai na troca de satélite GRACE → GRACE-FO (2017–2019): confirmar antes de concluir */
  costura: boolean
  /** anos até passar o pior valor já registrado, se o novo ritmo continuar (só quando piora) */
  anosAtePior: number | null; pior: number; anoPior: number
}

function ts(x: number[], y: number[]) {
  const s: number[] = []
  for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) if (x[j] !== x[i]) s.push((y[j] - y[i]) / (x[j] - x[i]))
  s.sort((a, b) => a - b)
  const m = s.length ? s[Math.floor(s.length / 2)] : 0
  const r = y.map((v, i) => v - m * x[i]).sort((a, b) => a - b)
  return { m, b: r[Math.floor(r.length / 2)] }
}

/** bom: 'alto' quando valor maior é melhor (água guardada, mata ciliar), 'baixo' quando menor é melhor (turbidez) */
export function inflexao(x: number[], y: number[], bom: 'alto' | 'baixo' = 'alto', minseg = 6): Inflexao | null {
  const n = x.length
  if (n < 2 * minseg) return null
  const sse = (xs: number[], ys: number[], m: number, b: number) => ys.reduce((t, v, i) => t + (v - (m * xs[i] + b)) ** 2, 0)
  const g = ts(x, y), sse0 = sse(x, y, g.m, g.b)
  let best: { s: number; k: number; mA: number; mD: number; bD: number } | null = null
  for (let k = minseg; k <= n - minseg; k++) {
    const A = ts(x.slice(0, k), y.slice(0, k)), D = ts(x.slice(k), y.slice(k))
    const s = sse(x.slice(0, k), y.slice(0, k), A.m, A.b) + sse(x.slice(k), y.slice(k), D.m, D.b)
    if (!best || s < best.s) best = { s, k, mA: A.m, mD: D.m, bD: D.b }
  }
  if (!best) return null
  const ganho = sse0 > 0 ? 1 - best.s / sse0 : 0
  const xm = x.reduce((t, v) => t + v, 0) / n
  const se = Math.sqrt(best.s / Math.max(1, n - 4)) / Math.sqrt(x.reduce((t, v) => t + (v - xm) ** 2, 0))
  const sig = ganho >= 0.35 && Math.abs(best.mD - best.mA) >= 6 * se
  const ano = x[best.k]
  const sinal = bom === 'alto' ? 1 : -1
  let iPior = 0; y.forEach((v, i) => { if (sinal * v < sinal * y[iPior]) iPior = i })
  const pior = y[iPior], ult = best.mD * x[n - 1] + best.bD
  const piora = sinal * best.mD < 0
  const anosAtePior = sig && piora && sinal * (ult - pior) > 0 ? Math.round(((ult - pior) / -best.mD) * 10) / 10 : null
  return { ano, antes: best.mA, depois: best.mD, sig, ganho, costura: ano >= 2017 && ano <= 2019, anosAtePior, pior, anoPior: x[iPior] }
}
