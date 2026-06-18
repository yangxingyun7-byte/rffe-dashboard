"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// RFFE 数据 Hook
// 从后端 API 获取飞书表格数据
// ============================================================

export interface RffeDevice {
  name: string;
  type: string;
}

export interface RffeTestCase {
  name: string;
  path: string;
}

export interface RffeStats {
  totalDevices: number;
  totalCases: number;
  tested: number;
  untested: number;
  na: number;
  coverage: number;
  rsSolutionCount: number;
  keysightSolutionCount: number;
}

export interface RffeData {
  lastUpdated: string;
  spreadsheetUrl: string;
  devices: RffeDevice[];
  testCases: RffeTestCase[];
  matrix: Record<string, Record<string, "tested" | "untested" | "na">>;
  caseDetails: Record<string, any>;
  stats: RffeStats;
}

interface UseRffeDataResult {
  data: RffeData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRffeData(): UseRffeDataResult {
  const [data, setData] = useState<RffeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/rffe-dashboard/api/data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "数据加载失败");
      console.error("Failed to fetch RFFE data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // 每 5 分钟自动刷新
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
