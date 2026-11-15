// v7.9 · Cenários futuros "se nada mudar": comparação com a década anterior, limite crítico explícito
// e faixa de incerteza. É um CENÁRIO (tendência estendida), não uma previsão: chuva, políticas e obras mudam o rumo.
import type { Inflexao } from './inflexao'

export interface Cenario {
  /** último ano e quanto ele ficou acima/abaixo da média dos 10 anos anteriores (%) */
  ano: number; vsDecada: number | null; decadaTxt: string
  /** ano desde o qual a medida está sempre do lado ruim da média da década anterior (3+ anos seguidos) */
  desde: number | null
  /** ritmo usado (por ano) e de onde ele vem */
  ritmo: number; ritmoDe: 'inflexao' | 'recente'; ritmoIni: number
  limite: number
  /** ano em que cruza o limite: central e faixa provável (16–84% das inclinações); null = não chega nesse ritmo */
  cruza: number | null; faixa: [number, number] | null
  /** já passou do limite: ano em que passou */
  jaPassou: number | null
  /** cruza só depois do horizonte de 50 anos (não mostramos ano tão distante) */
  longe: boolean; horizonte: number
  /** a tendência já cruzou o limite, mas os últimos anos ainda oscilam em volta dele */
  noLimite: boolean
}
const HORIZONTE = 50

const q = (a: number[], f: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.floor(f * (s.length - 1))))] }

/** bom 'alto' = maior é melhor; o limite é cruzado quando o valor fica do lado ruim dele */
export function cenario(x: number[], y: number[], bom: 'alto' | 'baixo', limite: number, inf: Inflexao | null): Cenario | null {
  const n = x.length
  if (n < 8) return null
  const ruim = (v: number) => (bom === 'alto' ? v < limite : v > limite)
  const pior = (v: number, ref: number) => (bom === 'alto' ? v < ref : v > ref)
  // comparação com a década anterior
  const media10 = (i: number) => { const w = y.filter((_, j) => x[j] < x[i] && x[j] >= x[i] - 10); return w.length >= 5 ? w.reduce((t, v) => t + v, 0) / w.length : null }
  const u3 = y.slice(-3), med3 = q(u3, 0.5), a3 = x[n - 3]
  const jan = x.filter(a => a < a3 && a >= a3 - 10), wv = y.filter((_, j) => x[j] < a3 && x[j] >= a3 - 10)
  const mU = wv.length >= 4 ? wv.reduce((t, v) => t + v, 0) / wv.length : null
  const vsDecada = mU ? ((med3 - mU) / Math.abs(mU)) * 100 : null
  const decadaTxt = jan.length ? `${x[n - 3]}–${x[n - 1]} vs ${jan[0]}–${jan[jan.length - 1]}` : ''
  let desde: number | null = null
  for (let i = n - 1; i >= 0; i--) { const m = media10(i); if (m == null || !pior(y[i], m)) break; desde = x[i] }
  if (desde != null && x.filter(a => a >= desde!).length < 3) desde = null
  // ritmo: depois da inflexão (se houver) ou dos últimos 15 anos
  const ini = inf?.sig ? inf.ano : Math.max(x[0], x[n - 1] - 15)
  const xs = x.filter(a => a >= ini), ys = y.filter((_, i) => x[i] >= ini)
  const sl: number[] = []
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) if (xs[j] !== xs[i]) sl.push((ys[j] - ys[i]) / (xs[j] - xs[i]))
  if (!sl.length) return null
  const m = q(sl, 0.5), mLo = q(sl, 0.16), mHi = q(sl, 0.84)
  const b = q(ys.map((v, i) => v - m * xs[i]), 0.5)
  const atual = m * x[n - 1] + b
  // já passou?
  let jaPassou: number | null = null
  // já passou: a mediana dos últimos 3 anos e a tendência estão do lado ruim (um ano isolado não basta)
  if (ruim(med3) && ruim(atual)) { for (let i = n - 1; i >= 0 && ruim(q(y.slice(Math.max(0, i - 2), i + 1), 0.5)); i--) jaPassou = x[i] }
  const ate = (mm: number) => {
    const indoParaLimite = bom === 'alto' ? mm < 0 : mm > 0
    if (!indoParaLimite || jaPassou != null) return null
    const t = (limite - atual) / mm
    return t > 0 ? x[n - 1] + t : null
  }
  const horizonte = x[n - 1] + HORIZONTE
  const c0 = ate(m), longe = c0 != null && c0 > horizonte, c = longe ? null : c0
  const ext = [ate(mLo), ate(mHi)].filter((v): v is number => v != null)
  const hi = ext.length === 2 ? Math.max(c ?? 0, ...ext) : Infinity
  const faixa = c != null ? [Math.round(Math.min(c, ...ext)), hi > horizonte ? Infinity : Math.round(hi)] as [number, number] : null
  return { ano: x[n - 1], vsDecada, decadaTxt, desde, ritmo: m, ritmoDe: inf?.sig ? 'inflexao' : 'recente', ritmoIni: ini, limite,
    cruza: c != null ? Math.round(c) : null, faixa, jaPassou, longe, horizonte, noLimite: jaPassou == null && ruim(atual) }
}
