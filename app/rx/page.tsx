import { Navigation } from '@/components/navigation'
import { Panel } from '@/components/panel'
import {
  LnaDroopHeatmap,
  Ip3Chart,
  NfChart,
  PhaseErrorChart,
} from '@/components/rx-charts'

export default function RxPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-md border border-rf-green/40 bg-rf-green/10 px-2 py-1 font-heading text-xs font-bold tracking-wider text-rf-green">
            RX PATH
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
              接收通路测试结果
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              LNA Droop · LNA IP3 · Noise Figure · Phase Error（含 PRX / DRX）
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel
            title="LNA DROOP 热力图"
            subtitle="器件 × 增益档增益平坦度 (dB)"
          >
            <LnaDroopHeatmap />
          </Panel>

          <Panel title="LNA IP3" subtitle="IIP3 / OIP3 实测 vs 规格书 (dBm)">
            <Ip3Chart />
          </Panel>

          <Panel
            title="RX Noise Figure"
            subtitle="噪声系数 vs 频率，与规格书对比"
          >
            <NfChart />
          </Panel>

          <Panel
            title="LNA Phase Error"
            subtitle="不同相位状态下的相位误差 (°)"
          >
            <PhaseErrorChart />
          </Panel>
        </div>
      </div>
    </main>
  )
}
