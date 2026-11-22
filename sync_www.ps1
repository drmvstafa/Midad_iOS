$ErrorActionPreference = 'Stop'
$src = 'D:\mods\Android_App_Projects\kotob_pro\assets\www'
$dst = Join-Path $PSScriptRoot 'Resources\www'
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
Copy-Item -Path $src -Destination $dst -Recurse -Force
Write-Host "Synced www assets from $src -> $dst"
Get-ChildItem $dst | Select-Object Name, Length
