# 本地 Feishu 同步 Agent 说明

## 1. Agent 名称

```text
RFFE Dashboard Feishu Sync Agent
```

这是部署在本机 Windows 上的 RFFE Dashboard 数据同步 Agent。

它负责定时读取飞书表格，将数据转换为 Dashboard 可读取的 JSON 文件，并自动发布到 GitHub Pages。

## 2. Agent 作用

该 Agent 的目标是替代旧的本地 Excel 同步链路，让 Dashboard 的数据源来自飞书表格。

完整数据链路：

```text
飞书表格
  → 本机 Feishu Sync Agent
  → public/data/control-table.json
  → npm run build
  → out/data/control-table.json
  → git commit / push master
  → git subtree split --prefix out
  → force push gh-pages
  → GitHub Pages Dashboard
```

线上 Dashboard：

```text
https://yangxingyun7-byte.github.io/rffe-dashboard/
```

线上 JSON 数据：

```text
https://yangxingyun7-byte.github.io/rffe-dashboard/data/control-table.json
```

## 3. 飞书数据源

飞书表格地址：

```text
https://mi.feishu.cn/sheets/ICOts6o33hGMwmtJmSEcYY51nVf?sheet=902rKA
```

Agent 默认读取：

```text
spreadsheetToken = ICOts6o33hGMwmtJmSEcYY51nVf
sheetId          = 902rKA
range            = A1:Y23
```

对应完整 range：

```text
902rKA!A1:Y23
```

## 4. 本机部署地址

项目根目录：

```text
C:\RFFE_DASHBOARD\rffe_proj
```

Agent 主脚本：

```text
C:\RFFE_DASHBOARD\rffe_proj\tools\sync-feishu-dashboard.ps1
```

安装脚本：

```text
C:\RFFE_DASHBOARD\rffe_proj\tools\install-feishu-dashboard-agent.ps1
```

卸载脚本：

```text
C:\RFFE_DASHBOARD\rffe_proj\tools\uninstall-feishu-dashboard-agent.ps1
```

凭证文件：

```text
C:\RFFE_DASHBOARD\rffe_proj\.env.local
```

日志文件：

```text
C:\RFFE_DASHBOARD\feishu-dashboard-sync.log
```

生成的本地 JSON：

```text
C:\RFFE_DASHBOARD\rffe_proj\public\data\control-table.json
```

构建后的发布 JSON：

```text
C:\RFFE_DASHBOARD\rffe_proj\out\data\control-table.json
```

## 5. 当前运行状态

当前 Windows 计划任务状态：

```text
RFFE Dashboard Feishu Sync Agent = Running
RFFE Dashboard Excel Sync        = Ready
```

含义：

- 新的飞书同步 Agent 正在运行。
- 旧的 Excel 同步任务已停用，没有继续抢占 GitHub Pages 发布。

## 6. Harness / 运行环境

这里的 Harness 指 Agent 的宿主和调度环境。

当前 Harness 是：

```text
Windows Task Scheduler + Windows PowerShell 5.1 + Git + npm + Feishu OpenAPI
```

计划任务执行命令：

```text
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
```

计划任务参数：

```text
-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\RFFE_DASHBOARD\rffe_proj\tools\sync-feishu-dashboard.ps1" -EnvPath "C:\RFFE_DASHBOARD\rffe_proj\.env.local" -SyncIntervalSeconds 7200
```

计划任务触发方式：

```text
当前 Windows 用户登录时启动
```

Agent 内部循环：

```text
每 2 小时（7200 秒）执行一次同步检查
```

互斥锁：

```text
Local\RffeDashboardFeishuSync
```

互斥锁用于避免多个 Agent 实例同时发布。

## 7. Agent 调用方式

### 7.1 手动执行一次

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\sync-feishu-dashboard.ps1 -Once
```

适合调试凭证、飞书权限、JSON 结构和发布链路。

### 7.2 安装并启动计划任务

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\install-feishu-dashboard-agent.ps1
```

安装后任务名为：

```text
RFFE Dashboard Feishu Sync Agent
```

