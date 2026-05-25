# tools/install-hooks.ps1
# Run once after cloning to wire up git hooks.
# Usage: pwsh tools/install-hooks.ps1

$hookSrc  = Join-Path $PSScriptRoot "pre-commit"
$hooksDir = Join-Path (git rev-parse --git-dir) "hooks"
$hookDst  = Join-Path $hooksDir "pre-commit"

Copy-Item $hookSrc $hookDst -Force

# Git hooks must be executable on Unix; on Windows this is a no-op but harmless.
if ($IsLinux -or $IsMacOS) { chmod +x $hookDst }

Write-Host "Hook installed: $hookDst"
Write-Host "Smoke tests will now run before every commit."
