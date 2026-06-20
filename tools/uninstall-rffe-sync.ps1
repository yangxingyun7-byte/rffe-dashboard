param([string]$ConfigPath = (Join-Path $PSScriptRoot "rffe-sync.config.json"))

$ErrorActionPreference = "Stop"
$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (Get-ScheduledTask -TaskName $config.taskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $config.taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $config.taskName -Confirm:$false
}
Write-Output "Scheduled task uninstalled: $($config.taskName)"
