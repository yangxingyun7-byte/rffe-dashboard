param(
    [string]$EnvPath = (Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"),
    [string]$SpreadsheetToken = "ICOts6o33hGMwmtJmSEcYY51nVf",
    [string]$SheetId = "902rKA",
    [string]$Range = "A1:Y23",
    [switch]$Once
)

$ErrorActionPreference = "Stop"
$RepositoryPath = Split-Path $PSScriptRoot -Parent
$JsonPath = Join-Path $RepositoryPath "public\data\control-table.json"
$LogPath = Join-Path (Split-Path $RepositoryPath -Parent) "feishu-dashboard-sync.log"
$MutexName = "Local\RffeDashboardFeishuSync"

function Write-AgentLog {
    param([string]$Message, [string]$Level = "INFO")
    $line = "{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
    Write-Output $line
}

function Read-DotEnv {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing .env.local: $Path"
    }

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        $parts = $trimmed -split "=", 2
        if ($parts.Count -ne 2) { continue }
        $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
    }
    return $values
}

function Convert-CellText {
    param($Value)
    if ($null -eq $Value) { return $null }
    if ($Value -is [string] -or $Value -is [int] -or $Value -is [double] -or $Value -is [bool]) {
        return [string]$Value
    }
    if ($Value -is [array]) {
        $items = @($Value | ForEach-Object { Convert-CellText $_ }) | Where-Object { $_ }
        return ($items -join "").Trim()
    }
    if ($Value.PSObject.Properties.Name -contains "text") {
        return Convert-CellText $Value.text
    }
    return [string]$Value
}

function Invoke-Checked {
    param([string]$Title, [scriptblock]$Command)
    Write-AgentLog $Title
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed with exit code $LASTEXITCODE"
    }
}

function Get-FeishuTenantAccessToken {
    param([string]$AppId, [string]$AppSecret)
    $body = @{ app_id = $AppId; app_secret = $AppSecret } | ConvertTo-Json
    $response = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" -ContentType "application/json; charset=utf-8" -Body $body
    if ($response.code -ne 0) {
        throw "Feishu token request failed: code=$($response.code), msg=$($response.msg)"
    }
    return $response.tenant_access_token
}

function Read-FeishuSheetValues {
    param([string]$Token)
    $encodedRange = [System.Uri]::EscapeDataString("$SheetId!$Range")
    $uri = "https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/$SpreadsheetToken/values/$encodedRange?valueRenderOption=FormattedValue"
    $headers = @{ Authorization = "Bearer $Token" }
    $response = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
    if ($response.code -ne 0) {
        throw "Feishu sheet read failed: code=$($response.code), msg=$($response.msg)"
    }
    return $response.data.valueRange.values
}

function Sync-Once {
    $envValues = Read-DotEnv $EnvPath
    $appId = $envValues["FEISHU_APP_ID"]
    $appSecret = $envValues["FEISHU_APP_SECRET"]
    if (-not $appId -or -not $appSecret -or $appId -eq "your_app_id_here" -or $appSecret -eq "your_app_secret_here") {
        throw "FEISHU_APP_ID / FEISHU_APP_SECRET are not configured in $EnvPath"
    }

    $token = Get-FeishuTenantAccessToken -AppId $appId -AppSecret $appSecret
    $values = Read-FeishuSheetValues -Token $token
    $plainRows = @($values | ForEach-Object {
        $row = $_
        @($row | ForEach-Object { Convert-CellText $_ })
    })

    $payload = [ordered]@{
        source = "feishu"
        spreadsheetToken = $SpreadsheetToken
        sheetId = $SheetId
        range = "$SheetId!$Range"
        sheetTitle = "RFFE Case control table"
        updatedAt = (Get-Date).ToString("o")
        values = $plainRows
    }

    $newJson = $payload | ConvertTo-Json -Depth 20
    $oldJson = if (Test-Path -LiteralPath $JsonPath) { Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8 } else { "" }
    if ($newJson.Trim() -eq $oldJson.Trim()) {
        Write-AgentLog "Feishu data unchanged; publish skipped."
        return
    }

    $newJson | Set-Content -LiteralPath $JsonPath -Encoding UTF8
    Write-AgentLog "Feishu data exported: $JsonPath"

    Set-Location -LiteralPath $RepositoryPath
    Invoke-Checked "Build dashboard" { npm run build }
    Invoke-Checked "Stage Feishu JSON and static output" { git add -- public/data/control-table.json out }
    $staged = @(git diff --cached --name-only)
    if ($staged.Count -eq 0) {
        Write-AgentLog "No staged changes after build; publish skipped."
        return
    }
    $message = "data: sync Feishu control table $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
    Invoke-Checked "Commit Feishu data" { git commit -m $message }
    Invoke-Checked "Push master" { git push github master }

    Write-AgentLog "Create gh-pages subtree"
    $splitOutput = git subtree split --prefix out
    if ($LASTEXITCODE -ne 0) { throw "git subtree split failed." }
    $pagesCommit = $splitOutput | Where-Object { $_ -match '^[0-9a-f]{40}$' } | Select-Object -Last 1
    if (-not $pagesCommit) { throw "Unable to determine gh-pages commit." }
    Invoke-Checked "Publish gh-pages" { git push --force github "$pagesCommit`:refs/heads/gh-pages" }
    Write-AgentLog "Feishu sync published successfully. pages=$pagesCommit"
}

$mutex = New-Object System.Threading.Mutex($false, $MutexName)
if (-not $mutex.WaitOne(0)) {
    Write-AgentLog "Another Feishu sync process is already running; this instance will exit." "WARN"
    exit 0
}

try {
    do {
        try {
            Sync-Once
        } catch {
            Write-AgentLog $_.Exception.Message "ERROR"
        }
        if (-not $Once) { Start-Sleep -Seconds 60 }
    } while (-not $Once)
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
