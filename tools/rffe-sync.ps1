param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "rffe-sync.config.json"),
    [switch]$Once
)

$ErrorActionPreference = "Stop"
$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Write-SyncLog {
    param([string]$Message, [string]$Level = "INFO")
    $line = "{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Add-Content -LiteralPath $config.logFilePath -Value $line -Encoding UTF8
}

function Invoke-Git {
    param([string[]]$Arguments)
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $result = & $config.gitExecutable -C $config.repositoryPath @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($exitCode -ne 0) {
        throw "git $($Arguments -join ' ') failed: $($result -join [Environment]::NewLine)"
    }
    return @($result)
}

function Get-RecordedHash {
    if (-not (Test-Path -LiteralPath $config.stateFilePath)) { return "" }
    try {
        return (Get-Content -LiteralPath $config.stateFilePath -Raw -Encoding UTF8 | ConvertFrom-Json).publishedHash
    } catch {
        return ""
    }
}

function Save-RecordedHash {
    param([string]$Hash)
    @{
        publishedHash = $Hash
        publishedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json | Set-Content -LiteralPath $config.stateFilePath -Encoding UTF8
}

function Invoke-RffeSync {
    if (-not (Test-Path -LiteralPath $config.sourceExcelPath)) {
        throw "Source Excel does not exist: $($config.sourceExcelPath)"
    }
    if (-not (Test-Path -LiteralPath $config.repositoryPath)) {
        throw "Repository does not exist: $($config.repositoryPath)"
    }
    if (-not (Test-Path -LiteralPath $config.gitExecutable)) {
        throw "Git executable does not exist: $($config.gitExecutable)"
    }

    $publicTarget = Join-Path $config.repositoryPath $config.publicExcelRelativePath
    $outputTarget = Join-Path $config.repositoryPath $config.outputExcelRelativePath
    $sourceHash = (Get-FileHash -LiteralPath $config.sourceExcelPath -Algorithm SHA256).Hash
    $publicHash = if (Test-Path -LiteralPath $publicTarget) { (Get-FileHash -LiteralPath $publicTarget -Algorithm SHA256).Hash } else { "" }
    $outputHash = if (Test-Path -LiteralPath $outputTarget) { (Get-FileHash -LiteralPath $outputTarget -Algorithm SHA256).Hash } else { "" }
    $recordedHash = Get-RecordedHash

    if ($sourceHash -eq $publicHash -and $sourceHash -eq $outputHash -and $sourceHash -eq $recordedHash) {
        Write-SyncLog "Excel content unchanged; publish skipped. SHA256=$sourceHash"
        return
    }

    $staged = Invoke-Git @("diff", "--cached", "--name-only")
    $allowed = @(
        ($config.publicExcelRelativePath -replace '\\', '/'),
        ($config.outputExcelRelativePath -replace '\\', '/')
    )
    $unrelatedStaged = @($staged | Where-Object { $_ -and $_ -notin $allowed })
    if ($unrelatedStaged.Count -gt 0) {
        throw "Unrelated staged files detected; sync skipped: $($unrelatedStaged -join ', ')"
    }

    if ($sourceHash -ne $publicHash -or $sourceHash -ne $outputHash) {
        New-Item -ItemType Directory -Path (Split-Path $publicTarget) -Force | Out-Null
        New-Item -ItemType Directory -Path (Split-Path $outputTarget) -Force | Out-Null
        Copy-Item -LiteralPath $config.sourceExcelPath -Destination $publicTarget -Force
        Copy-Item -LiteralPath $config.sourceExcelPath -Destination $outputTarget -Force

        $copiedPublicHash = (Get-FileHash -LiteralPath $publicTarget -Algorithm SHA256).Hash
        $copiedOutputHash = (Get-FileHash -LiteralPath $outputTarget -Algorithm SHA256).Hash
        if ($sourceHash -ne $copiedPublicHash -or $sourceHash -ne $copiedOutputHash) {
            throw "Copied Excel hashes do not match; publish stopped."
        }

        Invoke-Git @("add", "--", $config.publicExcelRelativePath, $config.outputExcelRelativePath) | Out-Null
        $changed = Invoke-Git @("diff", "--cached", "--name-only")
        if ($changed.Count -gt 0) {
            $message = "data: auto-sync RFFE control table $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
            Invoke-Git @("commit", "-m", $message) | Out-Null
        }
    }

    Invoke-Git @("push", $config.remoteName, $config.sourceBranch) | Out-Null
    $splitOutput = Invoke-Git @("subtree", "split", "--prefix", "out")
    $pagesCommit = $splitOutput | Where-Object { $_ -match '^[0-9a-f]{40}$' } | Select-Object -Last 1
    if (-not $pagesCommit) { throw "Unable to determine the gh-pages commit." }
    $refspec = "{0}:refs/heads/{1}" -f $pagesCommit, $config.pagesBranch
    Invoke-Git @("push", "--force", $config.remoteName, $refspec) | Out-Null

    Save-RecordedHash $sourceHash
    Write-SyncLog "Sync published successfully. SHA256=$sourceHash, pages=$pagesCommit"
}

$mutex = New-Object System.Threading.Mutex($false, "Local\RffeDashboardExcelSync")
if (-not $mutex.WaitOne(0)) {
    Write-SyncLog "Another sync process is already running; this instance will exit." "WARN"
    exit 0
}

try {
    do {
        try {
            Invoke-RffeSync
        } catch {
            Write-SyncLog $_.Exception.Message "ERROR"
        }
        if (-not $Once) {
            $seconds = [Math]::Max(30, [int]$config.syncIntervalSeconds)
            Start-Sleep -Seconds $seconds
        }
    } while (-not $Once)
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
