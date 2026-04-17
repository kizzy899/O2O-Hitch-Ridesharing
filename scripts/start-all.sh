#!/usr/bin/env bash
# O2O Hitch - Linux/macOS one-key startup (with Windows Git Bash compatibility)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOG_DIR="${ROOT_DIR}/logs/startup"
MAVEN_SETTINGS_FILE="${ROOT_DIR}/.mvn-local-settings.xml"

CLEAN_PORTS=true
OPEN_BROWSER=true
SKIP_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --no-clean-ports)
      CLEAN_PORTS=false
      ;;
    --no-open)
      OPEN_BROWSER=false
      ;;
    --skip-install)
      SKIP_INSTALL=true
      ;;
    *)
      ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
step() { echo -e "${BLUE}[STEP]${NC} $1"; }

section() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

is_windows_shell() {
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) return 0 ;;
    *) return 1 ;;
  esac
}

is_wsl_shell() {
  if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    return 0
  fi
  return 1
}

should_use_maven_settings() {
  if [ ! -f "${MAVEN_SETTINGS_FILE}" ]; then
    return 1
  fi
  if is_wsl_shell; then
    return 1
  fi
  return 0
}

resolve_npm_command() {
  if is_windows_shell && command -v npm.cmd >/dev/null 2>&1; then
    echo "npm.cmd"
  else
    echo "npm"
  fi
}

assert_command() {
  local command_name="$1"
  local install_hint="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "Missing command: ${command_name}. ${install_hint}"
    exit 1
  fi
  ok "Detected command: ${command_name}"
}

port_owner_pid() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"${port}" -sTCP:LISTEN 2>/dev/null | head -n1 || true
    return
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -lntp "( sport = :${port} )" 2>/dev/null | awk -F'pid=' 'NR>1 {print $2}' | awk -F',' '{print $1}' | head -n1 || true
    return
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ano -p tcp 2>/dev/null | awk -v p=":${port}" '$1 == "TCP" && $2 ~ p"$" && $4 == "LISTENING" {print $5; exit}' || true
    return
  fi
  echo ""
}

is_port_listening() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -i tcp:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -lnt "( sport = :${port} )" 2>/dev/null | grep -q ":${port}"
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ano -p tcp 2>/dev/null | awk -v p=":${port}" '$1 == "TCP" && $2 ~ p"$" && $4 == "LISTENING" {found=1} END{exit found ? 0 : 1}'
    return $?
  fi
  return 1
}

wait_port_free() {
  local port="$1"
  local retry="${2:-20}"
  local i=1
  while [ "${i}" -le "${retry}" ]; do
    if ! is_port_listening "${port}"; then
      return 0
    fi
    sleep 0.2
    i=$((i + 1))
  done
  return 1
}

kill_pid() {
  local pid="$1"
  if is_windows_shell; then
    taskkill.exe /PID "${pid}" /F >/dev/null 2>&1 || true
  else
    kill "${pid}" >/dev/null 2>&1 || true
  fi
}

clean_startup_ports() {
  local ports=(5173 8761 8888 9000 9010 9011 9012 9013 9014 9015)
  step "Preflight: clean occupied project ports"

  local any_killed=false
  local port
  for port in "${ports[@]}"; do
    if ! is_port_listening "${port}"; then
      continue
    fi

    local pid
    pid="$(port_owner_pid "${port}")"
    if [ -z "${pid}" ]; then
      warn "Port ${port} is occupied, but PID could not be resolved"
      continue
    fi

    warn "Freeing port ${port} (PID=${pid})"
    kill_pid "${pid}"
    sleep 0.3
    if is_port_listening "${port}"; then
      kill_pid "${pid}"
    fi

    if wait_port_free "${port}" 20; then
      ok "Port ${port} released"
      any_killed=true
    else
      fail "Failed to release port ${port}, please stop it manually"
      exit 1
    fi
  done

  if [ "${any_killed}" = false ]; then
    ok "No occupied project ports detected"
  fi
}

