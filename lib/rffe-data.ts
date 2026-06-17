// RFFE 射频前端测试平台 — 数据模型与 mock 数据

export type Status = 'tested' | 'untested' | 'na'
export type Path = 'TX' | 'PRX' | 'DRX'

export interface Device {
  id: string
  type: string
  band: string
}

export interface TestCase {
  id: string
  name: string
  paths: Path[]
  instruments: string[]
}

export const DEVICES: Device[] = [
  { id: 'QM77055', type: 'LB L-PAMID', band: 'Low Band' },
  { id: 'QM77048', type: 'MHB L-PAMID', band: 'Mid-High Band' },
  { id: 'VC7535-88', type: 'CBL L-PAMIF', band: 'C-Band' },
  { id: 'QM78218', type: '多模多频', band: 'Sub-6G' },
  { id: 'QM78318', type: '多模多频', band: 'Sub-6G' },
  { id: 'VC7579', type: '多模多频', band: 'Sub-6G' },
  { id: 'VC8016', type: 'LMHB PA', band: 'Low-Mid-High' },
  { id: 'VC7514', type: 'Sub7G UHB PA', band: 'Ultra High' },
  { id: 'MXD98M9EA', type: 'D-FEM', band: 'D-band' },
  { id: 'MXD9823AT', type: 'D-FEM', band: 'D-band' },
  { id: 'VC3726M', type: 'D-FEM', band: 'D-band' },
  { id: 'VC7551', type: 'MHB PA', band: 'Mid-High Band' },
  { id: 'QM81000', type: 'GNSS LNA', band: 'GNSS' },
]

export const CASES: TestCase[] = [
  { id: 'PA_DROOP', name: 'PA DROOP', paths: ['TX'], instruments: ['ZNB8'] },
  { id: 'PA_AMAM', name: 'PA AM-AM', paths: ['TX'], instruments: ['ZNB8'] },
  { id: 'IMD35', name: 'IMD3/5', paths: ['TX'], instruments: ['FSW26+SMM100A', 'N9021B+M9484C'] },
  { id: 'PA_HARM', name: 'PA Harmonic', paths: ['TX'], instruments: ['FSW26+SMM100A', 'N9021B+N5183B'] },
  { id: 'TX_ACLR', name: 'TX ACLR', paths: ['TX'], instruments: ['FSW26+SMM100A'] },
  { id: 'TX_EVM', name: 'TX EVM', paths: ['TX'], instruments: ['FSW26+SMM100A'] },
  { id: 'PWR_CUR', name: 'Power VS Current', paths: ['TX'], instruments: ['FSW26+SMM100A'] },
  { id: 'VRAMP_2G', name: '2G Vramp', paths: ['TX'], instruments: ['FSW26+SMM100A'] },
  { id: 'CHIP_VRAMP', name: 'Chip Vramp', paths: ['TX'], instruments: ['FSW26+SMM100A'] },
  { id: 'TRX_ISO', name: 'TRX ISOLATION', paths: ['PRX'], instruments: ['ZNB8', 'N9021B+N5183B'] },
  { id: 'LNA_DROOP', name: 'LNA DROOP', paths: ['PRX', 'DRX'], instruments: ['ZNB8'] },
  { id: 'LNA_PHASE', name: 'LNA Phase Error', paths: ['PRX', 'DRX'], instruments: ['ZNB8'] },
  { id: 'LNA_IP3', name: 'LNA IP3', paths: ['PRX', 'DRX'], instruments: ['FSW26+SMM100A', 'N9021B+M9484C'] },
  { id: 'RX_NF', name: 'RX Noise Figure', paths: ['PRX', 'DRX'], instruments: ['FSW26'] },
]

// 颜色常量（Catppuccin Mocha）
export const COLORS = {
  blue: '#89b4fa',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  red: '#f38ba8',
  purple: '#cba6f7',
  teal: '#94e2d5',
  peach: '#fab387',
  grid: '#313244',
  border: '#45475a',
  muted: '#a6adc8',
}

// 确定性伪随机，保证每次渲染一致
function seeded(a: number, b: number) {
  const x = Math.sin(a * 374.761 + b * 91.137) * 43758.5453
  return x - Math.floor(x)
}