### 7.3 卸载计划任务

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\uninstall-feishu-dashboard-agent.ps1
```

### 7.4 查看任务状态

```powershell
Get-ScheduledTask -TaskName "RFFE Dashboard Feishu Sync Agent"
```

### 7.5 查看日志

```powershell
Get-Content C:\RFFE_DASHBOARD\feishu-dashboard-sync.log -Tail 30
```

## 8. Agent 内部步骤

主脚本：

```text
tools/sync-feishu-dashboard.ps1
```

核心流程：

1. 读取 `.env.local`。
2. 获取 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET`。
3. 请求飞书 `tenant_access_token`。
4. 调用飞书电子表格读取接口。
5. 读取 `902rKA!A1:Y23`。
6. 将飞书富文本单元格转换为纯文本。
7. 保持二维数组结构 `rows -> columns`。
8. 写入 `public/data/control-table.json`。
9. 执行 `npm run build`。
10. 暂存 `public/data/control-table.json` 和 `out`。
11. 自动提交到 `master`。
12. 推送 GitHub `master`。
13. 执行 `git subtree split --prefix out`。
14. force push 到 `gh-pages`。
15. 写入日志。

## 9. Feishu OpenAPI 调用

获取 token：

```text
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
```

读取表格：

```text
GET https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/ICOts6o33hGMwmtJmSEcYY51nVf/values/902rKA!A1:Y23?valueRenderOption=FormattedValue
```

Authorization header：

```text
Bearer <tenant_access_token>
```

## 10. 凭证说明

凭证文件：

```text
.env.local
```

字段：

```text
FEISHU_APP_ID=...
FEISHU_APP_SECRET=...
```

安全规则：

- `.env.local` 只保存在本机。
- `.env.local` 被 `.gitignore` 忽略。
- 不要把真实 App Secret 提交到 Git。
- 不要把 App Secret 写入前端代码。

模板文件：

```text
.env.local.example
```

## 11. 日志关键字

成功导出：

```text
Feishu data exported
```

构建开始：

```text
Build dashboard
```

发布成功：

```text
Feishu sync published successfully
```

另一个实例正在运行：

```text
Another Feishu sync process is already running
```

飞书读取失败：

```text
Feishu sheet read failed
```

凭证未配置：

```text
FEISHU_APP_ID / FEISHU_APP_SECRET are not configured
```

## 12. 常见问题

### 12.1 Dashboard 文字挤成一列、统计为 0

原因通常是 `control-table.json` 的 `values` 被错误生成成一维数组。

正确结构必须是二维数组：

```json
{
  "values": [
    ["row1 col1", "row1 col2"],
    ["row2 col1", "row2 col2"]
  ]
}
```

验证命令：

```powershell
$json = Get-Content C:\RFFE_DASHBOARD\rffe_proj\public\data\control-table.json -Raw | ConvertFrom-Json
$json.values.Count
$json.values[0].Count
$json.values[5][2]
```

期望：

```text
values.Count = 23
values[0].Count = 25
values[5][2] = QM77055
```

### 12.2 飞书返回 not found sheetId

曾经的原因是 PowerShell URL 字符串拼接错误，导致 range 没有正确传入。

正确 URL 中应包含：

```text
values/902rKA!A1:Y23?valueRenderOption=FormattedValue
```

### 12.3 页面没有立刻变化

可能原因：

1. GitHub Pages 部署需要几十秒。
2. 浏览器缓存旧资源。
3. Agent 正在构建或发布中。

处理：

```text
等待 30–90 秒后 Ctrl+F5 强制刷新
```

### 12.4 旧 Excel 任务抢发布

旧任务名：

```text
RFFE Dashboard Excel Sync
```

如果它是 `Running`，可能与 Feishu Agent 同时更新 `gh-pages`。

建议保持：

```text
RFFE Dashboard Excel Sync = Ready
RFFE Dashboard Feishu Sync Agent = Running
```

## 13. 停用旧 Excel 同步任务

只停止：

```powershell
Stop-ScheduledTask -TaskName "RFFE Dashboard Excel Sync"
```

彻底卸载：

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\uninstall-rffe-sync.ps1
```

## 14. 维护建议

1. 优先通过飞书表格修改数据。
2. 不再手动修改 `public/data/control-table.json`，除非调试。
3. 不要同时启用 Excel Sync 和 Feishu Sync。
4. 定期检查日志是否出现 ERROR。
5. 如需调整读取范围，修改 `sync-feishu-dashboard.ps1` 的默认参数：

```powershell
[string]$SpreadsheetToken = "ICOts6o33hGMwmtJmSEcYY51nVf"
[string]$SheetId = "902rKA"
[string]$Range = "A1:Y23"
```

## 15. 当前最新验证

已验证：

- Agent 能读取飞书表格。
- JSON 保持二维数组结构。
- `QM77055` 等设备 ID 能正确出现在第 6 行。
- Agent 能构建并发布 GitHub Pages。
- 当前 Feishu Agent 任务正在运行。

最新日志形态示例：

```text
Feishu data exported
Build dashboard
Stage Feishu JSON and static output
Commit Feishu data
Push master
Create gh-pages subtree
Publish gh-pages
Feishu sync published successfully
```
