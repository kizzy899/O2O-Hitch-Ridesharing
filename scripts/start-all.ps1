param(
    [switch]$ShowServiceWindows
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$mavenSettingsFile = Join-Path $root ".mvn-local-settings.xml"
$rootPom = Join-Path $root "pom.xml"
$logDir = Join-Path $root "logs"
Set-Location $root

$urls = [ordered]@{
    "Frontend"                  = "http://localhost:5173"
    "Gateway"                   = "http://localhost:9000"
    "Gateway Health"            = "http://localhost:9000/actuator/health"
    "Config Server Health"      = "http://localhost:8888/actuator/health"
    "Eureka Dashboard"          = "http://localhost:8761"
    "Eureka Apps"               = "http://localhost:8761/eureka/apps"
    "Auth Login API (via Gate)" = "http://localhost:9000/api/auth/login"
}

function Write-Log($level, $message) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts][$level] $message"
}

function Write-Section($title) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host $title
    Write-Host "============================================================"
}

function Start-ModuleProcess($command, $name) {
    $args = @("-NoProfile", "-ExecutionPolicy", "Bypass")
    if ($ShowServiceWindows) {
        $args += @("-NoExit", "-Command", $command)
        $proc = Start-Process -FilePath "powershell" -ArgumentList $args -PassThru
        Write-Log "INFO" "$name started (PID=$($proc.Id), window=visible)"
    } else {
        $args += @("-Command", $command)
        $proc = Start-Process -FilePath "powershell" -ArgumentList $args -WindowStyle Hidden -PassThru
        Write-Log "INFO" "$name started (PID=$($proc.Id), window=hidden)"
    }
}

function Assert-Command($command, $installHint) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        Write-Log "FAIL" "Missing command: $command. $installHint"
        exit 1
    }
    Write-Log "OK" "Found command: $command"
}

function Test-PortListening($port) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    return $null -ne $listener
}

function Get-PortOwner($port) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $listener) {
        return $null
    }
    $pid = $listener.OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($null -eq $proc) {
        return "PID=$pid"
    }
    return "$($proc.ProcessName) (PID=$pid)"
}

function Clear-StartupPorts() {
    $ports = @(5173, 8761, 8888, 9000, 9010, 9011, 9012, 9013, 9014, 9015)
    Write-Log "STEP" "Preflight: clean occupied project ports"

    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {
        $ports -contains $_.LocalPort
    }

    if ($null -eq $listeners -or $listeners.Count -eq 0) {
        Write-Log "OK" "No occupied project ports found."
        return
    }

    $targets = $listeners | Select-Object -Property OwningProcess, LocalPort -Unique
    foreach ($target in $targets) {
        $ownerPid = $target.OwningProcess
        if ($ownerPid -le 0) {
            continue
        }

        $proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
        $procName = if ($null -eq $proc) { "unknown" } else { $proc.ProcessName }

        try {
            Stop-Process -Id $ownerPid -Force -ErrorAction Stop
            Write-Log "KILL" "Stopped process [$procName] PID=$ownerPid on port [$($target.LocalPort)]"
        } catch {
            Write-Log "WARN" "Failed to stop PID=$ownerPid on port [$($target.LocalPort)]: $($_.Exception.Message)"
        }
    }

    Start-Sleep -Seconds 1
}

function Ensure-LocalArtifacts() {
    if (-not (Test-Path $rootPom)) {
        Write-Log "FAIL" "Root pom not found: $rootPom"
        exit 1
    }

    $mvnInstall = "mvn -f '$rootPom' -DskipTests install"
    if (Test-Path $mavenSettingsFile) {
        $mvnInstall = "mvn -s '$mavenSettingsFile' -f '$rootPom' -DskipTests install"
    }

    Write-Log "STEP" "0/4 Build and install local modules"
    Write-Log "INFO" "Installing reactor artifacts to local Maven repository..."
    & powershell -NoProfile -Command "cd '$root'; $mvnInstall"
    if ($LASTEXITCODE -ne 0) {
        Write-Log "FAIL" "Maven install failed, cannot continue startup."
        exit 1
    }
}

function Start-ServiceModule($module, $port) {
    if (Test-PortListening $port) {
        Write-Log "SKIP" "Module [$module] already listening on port [$port], skip launch."
        return
    }

    $modulePom = Join-Path $root "$module/pom.xml"
    $mvnRun = "mvn -f '$modulePom' spring-boot:run"
    if (Test-Path $mavenSettingsFile) {
        $mvnRun = "mvn -s '$mavenSettingsFile' -f '$modulePom' spring-boot:run"
    }

    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    $logFile = Join-Path $logDir ("{0}-{1}.log" -f $module, (Get-Date -Format "yyyyMMdd-HHmmss"))
    $cmd = "cd '$root'; $mvnRun *>&1 | Tee-Object -FilePath '$logFile' -Append"
    Write-Log "START" "Launching backend module [$module] on port [$port], log: $logFile"
    Start-ModuleProcess $cmd $module
}

function Start-Frontend() {
    if (Test-PortListening 5173) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Log "SKIP" "Frontend port [5173] already in use and reachable, skip launch."
                return
            }
        } catch {
            $owner = Get-PortOwner 5173
            Write-Log "FAIL" "Port [5173] is occupied by [$owner], but frontend is not reachable. Please stop that process and retry."
            exit 1
        }
    }

    if (-not (Test-Path $frontendDir)) {
        Write-Log "FAIL" "Frontend directory not found: $frontendDir"
        exit 1
    }

    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }
    $logFile = Join-Path $logDir ("frontend-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
    $cmd = "cd '$frontendDir'; npm.cmd run dev -- --host 0.0.0.0 --port 5173 --strictPort *>&1 | Tee-Object -FilePath '$logFile' -Append"
    Write-Log "START" "Launching frontend dev server on port [5173], log: $logFile"
    Start-ModuleProcess $cmd "frontend"
}

