#!/bin/bash
# Подтверждает на телефоне окно MIUI «Установка через USB», пока жив процесс $1.
#
# Maestro ставит свой драйвер (dev.mobile.maestro и .test) в начале каждого
# прогона и удаляет в конце, а MIUI на каждую установку по USB показывает окно
# с таймером — без нажатия установка отменяется (INSTALL_FAILED_USER_RESTRICTED).
# Нажатие через adb работает, если в «Для разработчиков» включена
# «Отладка по USB (настройки безопасности)». Тем же окном подтверждается и
# установка свежего APK приложения (см. run.sh).
#
#   miui-autoaccept.sh <PID>
set -u
WATCH_PID=${1:?нужен PID процесса, пока он жив — следим}

center() {
  # bounds="[x1,y1][x2,y2]" элемента с text="$1" → «x y» центра
  grep -oE "text=\"$1\"[^>]*bounds=\"[^\"]+\"" <<<"$2" | head -1 \
    | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/' \
    | awk '{ if (NF == 4) print int(($1+$3)/2), int(($2+$4)/2) }'
}

while kill -0 "$WATCH_PID" 2>/dev/null; do
  ui=$(adb shell 'uiautomator dump /sdcard/autoaccept.xml >/dev/null 2>&1 && cat /sdcard/autoaccept.xml' 2>/dev/null)
  if grep -q 'Установка через USB' <<<"$ui"; then
    for label in 'Запомнить выбор' 'Установить'; do
      xy=$(center "$label" "$ui")
      [ -n "$xy" ] && adb shell input tap $xy
    done
    echo "[autoaccept] подтверждена установка через USB"
    sleep 3
  fi
  sleep 1
done
