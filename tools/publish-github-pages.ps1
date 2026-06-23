param(
    [string]$CommitMessage = "chore: publish dashboard update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"
$RepositoryPath = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $RepositoryPath

function Invoke-Checked {
    param(
        [string]$Title,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed with exit code $LASTEXITCODE"
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath ".git"))) {
    throw "This folder is not a Git repository: $RepositoryPath"
}

if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
    throw "Git was not found. Install Git for Windows and reopen this script."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Install Node.js LTS and reopen this script."
}

if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath "node_modules"))) {
    Invoke-Checked "Install dependencies" { npm install }
}

Invoke-Checked "Fetch GitHub master" { git fetch github master }
$aheadBehind = git rev-list --left-right --count HEAD...github/master
if ($LASTEXITCODE -ne 0) { throw "Unable to compare with github/master." }
$counts = $aheadBehind -split "\s+"
$behind = [int]$counts[1]
if ($behind -gt 0) {
    Invoke-Checked "Fast-forward to github/master" { git merge --ff-only github/master }
}

Invoke-Checked "Build static site" { npm run build }
if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath "out"))) {
    throw "Build completed but out directory was not found."
}

Invoke-Checked "Stage dashboard source and static output" { git add -- components/overview-charts.tsx out }
$staged = @(git diff --cached --name-only)
if ($LASTEXITCODE -ne 0) { throw "Unable to read staged files." }
if ($staged.Count -eq 0) {
    Write-Host "No dashboard source/output changes to commit. Publishing current out subtree." -ForegroundColor Yellow
} else {
    Invoke-Checked "Commit staged dashboard changes" { git commit -m $CommitMessage }
}

Invoke-Checked "Push master to GitHub" { git push github master }

Write-Host ""
Write-Host "==> Create gh-pages subtree" -ForegroundColor Cyan
$splitOutput = git subtree split --prefix out
if ($LASTEXITCODE -ne 0) { throw "git subtree split failed." }
$pagesCommit = $splitOutput | Where-Object { $_ -match '^[0-9a-f]{40}$' } | Select-Object -Last 1
if (-not $pagesCommit) { throw "Unable to determine gh-pages commit." }

Invoke-Checked "Publish gh-pages" { git push --force github "$pagesCommit`:refs/heads/gh-pages" }

Write-Host ""
Write-Host "Published successfully." -ForegroundColor Green
Write-Host "master: $(git log -1 --oneline)"
Write-Host "gh-pages: $pagesCommit"
Write-Host "URL: https://yangxingyun7-byte.github.io/rffe-dashboard/"
