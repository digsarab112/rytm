#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/sites/rytm}"
SERVICE_NAME="${SERVICE_NAME:-rytm-web}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
RUN_SEED="${RUN_SEED:-false}"

log() {
  printf "\n==> %s\n" "$*"
}

run_systemctl() {
  if [ "$(id -u)" -eq 0 ]; then
    systemctl "$@"
  else
    sudo systemctl "$@"
  fi
}

run_journalctl() {
  if [ "$(id -u)" -eq 0 ]; then
    journalctl "$@"
  else
    sudo journalctl "$@"
  fi
}

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Project git directory was not found at: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

log "Pulling latest code from $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

log "Installing dependencies"
npm ci

log "Applying database migrations"
npm run db:deploy

log "Repairing known safe database drift"
npm run db:repair

log "Database check"
npm run db:doctor

if [ "$RUN_SEED" = "true" ]; then
  log "Seeding database"
  npm run db:seed
fi

log "Building production app"
npm run build

log "Restarting $SERVICE_NAME"
run_systemctl restart "$SERVICE_NAME"

log "$SERVICE_NAME status"
run_systemctl --no-pager --full status "$SERVICE_NAME"

log "Recent $SERVICE_NAME logs"
run_journalctl -u "$SERVICE_NAME" -n 30 --no-pager
