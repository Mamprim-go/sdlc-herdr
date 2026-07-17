param([string]$Target = "$HOME\\.sdlc-herdr")
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Target | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\\..\\workflows", "$PSScriptRoot\\..\\prompts", "$PSScriptRoot\\..\\skills", "$PSScriptRoot\\..\\scripts", $Target
Write-Host "Installed SDLC HERDR kit at $Target"
Write-Host "Install Pi package resources with: pi install $Target"
