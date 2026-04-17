#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOG_DIR="${ROOT_DIR}/logs/startup"
MAVEN_SETTINGS_FILE="${ROOT_DIR}/.mvn-local-settings.xml"

mkdir -p "${LOG_DIR}"

log() {
  local level="$1"
  local message="$2"
  printf '[%s][%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "${level}" "${message}"
}

assert_command() {
  local command_name="$1"
  local install_hint="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    log "FAIL" "Missing command: ${command_name}. ${install_hint}"
    exit 1
  fi
  log "OK" "Found command: ${command_name}"
}

start_module() {
  local module="$1"
  local port="$2"
  local logfile="${LOG_DIR}/${module}.log"
  local module_pom="${ROOT_DIR}/${module}/pom.xml"
  local mvn_cmd="mvn -f \"${module_pom}\" spring-boot:run"

  log "START" "Launching backend module [${module}] on port [${port}]"
  if [[ -f "${MAVEN_SETTINGS_FILE}" ]]; then
    mvn_cmd="mvn -s \"${MAVEN_SETTINGS_FILE}\" -f \"${module_pom}\" spring-boot:run"
  fi
  nohup bash -lc "${mvn_cmd}" >"${logfile}" 2>&1 &
  log "INFO" "Log file: ${logfile}"
}

start_frontend() {
  if [[ ! -d "${FRONTEND_DIR}" ]]; then
    log "FAIL" "Frontend directory not found: ${FRONTEND_DIR}"
    exit 1
  fi

  local logfile="${LOG_DIR}/frontend.log"
  log "START" "Launching frontend dev server on port [5173]"
  (
    cd "${FRONTEND_DIR}"
    nohup npm run dev -- --host localhost --port 5173 --strictPort >"${logfile}" 2>&1 &
  )
  log "INFO" "Log file: ${logfile}"
}

wait_health() {
  local url="$1"
  local name="$2"
  local retry="${3:-30}"
  local sleep_seconds="${4:-2}"

  for ((i = 1; i <= retry; i++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      log "OK" "${name} reachable: ${url}"
      return 0
    fi
    log "WAIT" "${name} not ready (${i}/${retry}): ${url}"
    sleep "${sleep_seconds}"
  done

  log "FAIL" "${name} health check timeout: ${url}"
  exit 1
}

wait_eureka_registrations() {
  local expected="${1:-2}"
  local retry="${2:-40}"
  local sleep_seconds="${3:-2}"

  for ((i = 1; i <= retry; i++)); do
    local content
    if content="$(curl -fsS "http://localhost:8761/eureka/apps" 2>/dev/null)"; then
      local count
      count="$(printf '%s' "${content}" | grep -o '<application>' | wc -l | tr -d ' ')"
      if [[ "${count}" -ge "${expected}" ]]; then
        log "OK" "Eureka registered apps: ${count} (expected >= ${expected})"
        return 0
      fi
      log "WAIT" "Eureka apps: ${count} (expected >= ${expected}), retry ${i}/${retry}"
    else
      log "WAIT" "Eureka registration not ready, retry ${i}/${retry}"
    fi
    sleep "${sleep_seconds}"
  done

  log "FAIL" "Eureka registration timeout: expected >= ${expected} apps"
  exit 1
}

print_urls() {
  log "INFO" "Local access URLs:"
  echo "  - Frontend: http://localhost:5173"
  echo "  - Gateway: http://localhost:9000"
  echo "  - Gateway Health: http://localhost:9000/actuator/health"
  echo "  - Config Server Health: http://localhost:8888/actuator/health"
  echo "  - Eureka Dashboard: http://localhost:8761"
  echo "  - Eureka Apps: http://localhost:8761/eureka/apps"
  echo "  - Auth Login API (via Gate): http://localhost:9000/api/auth/login"
}

open_frontend_if_possible() {
  if command -v xdg-open >/dev/null 2>&1; then
    log "INFO" "Opening frontend in default browser..."
    xdg-open "http://localhost:5173" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    log "INFO" "Opening frontend in default browser..."
    open "http://localhost:5173" >/dev/null 2>&1 || true
  else
    log "INFO" "No URL opener found. Open manually: http://localhost:5173"
  fi
}

cd "${ROOT_DIR}"
log "INFO" "Project root: ${ROOT_DIR}"
if [[ -f "${MAVEN_SETTINGS_FILE}" ]]; then
  log "INFO" "Using Maven settings: ${MAVEN_SETTINGS_FILE}"
else
  log "INFO" "Maven settings not found, using default local repository"
fi
assert_command mvn "Please install Maven and add it to PATH."
assert_command npm "Please install Node.js/NPM and add it to PATH."
assert_command curl "Please install curl and add it to PATH."

log "STEP" "1/4 Start infrastructure services"
start_module "config-server" "8888"
wait_health "http://localhost:8888/actuator/health" "config-server"
start_module "eureka-server" "8761"
wait_health "http://localhost:8761" "eureka-server"

log "STEP" "2/4 Start gateway and auth services"
start_module "gateway-zuul" "9000"
start_module "auth-service" "9010"
wait_health "http://localhost:9000/actuator/health" "gateway-zuul"
wait_health "http://localhost:9010/actuator/health" "auth-service"

log "STEP" "3/4 Start business services"
start_module "user-service" "9011"
start_module "driver-service" "9012"
start_module "passenger-service" "9013"
start_module "trip-service" "9014"
start_module "order-service" "9015"
wait_eureka_registrations 2

log "STEP" "4/4 Start frontend"
start_frontend
wait_health "http://localhost:5173" "frontend"

log "OK" "Startup flow completed."
print_urls
open_frontend_if_possible
