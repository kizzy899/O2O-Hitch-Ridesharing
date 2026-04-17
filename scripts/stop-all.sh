#!/usr/bin/env bash
# ============================================
# O2O Hitch - Linux/macOS 一键停服脚本
# ============================================
# 默认停止端口：
# 5173, 8761, 8888, 9000, 9010-9015
# ============================================

set -euo pipefail

DEFAULT_PORTS=(5173 8761 8888 9000 9010 9011 9012 9013 9014 9015)
PORTS=("${DEFAULT_PORTS[@]}")
FORCE=false
DRY_RUN=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

usage() {
  cat <<'EOF'
用法:
  ./scripts/stop-all.sh [选项]

选项:
  --force             无法优雅退出时，直接 kill -9
  --dry-run           只打印将要停止的进程，不实际停止
  --ports p1,p2,...   自定义端口列表（逗号分隔）
  --help              显示帮助

示例:
  ./scripts/stop-all.sh
  ./scripts/stop-all.sh --force
  ./scripts/stop-all.sh --dry-run --ports 5173,9000
EOF
}

parse_ports() {
  local raw="$1"
  IFS=',' read -r -a PORTS <<<"${raw}"
}

for arg in "$@"; do
  case "${arg}" in
    --force)
      FORCE=true
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --ports=*)
      parse_ports "${arg#*=}"
      ;;
    --ports)
      shift
      if [ $# -eq 0 ]; then
        fail "--ports 需要参数"
        exit 1
      fi
      parse_ports "$1"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      ;;
  esac
done

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
  return 1
}

find_pid_by_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"${port}" -sTCP:LISTEN 2>/dev/null | head -n1 || true
    return
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -lntp "( sport = :${port} )" 2>/dev/null | awk -F'pid=' 'NR>1 {print $2}' | awk -F',' '{print $1}' | head -n1 || true
    return
  fi
  echo ""
}

wait_port_release() {
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

stop_by_port() {
  local port="$1"
  if ! is_port_listening "${port}"; then
    info "端口 ${port} 未占用，跳过"
    return 0
  fi

  local pid
  pid="$(find_pid_by_port "${port}")"
  if [ -z "${pid}" ]; then
    warn "端口 ${port} 被占用，但未识别到 PID"
    return 0
  fi

  local pname
  pname="$(ps -p "${pid}" -o comm= 2>/dev/null | xargs || true)"
  [ -z "${pname}" ] && pname="unknown"

  if [ "${DRY_RUN}" = true ]; then
    info "[dry-run] 将停止: ${pname} (PID=${pid}, port=${port})"
    return 0
  fi

  info "停止进程: ${pname} (PID=${pid}, port=${port})"
  kill "${pid}" >/dev/null 2>&1 || true
  sleep 0.3

  if wait_port_release "${port}" 20; then
    ok "端口 ${port} 已释放"
    return 0
  fi

  if [ "${FORCE}" = true ]; then
    warn "优雅停止失败，执行强制终止: PID=${pid}"
    kill -9 "${pid}" >/dev/null 2>&1 || true
    if wait_port_release "${port}" 20; then
      ok "端口 ${port} 已强制释放"
      return 0
    fi
  fi

  fail "端口 ${port} 仍被占用（PID=${pid}）"
  return 1
}

main() {
  info "准备停止项目服务..."
  info "目标端口: ${PORTS[*]}"
  [ "${DRY_RUN}" = true ] && warn "dry-run 模式，不会实际停止进程"

  local failed=0
  local port
  for port in "${PORTS[@]}"; do
    if ! stop_by_port "${port}"; then
      failed=1
    fi
  done

  if [ "${failed}" -eq 0 ]; then
    ok "停服完成"
  else
    fail "部分端口未成功释放"
    exit 1
  fi
}

main "$@"