ensure_local_artifacts() {
  if [ "${SKIP_INSTALL}" = true ]; then
    warn "Skipping Maven install (--skip-install)"
    return 0
  fi

  step "0/4 Build and install local modules"
  cd "${ROOT_DIR}"
  local mvn_cmd=(mvn -f pom.xml -DskipTests install)
  if should_use_maven_settings; then
    mvn_cmd=(mvn -s "${MAVEN_SETTINGS_FILE}" -f pom.xml -DskipTests install)
  fi

  "${mvn_cmd[@]}"
  ok "Local Maven install completed"
}

start_module() {
  local module="$1"
  local port="$2"
  local logfile="${LOG_DIR}/${module}-$(date '+%Y%m%d-%H%M%S').log"
  local module_pom="${ROOT_DIR}/${module}/pom.xml"
  local mvn_cmd=(mvn -f "${module_pom}" spring-boot:run)

  if should_use_maven_settings; then
    mvn_cmd=(mvn -s "${MAVEN_SETTINGS_FILE}" -f "${module_pom}" spring-boot:run)
  fi

  info "Starting backend module [${module}] (port=${port})"
  nohup "${mvn_cmd[@]}" >"${logfile}" 2>&1 &
  ok "${module} start command sent, log: ${logfile}"
}

start_frontend() {
  if [ ! -d "${FRONTEND_DIR}" ]; then
    fail "Frontend directory not found: ${FRONTEND_DIR}"
    exit 1
  fi

  if is_port_listening "5173"; then
    if curl -fsS "http://127.0.0.1:5173" >/dev/null 2>&1 || curl -fsS "http://localhost:5173" >/dev/null 2>&1; then
      warn "Frontend already reachable on port 5173, skipping launch"
      return 0
    fi

    local occupied_pid
    occupied_pid="$(port_owner_pid "5173")"
    fail "Port 5173 is occupied but unreachable (PID=${occupied_pid:-unknown}). Please free the port and retry."
    exit 1
  fi

  local logfile="${LOG_DIR}/frontend-$(date '+%Y%m%d-%H%M%S').log"
  local frontend_host="localhost"
  if is_windows_shell; then
    frontend_host="0.0.0.0"
  fi
  local npm_cmd
  npm_cmd="$(resolve_npm_command)"

  info "Starting frontend dev server (port=5173, host=${frontend_host})"
  (
    cd "${FRONTEND_DIR}"
    nohup "${npm_cmd}" run dev -- --host "${frontend_host}" --port 5173 --strictPort >"${logfile}" 2>&1 &
  )
  ok "Frontend start command sent, log: ${logfile}"
}

