# RFFE Dashboard 飞书同步 Agent 部署说明

## 1. Agent 目标

本地 Agent 用于自动完成：

```text
飞书表格 → public/data/control-table.json → npm run build → GitHub master → gh-pages → Dashboard
```

目标飞书表格：

```text
https://mi.feishu.cn/sheets/ICOts6o33hGMwmtJmSEcYY51nVf?sheet=902rKA
```

目标 sheet：

```text
902rKA / RFFE Case control table
```

同步周期：

```text
60 秒
```

## 2. 文件说明

```text
tools/sync-feishu-dashboard.ps1
```

核心 Agent。读取飞书表格，生成 `public/data/control-table.json`，构建并发布到 GitHub Pages。

```text
tools/install-feishu-dashboard-agent.ps1
```

安装 Windows 计划任务：`RFFE Dashboard Feishu Sync Agent`。

```text
tools/uninstall-feishu-dashboard-agent.ps1
```

停止并删除 Windows 计划任务。

```text
.env.local.example
```

飞书 App 凭证模板。

## 3. 配置飞书凭证

复制模板：

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
copy .env.local.example .env.local
```

编辑 `.env.local`：

```text
FEISHU_APP_ID=你的飞书应用 App ID
FEISHU_APP_SECRET=你的飞书应用 App Secret
```

注意：不要把 `.env.local` 提交到 Git。

## 4. 飞书应用权限

在飞书开放平台中创建或选择企业自建应用：

```text
https://open.feishu.cn/app
```

建议添加权限：

```text
sheets:spreadsheet:read
sheets:spreadsheet.meta:read
```

应用需要发布并审批通过，且应用需要有权限访问目标表格。

## 5. 手动测试一次

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\sync-feishu-dashboard.ps1 -Once
```

成功后应看到类似日志：

```text
Feishu sync published successfully
```

日志文件：

```text
C:\RFFE_DASHBOARD\feishu-dashboard-sync.log
```

## 6. 安装自动同步任务

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\install-feishu-dashboard-agent.ps1
```

查看任务状态：

```powershell
Get-ScheduledTask -TaskName "RFFE Dashboard Feishu Sync Agent"
```

查看日志：

```powershell
Get-Content C:\RFFE_DASHBOARD\feishu-dashboard-sync.log -Tail 30
```

## 7. 卸载自动同步任务

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\uninstall-feishu-dashboard-agent.ps1
```

## 8. 与旧 Excel 同步任务的关系

旧任务：

```text
RFFE Dashboard Excel Sync
```

新任务：

```text
RFFE Dashboard Feishu Sync Agent
```

如果启用飞书同步 Agent，建议停用旧 Excel 同步任务，避免两个任务同时更新 `gh-pages`。

停用旧任务：

```powershell
Stop-ScheduledTask -TaskName "RFFE Dashboard Excel Sync"
```

如需彻底删除旧任务：

```powershell
cd C:\RFFE_DASHBOARD\rffe_proj
powershell -ExecutionPolicy Bypass -File .\tools\uninstall-rffe-sync.ps1
```

## 9. 当前限制

1. Agent 运行在本机，电脑关机或用户未登录时不会同步。
2. 飞书 App 凭证只保存在本机 `.env.local`。
3. 如果本地 Git 工作区存在已暂存的无关文件，发布可能失败。
4. GitHub Pages 部署后可能需要几十秒才对外刷新。
