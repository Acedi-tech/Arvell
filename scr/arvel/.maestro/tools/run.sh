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

# DEVICE=192.168.31.114:5555 — гонять через adb по Wi-Fi (кабель только
# заряжает). По USB телефон QA рвёт связь на больших деревьях UI (формы,
# каталог): «UsbFfs: connection terminated», 20.10.
if [ -n "${DEVICE:-}" ]; then
  export ANDROID_SERIAL=$DEVICE
  adb connect "$DEVICE" >/dev/null 2>&1
  MAESTRO_DEVICE=(--device "$DEVICE")
else
  MAESTRO_DEVICE=()
fi

fail() { echo "❌ $*" | tee "$OUT/summary.txt"; exit 2; }

state=$(adb get-state 2>&1)
[ "$state" = device ] || fail "телефон не готов к прогону ($state) — переподключите кабель и подтвердите отладку"

AUTOACCEPT="$(dirname "$0")/miui-autoaccept.sh"

# Окно «Установка через USB» подтверждаем только пока идёт установка.
if [ -n "$APK" ]; then
  echo "Ставлю $APK"
  adb install -r "$APK" > "$OUT/install.log" 2>&1 &
  install_pid=$!
  "$AUTOACCEPT" $install_pid >> "$OUT/autoaccept.log" 2>&1 &
  wait $install_pid || fail "APK не встал: $(tail -1 "$OUT/install.log")"
fi
# Сразу после переподключения adb dumpsys иногда отвечает пусто — три попытки.
for _ in 1 2 3; do
  version=$(adb shell dumpsys package $APP_ID | grep -m1 lastUpdateTime | sed 's/.*=//')
  [ -n "$version" ] && break; sleep 3
done
[ -n "$version" ] || fail "на телефоне нет $APP_ID"

# Экран не должен гаснуть ни посреди прогона, ни между ними: на погашенном
# заблокированном экране окно MIUI «Установка через USB» не нажать, и драйвер
# Maestro не встаёт (21.10). stayon true — при любой зарядке (телефон по кабелю
# числится «AC powered», и stayon usb не срабатывал).
adb shell svc power stayon true >/dev/null 2>&1
adb shell input keyevent KEYCODE_WAKEUP
sleep 1
if adb shell dumpsys window | grep -q 'isKeyguardShowing=true'; then
  fail "экран телефона заблокирован — разблокируйте его один раз, дальше он не будет гаснуть, пока заряжается"
fi

echo "Сборка на телефоне от $version, сценарии: $ROOT/flows"
# Драйвер Maestro ставится в начале прогона — подтверждаем, пока не встанет.
# Остатки прерванного прогона убираем, иначе autoaccept решил бы, что всё уже
# стоит, а Maestro всё равно переставил бы драйвер и упёрся в окно MIUI.
adb uninstall dev.mobile.maestro.test >/dev/null 2>&1
adb uninstall dev.mobile.maestro >/dev/null 2>&1
"$AUTOACCEPT" $$ --driver >> "$OUT/autoaccept.log" 2>&1 &
"$MAESTRO" "${MAESTRO_DEVICE[@]}" test "$ROOT" ${MAESTRO_ARGS:-} \
  -e BUYER_PHONE="${BUYER_PHONE:-9991234567}" -e SELLER_PHONE="${SELLER_PHONE:-9990020001}" \
  --format junit --output "$OUT/report.xml" \
  --test-output-dir "$OUT" 2>&1 | tee "$OUT/maestro.log"
code=${PIPESTATUS[0]}

# Телефон отвалился посреди прогона (кабель, перезапуск USB) — падения после
# этого не про приложение, так и пишем.
if grep -q "device '.*' not found" "$OUT/maestro.log" || [ "$(adb get-state 2>&1)" != device ]; then
  fail "телефон отключился во время прогона — результаты недостоверны, проверьте кабель и повторите"
fi

total=$(grep -c '<testcase' "$OUT/report.xml" 2>/dev/null); total=${total:-0}
failed=$(grep -c '<failure' "$OUT/report.xml" 2>/dev/null); failed=${failed:-0}
{
  echo "Сборка от $version · сценариев: $total · прошло: $((total - failed)) · упало: $failed"
  grep -oE '<testcase [^>]*name="[^"]+"|<failure[^>]*message="[^"]*"' "$OUT/report.xml" 2>/dev/null \
    | sed -E 's/<testcase [^>]*name="([^"]+)"/• \1/; s/<failure[^>]*message="([^"]*)"/    ↳ \1/'
} | tee "$OUT/summary.txt"
echo "Отчёт: $OUT"
exit $code
