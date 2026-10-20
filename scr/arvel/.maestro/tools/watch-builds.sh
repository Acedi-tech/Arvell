#!/bin/bash
# Автоприёмка: новая Android-сборка EAS (профиль preview) → APK → qa-gate на
# телефоне → вердикт и APK в группу. Запускается таймером systemd раз в 15 мин
# (см. .maestro/tools/systemd/), сам по себе ничего не ждёт.
#
#   watch-builds.sh            — проверить и, если есть новая сборка, принять
#   watch-builds.sh --dry-run  — то же без отправки в группу
#
# Уже проверенные сборки — в ~/arvel-builds/.gate-done (по id EAS), лог —
# ~/arvel-builds/gate.log. Телефон — по Wi-Fi (DEVICE, по умолчанию
# 192.168.31.114:5555); если он не отвечает, сборка остаётся в очереди до
# следующего запуска.
set -uo pipefail

APP_DIR=$(cd "$(dirname "$0")/../.." && pwd)
BUILDS=$HOME/arvel-builds
DONE=$BUILDS/.gate-done
LOCK=$BUILDS/.gate.lock
export DEVICE=${DEVICE:-192.168.31.114:5555}
SEND=--send
[ "${1:-}" = --dry-run ] && SEND=

mkdir -p "$BUILDS"; touch "$DONE"
exec 9>"$LOCK"
flock -n 9 || { echo "приёмка уже идёт"; exit 0; }
log() { echo "$(date '+%F %T') $*" | tee -a "$BUILDS/gate.log"; }

cd "$APP_DIR" || exit 1
latest=$(npx eas-cli build:list --platform android --status finished --build-profile preview \
  --limit 1 --json --non-interactive 2>/dev/null \
  | python3 -I -c 'import json,sys; b=json.load(sys.stdin)[0]; print(b["id"], b.get("gitCommitHash","")[:7], b["artifacts"]["buildUrl"])') \
  || { log "EAS не ответил"; exit 1; }
read -r id commit url <<<"$latest"

grep -qx "$id" "$DONE" && exit 0
log "новая сборка $id ($commit)"

adb connect "$DEVICE" >/dev/null 2>&1
if [ "$(adb -s "$DEVICE" get-state 2>&1)" != device ]; then
  log "телефон $DEVICE не отвечает — сборка $id подождёт следующего запуска"
  exit 1
fi

apk=$BUILDS/arvell-$(date +%Y%m%d-%H%M)-$commit.apk
curl -sfL "$url" -o "$apk" || { log "не скачался APK $url"; exit 1; }
ln -sf "$apk" "$BUILDS/latest.apk"

# Автотесты гоняем на том коде, из которого собрана сборка.
git fetch -q origin 2>/dev/null
if git cat-file -e "$commit^{commit}" 2>/dev/null && [ "$(git rev-parse --short=7 HEAD)" != "$commit" ]; then
  log "внимание: локальный код $(git rev-parse --short=7 HEAD), сборка из $commit — автотесты на локальном"
fi

node scripts/qa-gate.js --apk "$apk" $SEND >> "$BUILDS/gate.log" 2>&1
code=$?
# Вердикт любой (рекомендую / нет) — сборка проверена. Код 2 — сбой самой
# приёмки (телефон отвалился и т.п.), такую сборку попробуем снова.
[ $code -le 1 ] && echo "$id" >> "$DONE"
log "сборка $id: приёмка завершена, код $code"
