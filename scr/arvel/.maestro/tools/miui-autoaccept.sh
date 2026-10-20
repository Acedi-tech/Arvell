#!/bin/bash
# Подтверждает на телефоне окно MIUI «Установка через USB».
#
# Maestro ставит свой драйвер (dev.mobile.maestro и .test) в начале каждого
# прогона, а MIUI на каждую установку по USB показывает окно с таймером — без
# нажатия установка отменяется (INSTALL_FAILED_USER_RESTRICTED). Нажатие через
# adb работает, если в «Для разработчиков» включена «Отладка по USB (настройки
# безопасности)». Тем же окном подтверждается установка свежего APK.
#
#   miui-autoaccept.sh <PID>            — пока жив процесс PID (adb install)
#   miui-autoaccept.sh <PID> --driver   — пока не встанут оба пакета драйвера
#
# Опрос лёгкий: смотрим только, какое окно в фокусе, и снимаем дамп UI, лишь
# когда в фокусе чужое окно. Раньше дамп снимался раз в секунду весь прогон —
# это мешало драйверу Maestro и роняло adb по USB («UsbFfs: connection
# terminated», 20.10).
set -u
WATCH_PID=${1:?нужен PID процесса, пока он жив — следим}
MODE=${2:-}
DEADLINE=$(( $(date +%s) + 180 ))

center() {
  # bounds="[x1,y1][x2,y2]" элемента с text="$1" → «x y» центра
  grep -oE "text=\"$1\"[^>]*bounds=\"[^\"]+\"" <<<"$2" | head -1 \
    | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/' \
    | awk '{ if (NF == 4) print int(($1+$3)/2), int(($2+$4)/2) }'
}

driver_ready() {
  local pkgs; pkgs=$(adb shell pm list packages dev.mobile.maestro 2>/dev/null)
  grep -q 'dev.mobile.maestro$' <<<"$pkgs" && grep -q 'dev.mobile.maestro.test' <<<"$pkgs"
}

while kill -0 "$WATCH_PID" 2>/dev/null && [ "$(date +%s)" -lt "$DEADLINE" ]; do
  if [ "$MODE" = --driver ] && driver_ready; then
    echo "[autoaccept] драйвер Maestro установлен"
    exit 0
  fi
  focus=$(adb shell dumpsys window 2>/dev/null | grep -m1 mCurrentFocus)
  if [ -n "$focus" ] && ! grep -qE 'com\.arvell\.app|dev\.mobile\.maestro|Launcher' <<<"$focus"; then
    ui=$(adb shell 'uiautomator dump /sdcard/autoaccept.xml >/dev/null 2>&1 && cat /sdcard/autoaccept.xml' 2>/dev/null)
    if grep -q 'Установка через USB' <<<"$ui"; then
      for label in 'Запомнить выбор' 'Установить'; do
        xy=$(center "$label" "$ui")
        [ -n "$xy" ] && adb shell input tap $xy
      done
      echo "[autoaccept] подтверждена установка через USB ($focus)"
      sleep 3
    fi
  fi
  sleep 2
done