// 生成 14×13 状态矩阵（稀疏）
export function buildMatrix(): Record<string, Record<string, Status>> {
  const matrix: Record<string, Record<string, Status>> = {}
  CASES.forEach((c, ci) => {
    matrix[c.id] = {}
    DEVICES.forEach((d, di) => {
      const r = seeded(ci + 1, di + 1)
      // D-FEM 器件无 TX case；GNSS LNA 仅 RX
      const isDFem = d.type === 'D-FEM' || d.type === 'GNSS LNA'
      const isTxCase = c.paths.includes('TX')
      if (isDFem && isTxCase) {
        matrix[c.id][d.id] = 'na'
      } else if (r > 0.78) {
        matrix[c.id][d.id] = 'untested'
      } else if (r > 0.12) {
        matrix[c.id][d.id] = 'tested'
      } else {
        matrix[c.id][d.id] = 'na'
      }
    })
  })
  return matrix
}

export const MATRIX = buildMatrix()

export function matrixStats() {
  let tested = 0
  let untested = 0
  let na = 0
  CASES.forEach((c) =>
    DEVICES.forEach((d) => {
      const s = MATRIX[c.id][d.id]
      if (s === 'tested') tested++
      else if (s === 'untested') untested++
      else na++
    }),
  )
  const total = tested + untested
  return {
    tested,
    untested,
    na,
    coverage: total === 0 ? 0 : Math.round((tested / total) * 100),
    totalCells: CASES.length * DEVICES.length,
  }
}

// 仪表方案分布
export function instrumentDistribution() {
  let rs = 0
  let ks = 0
  CASES.forEach((c) =>
    DEVICES.forEach((d) => {
      if (MATRIX[c.id][d.id] !== 'tested') return
      // 简化：含 FSW/SMM/ZNB 记为 R&S，否则按确定性比例分给 Keysight
      const hasKs = c.instruments.some((i) => i.includes('N9021') || i.includes('N5183') || i.includes('M9484'))
      if (hasKs && seeded(c.name.length, d.id.length) > 0.5) ks++
      else rs++
    }),
  )
  return [
    { name: 'R&S 方案', value: rs, color: COLORS.blue },
    { name: 'Keysight 方案', value: ks, color: COLORS.peach },
  ]
}

// 每个 Case 的已测/未测分布（用于堆叠柱状）
export function caseStatusDistribution() {
  return CASES.map((c) => {
    let tested = 0
    let untested = 0
    DEVICES.forEach((d) => {
      const s = MATRIX[c.id][d.id]
      if (s === 'tested') tested++
      else if (s === 'untested') untested++
    })
    return { name: c.name, 已测: tested, 未测: untested }
  })
}

// ---------- TX 数据 ----------

const TX_DEVICES = DEVICES.filter((d) => d.type !== 'D-FEM' && d.type !== 'GNSS LNA')
const BANDS = ['B1', 'B3', 'B7', 'B8', 'B41']

export interface DroopRow {
  device: string
  band: string
  auto: number
  manual: number
  datasheet: number
}

export function paDroopData(): DroopRow[] {
  const rows: DroopRow[] = []
  TX_DEVICES.slice(0, 6).forEach((d, di) => {
    BANDS.slice(0, 2).forEach((band, bi) => {
      const base = 0.7 + seeded(di + 2, bi + 5) * 0.9
      rows.push({
        device: d.id,
        band,
        auto: +(base + 0.05).toFixed(2),
        manual: +(base + 0.08).toFixed(2),
        datasheet: +(base - 0.18).toFixed(2),
      })
    })
  })
  return rows
}

export interface ImdRow {
  freq: number
  imd3L: number
  imd3R: number
  imd5L: number
  imd5R: number
}

export function imdData(device: string): ImdRow[] {
  return Array.from({ length: 9 }, (_, i) => {
    const freq = 700 + i * 250
    const r = seeded(device.length + i, i + 3)
    return {
      freq,
      imd3L: +(-42 - r * 12).toFixed(1),
      imd3R: +(-41 - seeded(i, device.length) * 12).toFixed(1),
      imd5L: +(-58 - r * 10).toFixed(1),
      imd5R: +(-57 - seeded(i + 1, device.length) * 10).toFixed(1),
    }
  })
}

