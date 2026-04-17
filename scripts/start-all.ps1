$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$mavenSettingsFile = Join-Path $root ".mvn-local-settings.xml"
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

function Assert-Command($command, $installHint) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        Write-Log "FAIL" "Missing command: $command. $installHint"
        exit 1
    }
    Write-Log "OK" "Found command: $command"
}

function Start-ServiceModule($module, $port) {
    $modulePom = Join-Path $root "$module/pom.xml"
    $mvnRun = "mvn -f '$modulePom' spring-boot:run"
    if (Test-Path $mavenSettingsFile) {
        $mvnRun = "mvn -s '$mavenSettingsFile' -f '$modulePom' spring-boot:run"
    }

    $cmd = "cd '$root'; $mvnRun"
    Write-Log "START" "Launching backend module [$module] on port [$port]"
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $cmd | Out-Null
}

function Start-Frontend() {
    if (-not (Test-Path $frontendDir)) {
        Write-Log "FAIL" "Frontend directory not found: $frontendDir"
        exit 1
    }

    $cmd = "cd '$frontendDir'; npm.cmd run dev -- --host localhost --port 5173 --strictPort"
    Write-Log "START" "Launching frontend dev server on port [5173]"
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $cmd | Out-Null
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

function Print-Urls() {
    Write-Log "INFO" "Local access URLs:"
    foreach ($item in $urls.GetEnumerator()) {
        Write-Host ("  - {0}: {1}" -f $item.Key, $item.Value)
    }
}

Write-Log "INFO" "Project root: $root"
if (Test-Path $mavenSettingsFile) {
    Write-Log "INFO" "Using Maven settings: $mavenSettingsFile"
} else {
    Write-Log "INFO" "Maven settings not found, using default local repository"
}
Assert-Command "mvn" "Please install Maven and add it to PATH."
Assert-Command "npm" "Please install Node.js/NPM and add it to PATH."

Write-Log "STEP" "1/4 Start infrastructure services"
Start-ServiceModule "config-server" 8888
Wait-Health "http://localhost:8888/actuator/health" "config-server"
Start-ServiceModule "eureka-server" 8761
Wait-Health "http://localhost:8761" "eureka-server"

Write-Log "STEP" "2/4 Start gateway and auth services"
Start-ServiceModule "gateway-zuul" 9000
Start-ServiceModule "auth-service" 9010
Wait-Health "http://localhost:9000/actuator/health" "gateway-zuul"
Wait-Health "http://localhost:9010/actuator/health" "auth-service"

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

Write-Log "OK" "Startup flow completed."
Print-Urls
Write-Log "INFO" "Opening frontend in default browser..."
Start-Process $urls["Frontend"] | Out-Null
