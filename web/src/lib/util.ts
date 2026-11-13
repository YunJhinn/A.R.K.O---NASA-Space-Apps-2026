import { MAP_H, MAP_W, MES, REF } from './demo'

export const rgba = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}
/** posição em % dentro do mapa (grade 746 × 508) */
export const pos = (x: number, y: number) => ({ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%` })
export const ago = (dt: Date) => Math.round((REF.getTime() - dt.getTime()) / 864e5)
export const evMonth = (d: number) => {
  const dt = new Date(REF.getTime() - d * 864e5)
  return MES.find(m => m[2] === dt.getMonth()) ?? MES[0]
}
export const kmf = (x: number) => x.toFixed(2).replace('.', ',') + ' km²'
export const dbf = (x: number) => Number(x).toFixed(1).replace('.', ',')
export const lvlOf = (g: number) => (g >= 81 ? 'Extremo' : g >= 51 ? 'Alto' : g >= 21 ? 'Moderado' : 'Estável')
export const p2 = (n: number) => String(n).padStart(2, '0')

const MN_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MN_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtD(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return {
    pt: `${d} ${MN_PT[m - 1]}`, en: `${MN_EN[m - 1]} ${d}`, num: `${p2(d)}/${p2(m)}`, numEN: `${p2(m)}/${p2(d)}`,
    y: String(y), date: new Date(y, m - 1, d),
  }
}
export const iso = (dt: Date) => `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
