[CmdletBinding()]
param([string]$ProjectRoot)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'import-public-student-materials.js'
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    & node $script
} else {
    & node $script --project-root $ProjectRoot
}
exit $LASTEXITCODE
