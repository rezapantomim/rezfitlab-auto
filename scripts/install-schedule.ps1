# Registers the weekly writer in Windows Task Scheduler: every Sunday 10:00, runs scripts/weekly.ps1.
# If the PC was off at that time, it runs as soon as possible afterwards (StartWhenAvailable).
$root = Split-Path -Parent $PSScriptRoot
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$root\scripts\weekly.ps1`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 10:00
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4) -WakeToRun
Register-ScheduledTask -TaskName 'RezFitlab Weekly Writer' -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host 'Registered "RezFitlab Weekly Writer" (Sundays 10:00).'
