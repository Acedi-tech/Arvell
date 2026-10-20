#!/bin/bash
# E2E-прогон ARVELL на телефоне, подключённом по USB.
#
#   .maestro/tools/run.sh [путь/к/app.apk]
#
# 1. Проверяет, что телефон подключён и отладка разрешена.
# 2. Если передан APK — ставит его поверх установленного (подпись EAS).
# 3. Гоняет все сценарии из .maestro/flows одним запуском Maestro (драйвер
#    ставится один раз), окно MIUI «Установка через USB» подтверждает
#    miui-autoaccept.sh.
# 4. Пишет JUnit-отчёт и скриншоты в .maestro/out/<дата>/, код выхода
#    ненулевой, если упал хоть один сценарий.
#
# Требования к телефону (MIUI, «Для разработчиков»): «Отладка по USB»,
# «Установка через USB», «Отладка по USB (настройки безопасности)».
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
APP_ID=com.arvell.app
APK=${1:-}
OUT=$ROOT/out/$(date +%Y-%m-%d_%H%M)
MAESTRO=${MAESTRO:-$HOME/.maestro/bin/maestro}
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
mkdir -p "$OUT"

fail() { echo "❌ $*" | tee "$OUT/summary.txt"; exit 2; }

state=$(adb get-state 2>&1)
[ "$state" = device ] || fail "телефон не готов к прогону ($state) — переподключите кабель и подтвердите отладку"

# Окно «Установка через USB» подтверждаем всё время прогона.
"$(dirname "$0")/miui-autoaccept.sh" $$ > "$OUT/autoaccept.log" 2>&1 &

if [ -n "$APK" ]; then
  echo "Ставлю $APK"
  adb install -r "$APK" > "$OUT/install.log" 2>&1 || fail "APK не встал: $(tail -1 "$OUT/install.log")"
fi
version=$(adb shell dumpsys package $APP_ID | grep -m1 lastUpdateTime | sed 's/.*=//')
[ -n "$version" ] || fail "на телефоне нет $APP_ID"

# Экран не должен гаснуть посреди прогона.
adb shell svc power stayon usb >/dev/null 2>&1
adb shell input keyevent KEYCODE_WAKEUP

echo "Сборка на телефоне от $version, сценарии: $ROOT/flows"
"$MAESTRO" test "$ROOT" ${MAESTRO_ARGS:-} \
  --format junit --output "$OUT/report.xml" \
  --test-output-dir "$OUT" 2>&1 | tee "$OUT/maestro.log"
code=${PIPESTATUS[0]}

total=$(grep -c '<testcase' "$OUT/report.xml" 2>/dev/null); total=${total:-0}
failed=$(grep -c '<failure' "$OUT/report.xml" 2>/dev/null); failed=${failed:-0}
{
  echo "Сборка от $version · сценариев: $total · прошло: $((total - failed)) · упало: $failed"
  grep -oE '<testcase [^>]*name="[^"]+"|<failure[^>]*message="[^"]*"' "$OUT/report.xml" 2>/dev/null \
    | sed -E 's/<testcase [^>]*name="([^"]+)"/• \1/; s/<failure[^>]*message="([^"]*)"/    ↳ \1/'
} | tee "$OUT/summary.txt"
echo "Отчёт: $OUT"
exit $code
