"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataSourcePanelProps {
  sourceUrl: string;
  sourceLabel?: string;
  lastUpdated?: string;
  loading: boolean;
  error: string | null;
  onSaveUrl: (url: string) => void;
  onRefresh: () => void;
  onSelectLocalFile: (file?: File) => void;
}

export function DataSourcePanel(props: DataSourcePanelProps) {
  const [url, setUrl] = useState(props.sourceUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Excel 数据地址（需允许浏览器跨域访问）</label>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-xs text-foreground outline-none focus:border-rf-blue"
            placeholder="https://example.com/control-table.xlsx"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => props.onSaveUrl(url)}><Save className="mr-1 h-4 w-4" />保存地址</Button>
          <Button size="sm" variant="outline" onClick={() => {
            if ("showOpenFilePicker" in window) props.onSelectLocalFile();
            else inputRef.current?.click();
          }}><FileSpreadsheet className="mr-1 h-4 w-4" />选择本机 Excel</Button>
          <Button size="sm" onClick={props.onRefresh} disabled={props.loading}><RefreshCw className={`mr-1 h-4 w-4 ${props.loading ? "animate-spin" : ""}`} />立即刷新</Button>
        </div>
      </div>
      <input ref={inputRef} className="hidden" type="file" accept=".xlsx" onChange={(event) => event.target.files?.[0] && props.onSelectLocalFile(event.target.files[0])} />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <span>当前源：{props.sourceLabel || "正在加载"}</span>
        <span>自动刷新：每 5 分钟</span>
        {props.lastUpdated && <span>最后读取：{new Date(props.lastUpdated).toLocaleString("zh-CN")}</span>}
        {props.error && <span className="text-rf-red">{props.error}</span>}
      </div>
    </section>
  );
}
