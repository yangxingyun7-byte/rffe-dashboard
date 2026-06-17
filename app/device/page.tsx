import { Navigation } from '@/components/navigation'
import { DeviceDetail } from '@/components/device-detail'

export default function DevicePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
            器件测试详情
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            单器件维度的综合性能雷达与全 Case 测试状态汇总
          </p>
        </div>
        <DeviceDetail />
      </div>
    </main>
  )
}
