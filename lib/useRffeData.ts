"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { read, utils } from "xlsx";

export type RffeStatus = "tested" | "untested" | "na";

export interface RffeDevice {
  id: string;
  name: string;
  type: string;
}

export interface RffeTestCase {
  id: string;
  name: string;
  paths: string[];
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
  sourceLabel: string;
  devices: RffeDevice[];
  testCases: RffeTestCase[];
  matrix: Record<string, Record<string, RffeStatus>>;
  caseDetails: Record<string, { rsSolution: string; keysightSolution: string }>;
  stats: RffeStats;
}

const REFRESH_INTERVAL = 60 * 1000;
const DEFAULT_SOURCE = "/rffe-dashboard/data/control-table.xlsx";
const SOURCE_STORAGE_KEY = "rffe-dashboard-excel-url";

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function status(value: unknown): RffeStatus {
  const valueText = text(value);
  if (valueText === "已测") return "tested";
  if (valueText === "未测") return "untested";
  return "na";
}

function parseWorkbook(buffer: ArrayBuffer, sourceLabel: string): RffeData {
  const workbook = read(buffer, { type: "array" });
  const worksheet = workbook.Sheets["RFFE Case control table"];
  if (!worksheet) throw new Error("未找到工作表：RFFE Case control table");

  const rows = utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  const deviceIds: string[] = [];
  for (let column = 2; column <= 12; column += 1) {
    const id = text(rows[5]?.[column]);
    if (id) deviceIds.push(id);
  }

  let lastDeviceType = "";
  const devices = deviceIds.map((id, index) => {
    lastDeviceType = text(rows[4]?.[index + 2]) || lastDeviceType;
    return { id, name: id, type: lastDeviceType };
  });

  const testCases: RffeTestCase[] = [];
  const matrix: RffeData["matrix"] = {};
  const caseDetails: RffeData["caseDetails"] = {};

  for (let rowIndex = 6; rowIndex < rows.length; rowIndex += 1) {
    const name = text(rows[rowIndex]?.[0]);
    if (!name || name === "器件EVB盘点" || name === "测试报告") continue;
    const id = name;
    const paths = text(rows[rowIndex]?.[1]).split(",").map((item) => item.trim()).filter(Boolean);
    testCases.push({ id, name, paths });
    matrix[id] = {};
    devices.forEach((device, deviceIndex) => {
      matrix[id][device.id] = status(rows[rowIndex]?.[deviceIndex + 2]);
    });
    caseDetails[id] = {
      rsSolution: text(rows[rowIndex]?.[14]),
      keysightSolution: text(rows[rowIndex]?.[15]),
    };
  }

  let tested = 0;
  let untested = 0;
  let na = 0;
  Object.values(matrix).forEach((caseRow) => Object.values(caseRow).forEach((item) => {
    if (item === "tested") tested += 1;
    else if (item === "untested") untested += 1;
    else na += 1;
  }));
  const applicable = tested + untested;

  return {
    lastUpdated: new Date().toISOString(),
    sourceLabel,
    devices,
    testCases,
    matrix,
    caseDetails,
    stats: {
      totalDevices: devices.length,
      totalCases: testCases.length,
      tested,
      untested,
      na,
      coverage: applicable ? Math.round((tested / applicable) * 100) : 0,
      rsSolutionCount: Object.values(caseDetails).filter((item) => item.rsSolution).length,
      keysightSolutionCount: Object.values(caseDetails).filter((item) => item.keysightSolution).length,
    },
  };
}

export function useRffeData() {
  const [data, setData] = useState<RffeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrlState] = useState(DEFAULT_SOURCE);
  const fileRef = useRef<File | null>(null);
  const fileHandleRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let file: File | null = fileRef.current;
      if (fileHandleRef.current) file = await fileHandleRef.current.getFile();

      let buffer: ArrayBuffer;
      let label: string;
      if (file) {
        buffer = await file.arrayBuffer();
        label = file.name;
      } else {
        const separator = sourceUrl.includes("?") ? "&" : "?";
        const response = await fetch(`${sourceUrl}${separator}t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Excel 下载失败：HTTP ${response.status}`);
        buffer = await response.arrayBuffer();
        label = sourceUrl;
      }
      setData(parseWorkbook(buffer, label));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Excel 数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [sourceUrl]);

  const setSourceUrl = useCallback((value: string) => {
    const next = value.trim() || DEFAULT_SOURCE;
    fileRef.current = null;
    fileHandleRef.current = null;
    setSourceUrlState(next);
    localStorage.setItem(SOURCE_STORAGE_KEY, next);
  }, []);

  const selectLocalFile = useCallback(async (fallbackFile?: File) => {
    try {
      if (!fallbackFile && "showOpenFilePicker" in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{ description: "Excel 工作簿", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }],
          multiple: false,
        });
        fileHandleRef.current = handle;
        fileRef.current = null;
      } else if (fallbackFile) {
        fileRef.current = fallbackFile;
        fileHandleRef.current = null;
      }
      await refresh();
    } catch (reason: any) {
      if (reason?.name !== "AbortError") setError(reason?.message || "无法读取本地 Excel");
    }
  }, [refresh]);

  useEffect(() => {
    const saved = localStorage.getItem(SOURCE_STORAGE_KEY);
    if (saved) setSourceUrlState(saved);
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { data, loading, error, refresh, sourceUrl, setSourceUrl, selectLocalFile, refreshMinutes: 1 };
}
