import { Navigation } from '@/components/navigation'
import { Panel } from '@/components/panel'
import {
  DroopChart,
  ImdChart,
  HarmonicChart,
  AclrChart,
  PowerCurrentChart,
} from '@/components/tx-charts'

export default function TxPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-md border border-rf-blue/40 bg-rf-blue/10 px-2 py-1 font-heading text-xs font-bold tracking-wider text-rf-blue">
            TX PATH
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
              发射通路测试结果
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              PA Droop · IMD3/5 · 谐波 · ACLR/EVM · Power vs Current
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel
            title="PA DROOP"
            subtitle="自动测试 vs 手动测试 vs 规格书对比 (dB)"
          >
            <DroopChart />
          </Panel>

          <Panel
            title="IMD3 / IMD5"
            subtitle="互调失真 vs 频率，红色虚线为规格限值"
          >
            <ImdChart />
          </Panel>

          <Panel title="PA Harmonic" subtitle="二/三/四次谐波功率 (dBm)">
            <HarmonicChart />
          </Panel>

          <Panel title="TX ACLR / EVM" subtitle="邻道泄漏比与误差矢量幅度">
            <AclrChart />
          </Panel>

          <Panel
            title="Power vs Current"
            subtitle="输出功率扫描下的电流与效率 PAE"
            className="xl:col-span-2"
          >
            <PowerCurrentChart />
          </Panel>
        </div>
      </div>
    </main>
  )
}