export function harmonicData(): { device: string; h2: number; h3: number; h4: number }[] {
  return TX_DEVICES.slice(0, 7).map((d, i) => ({
    device: d.id,
    h2: +(-38 - seeded(i, 2) * 14).toFixed(1),
    h3: +(-46 - seeded(i, 3) * 14).toFixed(1),
    h4: +(-55 - seeded(i, 4) * 12).toFixed(1),
  }))
}

export function aclrEvmData(): { device: string; aclr: number; evm: number; current: number }[] {
  return TX_DEVICES.slice(0, 10).map((d, i) => ({
    device: d.id,
    aclr: +(-(36 + seeded(i, 7) * 8)).toFixed(1),
    evm: +(1.2 + seeded(i, 8) * 2.6).toFixed(2),
    current: +(120 + seeded(i, 9) * 180).toFixed(0),
  }))
}

export function powerCurrentData(device: string): { pout: number; current: number; pae: number }[] {
  return Array.from({ length: 11 }, (_, i) => {
    const pout = 10 + i * 1.8
    const r = seeded(device.length, i)
    return {
      pout: +pout.toFixed(1),
      current: +(80 + Math.pow(i, 1.7) * 6 + r * 20).toFixed(0),
      pae: +(8 + i * 3.4 - Math.pow(Math.max(0, i - 7), 2) * 1.5 + r * 3).toFixed(1),
    }
  })
}

// ---------- RX 数据 ----------

const RX_DEVICES = DEVICES.filter((d) => d.type === 'D-FEM' || d.type === 'GNSS LNA' || d.type.includes('LNA') || d.type === 'CBL L-PAMIF')

export function lnaDroopHeatmap(): { device: string; values: { gain: string; droop: number }[] }[] {
  const gains = ['G0', 'G1', 'G2', 'G3']
  return RX_DEVICES.slice(0, 6).map((d, di) => ({
    device: d.id,
    values: gains.map((gain, gi) => ({
      gain,
      droop: +(0.4 + seeded(di + 3, gi + 2) * 1.4).toFixed(2),
    })),
  }))
}

export function ip3Data(): { device: string; iip3: number; oip3: number; datasheet: number; gap: number }[] {
  return RX_DEVICES.slice(0, 6).map((d, i) => {
    const iip3 = +(-1 + seeded(i, 11) * 3).toFixed(2)
    const ds = +(iip3 - (seeded(i, 12) - 0.3) * 0.8).toFixed(2)
    return {
      device: d.id,
      iip3,
      oip3: +(iip3 + 14 + seeded(i, 13) * 2).toFixed(2),
      datasheet: ds,
      gap: +(iip3 - ds).toFixed(2),
    }
  })
}

export function nfData(device: string): { freq: number; nf: number; datasheet: number }[] {
  return Array.from({ length: 10 }, (_, i) => {
    const freq = 600 + i * 300
    const r = seeded(device.length, i + 20)
    return {
      freq,
      nf: +(0.9 + r * 0.7 + i * 0.04).toFixed(2),
      datasheet: +(1.1 + i * 0.03).toFixed(2),
    }
  })
}

export function phaseErrorData(device: string): { angle: number; error: number }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    error: +(2 + seeded(device.length, i + 30) * 4).toFixed(2),
  }))
}

// ---------- 器件详情雷达 ----------
export function deviceRadar(device: string) {
  const metrics = ['Droop', 'IMD3', 'Harmonic', 'ACLR', 'EVM', '效率']
  return metrics.map((m, i) => ({
    metric: m,
    value: +(55 + seeded(device.length + i, i + 40) * 42).toFixed(0),
    datasheet: +(60 + seeded(device.length + i, i + 41) * 35).toFixed(0),
  }))
}

export function deviceById(id: string): Device | undefined {
  return DEVICES.find((d) => d.id === id)
}

// 器件在矩阵中的覆盖统计
export function deviceCoverage(id: string) {
  let tested = 0
  let untested = 0
  let na = 0
  CASES.forEach((c) => {
    const s = MATRIX[c.id][id]
    if (s === 'tested') tested++
    else if (s === 'untested') untested++
    else na++
  })
  return { tested, untested, na }
}