function Wait-Health($url, $name, $retry = 30, $sleepSeconds = 2) {
    for ($i = 1; $i -le $retry; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Log "OK" "$name reachable: $url"
                return
            }
        } catch {
            Write-Log "WAIT" "$name not ready ($i/$retry): $url"
        }

        Start-Sleep -Seconds $sleepSeconds
    }

    Write-Log "FAIL" "$name health check timeout: $url"
    exit 1
}

function Wait-EurekaRegistrations($expected = 2, $retry = 40, $sleepSeconds = 2) {
    for ($i = 1; $i -le $retry; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:8761/eureka/apps" -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) {
                $matchCount = ([regex]::Matches($resp.Content, "<application>")).Count
                if ($matchCount -ge $expected) {
                    Write-Log "OK" "Eureka registered apps: $matchCount (expected >= $expected)"
                    return
                }
                Write-Log "WAIT" "Eureka apps: $matchCount (expected >= $expected), retry $i/$retry"
            }
        } catch {
            Write-Log "WAIT" "Eureka registration not ready, retry $i/$retry"
        }

        Start-Sleep -Seconds $sleepSeconds
    }

    Write-Log "FAIL" "Eureka registration timeout: expected >= $expected apps"
    exit 1
}

function Wait-GatewayAuthRouteReady($retry = 45, $sleepSeconds = 2) {
    $probeBody = '{"username":"__startup_probe__","password":"__startup_probe__"}'

    for ($i = 1; $i -le $retry; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:9000/api/auth/login" -Method POST -ContentType "application/json" -Body $probeBody -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                Write-Log "OK" "Gateway route to auth-service is ready (status=$($resp.StatusCode))"
                return
            }
            Write-Log "WAIT" "Gateway route to auth-service returned status=$($resp.StatusCode), retry $i/$retry"
        } catch {
            $statusCode = $null
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
                $statusCode = [int]$_.Exception.Response.StatusCode
                if ($statusCode -ge 200 -and $statusCode -lt 500) {
                    Write-Log "OK" "Gateway route to auth-service is ready (status=$statusCode)"
                    return
                }
            }

            if ($null -eq $statusCode) {
                Write-Log "WAIT" "Gateway route to auth-service not ready, retry $i/$retry"
            } else {
                Write-Log "WAIT" "Gateway route to auth-service returned status=$statusCode, retry $i/$retry"
            }
        }

        Start-Sleep -Seconds $sleepSeconds
    }

    Write-Log "FAIL" "Gateway route to auth-service readiness timeout"
    exit 1
}

function Print-Urls() {
    Write-Section "Startup Summary / Access URLs"
    Write-Log "INFO" "Local access URLs (copy and open in browser):"
    foreach ($item in $urls.GetEnumerator()) {
        Write-Host ("  - {0}: {1}" -f $item.Key, $item.Value)
    }
}

Write-Section "O2O Hitch - One Key Startup"
if ($ShowServiceWindows) {
    Write-Log "INFO" "Service windows mode: visible"
} else {
    Write-Log "INFO" "Service windows mode: hidden (default)"
}
Write-Log "INFO" "Use -ShowServiceWindows if you need visible per-service terminals."
Write-Log "INFO" "Project root: $root"
$startupSucceeded = $false

try {
    if (Test-Path $mavenSettingsFile) {
        Write-Log "INFO" "Using Maven settings: $mavenSettingsFile"
    } else {
        Write-Log "INFO" "Maven settings not found, using default local repository"
    }

    Assert-Command "mvn" "Please install Maven and add it to PATH."
    Assert-Command "npm" "Please install Node.js/NPM and add it to PATH."
    Clear-StartupPorts
    Ensure-LocalArtifacts

    Write-Log "STEP" "1/4 Start infrastructure services"
    Start-ServiceModule "config-server" 8888
    Wait-Health "http://localhost:8888/actuator/health" "config-server"
    Start-ServiceModule "eureka-server" 8761
    Wait-Health "http://localhost:8761" "eureka-server"

    Write-Log "STEP" "2/4 Start gateway and auth services"
    Start-ServiceModule "gateway-zuul" 9000
    Start-ServiceModule "auth-service" 9010
    Wait-Health "http://localhost:9000/actuator/health" "gateway-zuul" 90
    Wait-Health "http://localhost:9010/actuator/health" "auth-service" 90
    Wait-GatewayAuthRouteReady

    Write-Log "STEP" "3/4 Start business services"
    Start-ServiceModule "user-service" 9011
    Start-ServiceModule "driver-service" 9012
    Start-ServiceModule "passenger-service" 9013
    Start-ServiceModule "trip-service" 9014
    Start-ServiceModule "order-service" 9015
    Wait-EurekaRegistrations 2

    Write-Log "STEP" "4/4 Start frontend"
    Start-Frontend
    Wait-Health "http://localhost:5173" "frontend"

    $startupSucceeded = $true
    Write-Log "OK" "Startup flow completed."
} catch {
    Write-Log "FAIL" ("Startup interrupted: " + $_.Exception.Message)
    throw
} finally {
    Print-Urls
    if ($startupSucceeded) {
        Write-Log "INFO" "Opening frontend in default browser..."
        Start-Process $urls["Frontend"] | Out-Null
        Write-Log "INFO" "If page does not open, manually visit Frontend URL above."
    } else {
        Write-Log "INFO" "Some services may still be starting in background processes. Please check logs in ./logs."
        Write-Log "INFO" "You can still try the URLs above to verify which services are ready."
    }
}


