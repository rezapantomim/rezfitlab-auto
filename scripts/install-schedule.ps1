# Registers the writer in Windows Task Scheduler.
#   .\install-schedule.ps1          -> weekly, Sundays 10:00   (start: 2 long + 7 Shorts a week, plan_days_ahead = 7)
#   .\install-schedule.ps1 -Daily   -> every day 09:00         (more videos: set plan_days_ahead = 3 in config/channel.json)
# If the PC was off at that time, it runs as soon as possible afterwards (StartWhenAvailable).
param([switch]$Daily)
$root = Split-Path -Parent $PSScriptRoot
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$root\scripts\weekly.ps1`"" -WorkingDirectory $root
if ($Daily) { $trigger = New-ScheduledTaskTrigger -Daily -At 09:00 } else { $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 10:00 }
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4) -WakeToRun
Register-ScheduledTask -TaskName 'RezFitlab Writer' -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host ("Registered 'RezFitlab Writer' (" + $(if ($Daily) { 'daily 09:00' } else { 'Sundays 10:00' }) + ').')
