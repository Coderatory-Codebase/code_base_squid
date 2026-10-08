$ErrorActionPreference = "Stop"

$alloyExecutable = Join-Path $env:ProgramFiles "GrafanaLabs\Alloy\alloy-windows-amd64.exe"
$alloyConfig = Join-Path $PSScriptRoot "identity.alloy.example"

if (-not (Test-Path -LiteralPath $alloyExecutable)) {
  throw "Grafana Alloy was not found at $alloyExecutable. Install Alloy first."
}

if (-not (Test-Path -LiteralPath $alloyConfig)) {
  throw "Alloy config was not found at $alloyConfig."
}

foreach ($port in @(12345, 3101)) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    $processName = (Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    throw "Port $port is already in use by $processName (PID $($listener.OwningProcess)). Reuse the running Alloy instance or stop the conflicting process before starting another."
  }
}

$env:GRAFANA_CLOUD_LOKI_URL = "https://logs-prod-035.grafana.net/loki/api/v1/push"
$env:LOKI_USERNAME = Read-Host "Grafana Cloud Loki user ID"

$secureToken = Read-Host "Paste the logs:write access policy token (hidden input)" -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $env:GRAFANA_CLOUD_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
}

if ([string]::IsNullOrWhiteSpace($env:GRAFANA_CLOUD_API_KEY)) {
  Remove-Item Env:GRAFANA_CLOUD_API_KEY -ErrorAction SilentlyContinue
  throw "A non-empty logs:write token is required."
}

Write-Host "Starting Alloy's local log receiver on 127.0.0.1:3101. Keep this window open; press Ctrl+C to stop."
try {
  & $alloyExecutable run $alloyConfig
} finally {
  Remove-Item Env:GRAFANA_CLOUD_API_KEY -ErrorAction SilentlyContinue
}
