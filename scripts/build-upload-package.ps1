[CmdletBinding()]
param(
    [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
}
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$releaseDirectory = Join-Path $ProjectRoot 'release'
$stagingDirectory = Join-Path $releaseDirectory 'eureka-boom'
$archivePath = Join-Path $releaseDirectory 'eureka-boom-upload.zip'

if (Test-Path -LiteralPath $stagingDirectory) {
    Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDirectory -Force | Out-Null

$excludedNames = @('node_modules', '.git', '.env', 'release')
Get-ChildItem -LiteralPath $ProjectRoot -Force | Where-Object {
    $excludedNames -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $stagingDirectory -Recurse -Force
}

$uploadDirectory = Join-Path $stagingDirectory 'data\uploads'
if (Test-Path -LiteralPath $uploadDirectory) {
    Remove-Item -LiteralPath $uploadDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $uploadDirectory -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $uploadDirectory '.gitkeep') -Force | Out-Null

if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}
Compress-Archive -LiteralPath $stagingDirectory -DestinationPath $archivePath -CompressionLevel Optimal

Write-Output ("Upload package created: {0}" -f $archivePath)
Write-Output 'The package excludes .env, node_modules, and existing uploaded files.'
