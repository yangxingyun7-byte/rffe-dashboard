$ErrorActionPreference = "Stop"
$TaskName = "RFFE Dashboard Feishu Sync Agent"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Output "Scheduled task uninstalled: $TaskName"
} else {
    Write-Output "Scheduled task not found: $TaskName"
}
