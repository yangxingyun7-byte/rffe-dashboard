$ErrorActionPreference = "Stop"
$RepositoryPath = Split-Path $PSScriptRoot -Parent
$AgentScript = Join-Path $PSScriptRoot "sync-feishu-dashboard.ps1"
$EnvPath = Join-Path $RepositoryPath ".env.local"
$TaskName = "RFFE Dashboard Feishu Sync Agent"
$PowerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $AgentScript -PathType Leaf)) {
    throw "Agent script not found: $AgentScript"
}
if (-not (Test-Path -LiteralPath $EnvPath -PathType Leaf)) {
    throw "Missing .env.local. Copy .env.local.example to .env.local and fill FEISHU_APP_ID / FEISHU_APP_SECRET first."
}

$arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -EnvPath "{1}"' -f $AgentScript, $EnvPath
$action = New-ScheduledTaskAction -Execute $PowerShell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Read Feishu RFFE sheet every 60 seconds and publish Dashboard JSON to GitHub Pages" -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Output "Scheduled task installed and started: $TaskName"
