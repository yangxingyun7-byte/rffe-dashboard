"use client"

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Panel } from '@/components/panel'
import { KpiCard } from '@/components/kpi-card'
import { CoverageMatrix } from '@/components/coverage-matrix'
import { InstrumentDonut, CaseStatusBars } from '@/components/overview-charts'
import { CheckCircle2, CircleDashed, Layers, Boxes, Gauge, RefreshCw } from 'lucide-react'

// API 数据类型
interface RffeStats {
  totalDevices: number
  totalCases: number
  tested: number
  untested: number
  na: number
  coverage: number
  rsSolutionCount: number
  keysightSolutionCount: number
}

interface RffeDevice {
  name: string
  type: string
}

interface RffeTestCase {
  name: string
  path: string
}

interface RffeData {
  lastUpdated: string
  stats: RffeStats
  devices: RffeDevice[]
  testCases: RffeTestCase[]
  matrix: Record<string, Record<string, string>>
  caseDetails: Record<string, any>
}

// 仪表方案分布数据
function instrumentDistribution(data: RffeData | null) {
  if (!data) {
    return [
      { name: 'R&S 方案', value: 10, color: '#89b4fa' },
      { name: 'Keysight 方案', value: 4, color: '#fab387' },
    ]
  }
  return [
    { name: 'R&S 方案', value: data.stats.rsSolutionCount || 0, color: '#89b4fa' },
    { name: 'Keysight 方案', value: data.stats.keysightSolutionCount || 0, color: '#fab387' },
  ]
}

// 每个 Case 的已测/未测分布
function caseStatusDistribution(data: RffeData | null) {
  if (!data) return []
  return data.testCases.map((tc) => {
    let tested = 0
    let untested = 0
    data.devices.forEach((dev) => {
      const s = data.matrix[tc.name]?.[dev.name]
      if (s === 'tested') tested++
      else if (s === 'untested') untested++
    })
    return { name: tc.name, 已测: tested, 未测: untested }
  })
}

export default function OverviewPage() {
  const [data, setData] = useState<RffeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setData(result)
      setLastUpdated(new Date(result.lastUpdated).toLocaleString('zh-CN'))
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // 每 5 分钟自动刷新
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const stats = data?.stats || { totalDevices: 0, totalCases: 0, tested: 0, untested: 0, na: 0, coverage: 0 }
  const distData = instrumentDistribution(data)
  const caseData = caseStatusDistribution(data)

  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        {/* 标题栏 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
              射频前端测试总览
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              RFFE 器件 × 测试 Case 覆盖矩阵 · 数据自动同步自飞书多维表格
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                更新于 {lastUpdated}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            ⚠️ 数据加载失败: {error}
          </div>
        )}

        {/* KPI 卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard
            label="器件总数"
            value={stats.totalDevices}
            unit="款"
            icon={Boxes}
            accent="blue"
          />
          <KpiCard
            label="测试 Case"
            value={stats.totalCases}
            unit="项"
            icon={Layers}
            accent="purple"
          />
          <KpiCard
            label="已测试组合"
            value={stats.tested}
            icon={CheckCircle2}
            accent="green"
          />
          <KpiCard
            label="待测试组合"
            value={stats.untested}
            icon={CircleDashed}
            accent="yellow"
          />
          <KpiCard
            label="覆盖率"
            value={stats.coverage}
            unit="%"
            icon={Gauge}
            accent="peach"
          />
        </div>

        {/* 覆盖矩阵 + 方案分布 */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel
            title="覆盖矩阵 · COVERAGE MATRIX"
            subtitle="纵轴为测试 Case，横轴为器件型号"
            className="xl:col-span-2"
          >
            <CoverageMatrix />
          </Panel>

          <Panel title="仪表方案分布" subtitle="R&S vs Keysight 测试方案占比">
            <InstrumentDonut data={distData} />
          </Panel>
        </div>

        {/* 各 Case 测试进度 */}
        <div className="mt-6">
          <Panel
            title="各 Case 测试进度"
            subtitle="按测试 Case 统计的已测 / 未测器件数量"
          >
            <CaseStatusBars data={caseData} />
          </Panel>
        </div>
      </div>
    </main>
  )
}
