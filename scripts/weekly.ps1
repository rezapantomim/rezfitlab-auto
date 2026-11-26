# Weekly writer: runs Claude Code headless with the rezfitlab-weekly skill, then sends the report to Telegram.
# Started by Windows Task Scheduler (see scripts/install-schedule.ps1). Log: work/weekly-<date>.log
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force -Path "$root\work" | Out-Null
$log = "$root\work\weekly-$(Get-Date -Format yyyyMMdd).log"

$prompt = 'Run the rezfitlab-weekly skill now: plan, write, check and queue next week''s episodes, push them, and end with the short report.'
$report = claude -p $prompt --permission-mode acceptEdits 2>&1 | Tee-Object -FilePath $log | Out-String

# last 3500 characters of the report -> Telegram (needs TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID in .env)
$envFile = "$root\.env"
if (Test-Path $envFile) {
  Get-Content $envFile | Where-Object { $_ -match '^\s*(TELEGRAM_[A-Z_]+)\s*=\s*(.+)$' } | ForEach-Object {
    $k, $v = $_ -split '=', 2; [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim().Trim('"'))
  }
}
$tail = if ($report.Length -gt 3500) { $report.Substring($report.Length - 3500) } else { $report }
$tail | python -m pipeline.notify
