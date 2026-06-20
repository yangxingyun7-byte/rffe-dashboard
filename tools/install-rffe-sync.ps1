param([string]$ConfigPath = (Join-Path $PSScriptRoot "rffe-sync.config.json"))

$ErrorActionPreference = "Stop"
$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$syncScript = Join-Path $PSScriptRoot "rffe-sync.ps1"
$powerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -ConfigPath "{1}"' -f $syncScript, $ConfigPath

$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $config.taskName -Action $action -Trigger $trigger -Settings $settings -Description "Sync RFFE Control Table to GitHub Pages every 3 minutes" -Force | Out-Null
Start-ScheduledTask -TaskName $config.taskName
Write-Output "Scheduled task installed and started: $($config.taskName)"
