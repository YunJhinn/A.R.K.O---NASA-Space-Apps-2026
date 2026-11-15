// v7.13 · Recorte do radar em volta do rio monitorado. A passagem do NISAR cobre ~300 km e pega todos os rios da
// área (ex.: o delta inteiro em Bangladesh); o trecho de referência do Landsat tem ~15–20 km. Para os números falarem
// do mesmo lugar, o padrão é mostrar só o que o radar viu a até RAIO km desse trecho. A caixa é a mesma de
// pipeline/rios_landsat.py (RIOS[...].bbox). O analista pode voltar para a passagem inteira.
export const RAIO_KM = 30
export const CORREDOR: Record<string, { bbox: [number, number, number, number]; nome: [string, string] }> = {
  tapajos: { bbox: [-56.05, -4.35, -55.90, -4.20], nome: ['Tapajós em Itaituba', 'Tapajós at Itaituba'] },
  amazonia: { bbox: [-60.45, -5.20, -60.30, -5.05], nome: ['Madeira em Novo Aripuanã', 'Madeira at Novo Aripuanã'] },
  sul: { bbox: [-51.32, -30.15, -51.20, -30.00], nome: ['Guaíba em Porto Alegre', 'Guaíba at Porto Alegre'] },
  bangladesh: { bbox: [90.32, 23.68, 90.47, 23.83], nome: ['Buriganga e Turag em Daca', 'Buriganga and Turag at Dhaka'] },
  nepal: { bbox: [85.55, 28.22, 85.72, 28.32], nome: ['geleiras do Langtang', 'Langtang glaciers'] },
  mocambique: { bbox: [32.90, -24.60, 33.05, -24.45], nome: ['Limpopo em Chókwè', 'Limpopo at Chókwè'] },
}
/** distância (km) de um ponto até a caixa do trecho de referência (0 se estiver dentro) */
export function kmAteCaixa(b: [number, number, number, number], lon?: number, lat?: number) {
  if (lon == null || lat == null) return Infinity
  const cx = Math.min(Math.max(lon, b[0]), b[2]), cy = Math.min(Math.max(lat, b[1]), b[3])
  return 111.32 * Math.hypot((lon - cx) * Math.cos((lat * Math.PI) / 180), lat - cy)
}
