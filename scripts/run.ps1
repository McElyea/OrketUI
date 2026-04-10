$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
    $uiHost = if ([string]::IsNullOrWhiteSpace($env:ORKET_UI_HOST)) { "127.0.0.1" } else { $env:ORKET_UI_HOST }
    $uiPort = if ([string]::IsNullOrWhiteSpace($env:ORKET_UI_PORT)) { 3010 } else { [int]$env:ORKET_UI_PORT }
    $uiDistIndex = Join-Path $repoRoot "UI\dist\index.html"
    $forceRebuild = @("1", "true", "yes", "on") -contains ([string]$env:ORKET_UI_REBUILD).Trim().ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($env:ORKET_UI_HOST_BASE_URL)) {
        $hostBaseUrl = "http://127.0.0.1:8082 (default)"
    } else {
        $hostBaseUrl = $env:ORKET_UI_HOST_BASE_URL
    }

    if ([string]::IsNullOrWhiteSpace($env:ORKET_UI_API_KEY) -and -not [string]::IsNullOrWhiteSpace($env:ORKET_API_KEY)) {
        $env:ORKET_UI_API_KEY = $env:ORKET_API_KEY
    }

    if ($forceRebuild -or -not (Test-Path -LiteralPath $uiDistIndex)) {
        Write-Host "Building React UI..."
        npm --prefix UI install
        npm --prefix UI run build
    }

    Write-Host "Launching OrketUI at http://$uiHost`:$uiPort"
    Write-Host "Host base URL: $hostBaseUrl"
    if ([string]::IsNullOrWhiteSpace($env:ORKET_UI_API_KEY)) {
        Write-Warning "ORKET_UI_API_KEY is not set. Host-backed /v1/* reads will fail closed until ORKET_UI_API_KEY or ORKET_API_KEY is set."
    }
    Write-Host "Press Ctrl+C to stop."

    python -m uvicorn orket_ui_app.server:app --app-dir src --host $uiHost --port $uiPort --no-access-log
}
finally {
    Pop-Location
}
