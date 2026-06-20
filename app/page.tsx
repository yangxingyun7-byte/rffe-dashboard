"use client";

import { Navigation } from "@/components/navigation";
import { Panel } from "@/components/panel";
import { KpiCard } from "@/components/kpi-card";
import { CoverageMatrix } from "@/components/coverage-matrix";
import { InstrumentDonut, CaseStatusBars } from "@/components/overview-charts";
import { DataSourcePanel } from "@/components/data-source-panel";
import { COLORS } from "@/lib/rffe-data";
import { useRffeData } from "@/lib/useRffeData";
import { CheckCircle2, CircleDashed, Layers, Boxes, Gauge } from "lucide-react";

export default function OverviewPage() {
  const source = useRffeData();
  const data = source.data;
  const stats = data?.stats;
  const instrumentData = data
    ? [
        { name: "R&S 方案", value: stats!.rsSolutionCount, color: COLORS.blue },
        {
          name: "Keysight 方案",
          value: stats!.keysightSolutionCount,
          color: COLORS.peach,
        },
      ]
    : [];
  const caseData =
    data?.testCases.map((testCase) => ({
      name: testCase.name,
      已测: Object.values(data.matrix[testCase.id]).filter(
        (item) => item === "tested",
      ).length,
      未测: Object.values(data.matrix[testCase.id]).filter(
        (item) => item === "untested",
      ).length,
    })) || [];

  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-wide text-foreground">
            射频前端测试总览
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            RFFE 器件 × 测试 Case 覆盖矩阵 · 数据每 1 分钟自动刷新
          </p>
        </div>

        <DataSourcePanel
          sourceUrl={source.sourceUrl}
          sourceLabel={data?.sourceLabel}
          lastUpdated={data?.lastUpdated}
          loading={source.loading}
          error={source.error}
          refreshMinutes={source.refreshMinutes}
          onSaveUrl={source.setSourceUrl}
          onRefresh={source.refresh}
          onSelectLocalFile={source.selectLocalFile}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard label="器件总数" value={stats?.totalDevices ?? 0} unit="款" icon={Boxes} accent="blue" />
          <KpiCard label="测试 Case" value={stats?.totalCases ?? 0} unit="项" icon={Layers} accent="purple" />
          <KpiCard label="已测试组合" value={stats?.tested ?? 0} icon={CheckCircle2} accent="green" />
          <KpiCard label="未测试组合" value={stats?.untested ?? 0} icon={CircleDashed} accent="yellow" />
          <KpiCard label="覆盖率" value={stats?.coverage ?? 0} unit="%" icon={Gauge} accent="peach" />
        </div>

        {data && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Panel
                title="覆盖矩阵 · COVERAGE MATRIX"
                subtitle="纵轴为测试 Case，横轴为器件型号"
                className="xl:col-span-2"
              >
                <CoverageMatrix
                  devices={data.devices}
                  testCases={data.testCases}
                  matrix={data.matrix}
                />
              </Panel>
              <Panel title="仪器方案分布" subtitle="R&S vs Keysight 测试方案占比">
                <InstrumentDonut data={instrumentData} />
              </Panel>
            </div>
            <div className="mt-6">
              <Panel
                title="各 Case 测试进度"
                subtitle="按测试 Case 统计的已测 / 未测器件数量"
              >
                <CaseStatusBars data={caseData} />
              </Panel>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
