// Tipos compartilhados do A.R.K.O

export type Src = 'demo' | 'real'
export type Lang = 'pt' | 'en'
export type View = 'inicio' | 'comparar' | 'celular' | 'tutoriais' | 'futuro'
export type EvType = 'fogo' | 'agua' | 'arvore' | 'solo' | 'vento'
export type AlertType = EvType | 'tornado'
export type TypeFilter = 'todos' | EvType
export type Level = 'Alto' | 'Médio' | 'Baixo'
export type PresetKey = '7d' | '30d' | '3m' | '6m' | '1a'
export type EvState = 'obs' | 'prev' | 'cl'

/** Um foco no mapa. x/y estão na grade do mapa (746 × 508). */
export interface Ev {
  id: string
  k: EvType
  x: number
  y: number
  /** tamanho relativo (exemplo) ou 1 (real) */
  n: number
  /** dias antes da data de referência */
  d: number
  st: EvState
  pl: string
  /** área em km² (só dados reais) */
  a?: number
  /** data ISO (só dados reais da linha do tempo) */
  date?: string
  /** dados reais: data comparada, Δ em dB, posição e valores HH/HV (antes, depois) quando gravados */
  vs?: string
  db?: number
  lon?: number
  lat?: number
  hh?: [number, number]
  hv?: [number, number]
}

export interface Info {
  t: string
  sub: string
  m: string
  d: string
  g: number
  st: string
  why: string
}

export interface Alert {
  id: string | null
  lvl: Level
  p: number
  t: string
  l: string
  ty: AlertType
  m: string
  pz: string
  src: 'NISAR' | 'ext'
  _x?: number
  _y?: number
}

export interface CmpEntry {
  A?: Record<string, number>
  B?: Record<string, number>
  why: string
  heat: [number, number, number][]
}

export interface CustomRange {
  a: number
  b: number
  label: string
}

/** Datas da comparação real formatadas (PT e EN) */
export interface RealDates {
  a: string
  b: string
  aEN: string
  bEN: string
  an: string
  bn: string
  anEN: string
  bnEN: string
  y: string
  n: number
}

// ---- formato dos arquivos gerados pelo pipeline (pipeline/atualizar.py) ----
export interface FocoJson {
  id: string
  tipo: 'agua' | 'solo' | 'arvore'
  lon: number
  lat: number
  area_km2: number
  grau: number
  delta_db: number
  local: string
  data?: string
  /** médias em dB no foco (gravadas pelo pipeline a partir de nov/2026) */
  hh_antes?: number
  hh_depois?: number
  hv_antes?: number
  hv_depois?: number
}

export interface FocosAppJson {
  fonte: string
  antes: { data: string; produto: string }
  depois: { data: string; produto: string }
  area: { oeste: number; sul: number; leste: number; norte: number }
  focos: FocoJson[]
  imagem: { arquivo: string; oeste: number; leste: number; norte: number; sul: number; data: string }
}

export interface PassagemJson {
  data: string
  produto: string
  imagem: string | null
  comparado_com: string | null
  focos: FocoJson[]
  resumo: { focos: number; por_tipo: Record<string, number>; area_km2: Record<string, number> }
}

export interface LinhaTempoJson {
  passagens: PassagemJson[]
  recorte: { oeste: number; leste: number; norte: number; sul: number }
  atualizado_em?: string
}