wait_health() {
  local url="$1"
  local name="$2"
  local retry="${3:-30}"
  local sleep_seconds="${4:-2}"

  local i
  for ((i = 1; i <= retry; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      ok "${name} reachable: ${url}"
      return 0
    fi
    info "${name} waiting (${i}/${retry}): ${url}"
    sleep "${sleep_seconds}"
  done

  fail "${name} health check timeout: ${url}"
  exit 1
}

wait_eureka_registrations() {
  local expected="${1:-2}"
  local retry="${2:-40}"
  local sleep_seconds="${3:-2}"

  local i
  for ((i = 1; i <= retry; i++)); do
    local content
    if content="$(curl -fsS "http://localhost:8761/eureka/apps" 2>/dev/null)"; then
      local count
      count="$(printf '%s' "${content}" | grep -o '<application>' | wc -l | tr -d ' ')"
      if [ "${count}" -ge "${expected}" ]; then
        ok "Eureka registered apps: ${count} (>= ${expected})"
        return 0
      fi
      info "Eureka registration waiting (${i}/${retry}): ${count}/${expected}"
    else
      info "Eureka registration waiting (${i}/${retry})"
    fi
    sleep "${sleep_seconds}"
  done

  fail "Eureka registration timeout: expected >= ${expected}"
  exit 1
}

print_urls() {
  section "Startup Summary / Access URLs"
  echo "  - Frontend: http://localhost:5173"
  echo "  - Gateway: http://localhost:9000"
  echo "  - Gateway Health: http://localhost:9000/actuator/health"
  echo "  - Config Server Health: http://localhost:8888/actuator/health"
  echo "  - Eureka Dashboard: http://localhost:8761"
  echo "  - Eureka Apps: http://localhost:8761/eureka/apps"
  echo "  - Auth Login API (via Gate): http://localhost:9000/api/auth/login"
}

open_frontend_if_possible() {
  if [ "${OPEN_BROWSER}" = false ]; then
    warn "Auto-open browser disabled (--no-open)"
    return 0
  fi

  if command -v xdg-open >/dev/null 2>&1; then
    info "Opening frontend page..."
    xdg-open "http://localhost:5173" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    info "Opening frontend page..."
    open "http://localhost:5173" >/dev/null 2>&1 || true
  else
    warn "No URL open command found. Please visit: http://localhost:5173"
  fi
}

main() {
  if is_wsl_shell; then
    if command -v powershell.exe >/dev/null 2>&1 && command -v wslpath >/dev/null 2>&1; then
      local win_root
      win_root="$(wslpath -w "${ROOT_DIR}")"
      info "Detected WSL shell, delegating startup to PowerShell script for stable localhost networking"
      powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${win_root}\\scripts\\start-all.ps1"
      exit $?
    fi
    warn "Detected WSL shell but unable to delegate to PowerShell. Startup may fail due to localhost forwarding."
  fi

  mkdir -p "${LOG_DIR}"
  cd "${ROOT_DIR}"

  section "O2O Hitch - Linux/macOS One Key Startup"
  info "Project root: ${ROOT_DIR}"
  if should_use_maven_settings; then
    info "Using Maven settings: ${MAVEN_SETTINGS_FILE}"
  elif [ -f "${MAVEN_SETTINGS_FILE}" ] && is_wsl_shell; then
    warn "Detected WSL shell, ignoring Maven settings file and using default local repository"
  else
    warn "Maven settings not found, using default local repository"
  fi

  assert_command mvn "Please install Maven and add it to PATH"
  if command -v npm >/dev/null 2>&1 || command -v npm.cmd >/dev/null 2>&1; then
    ok "Detected command: npm"
  else
    fail "Missing command: npm. Please install Node.js/NPM and add it to PATH"
    exit 1
  fi
  assert_command curl "Please install curl and add it to PATH"

  if [ "${CLEAN_PORTS}" = true ]; then
    clean_startup_ports
  else
    warn "Skipping port cleanup (--no-clean-ports)"
  fi

  ensure_local_artifacts

  step "1/4 Start infrastructure services"
  start_module "config-server" "8888"
  wait_health "http://localhost:8888/actuator/health" "config-server" 30 2
  start_module "eureka-server" "8761"
  wait_health "http://localhost:8761" "eureka-server" 30 2

  step "2/4 Start gateway and auth services"
  start_module "gateway-zuul" "9000"
  start_module "auth-service" "9010"
  wait_health "http://localhost:9000/actuator/health" "gateway-zuul" 90 2
  wait_health "http://localhost:9010/actuator/health" "auth-service" 90 2

  step "3/4 Start business services"
  start_module "user-service" "9011"
  start_module "driver-service" "9012"
  start_module "passenger-service" "9013"
  start_module "trip-service" "9014"
  start_module "order-service" "9015"
  wait_eureka_registrations 2 40 2

  step "4/4 Start frontend"
  start_frontend
  if is_windows_shell; then
    wait_health "http://127.0.0.1:5173" "frontend" 30 2
  else
    wait_health "http://localhost:5173" "frontend" 30 2
  fi

  ok "Startup flow completed"
  print_urls
  open_frontend_if_possible
}

main "$@"
