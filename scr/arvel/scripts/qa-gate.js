#!/usr/bin/env node
// Приёмка сборки ARVELL: автотесты + E2E на телефоне → вердикт → отчёт в группу.
//
// 1. Jest + сверка с чек-листом (scripts/checklist-report.js).
// 2. APK ставится на телефоны из .maestro/devices.conf (adb по Wi-Fi), на
//    всех параллельно гоняются сценарии Maestro (.maestro/tools/run.sh).
// 3. Вердикт: «рекомендую», если ничего не упало ни там, ни там. Пункт
//    чек-листа без теста — предупреждение, не провал: это вопрос к таблице,
//    а не к сборке.
// 4. С --send отчёт уходит в Telegram-группу (см. scripts/telegram.js), а при
//    «рекомендую» — и сам APK. Без --send отчёт только печатается.
//
//   node scripts/qa-gate.js [--apk путь.apk] [--send] [--skip-e2e]
//   (по умолчанию APK — ~/arvel-builds/latest.apk)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };

const send = flag('--send');
const skipE2e = flag('--skip-e2e');
const apk = path.resolve(opt('--apk', path.join(os.homedir(), 'arvel-builds', 'latest.apk')));
// Telegram Bot API не принимает файлы больше 50 МБ.
const TG_FILE_LIMIT = 50 * 1024 * 1024;
const FRONT = '@acedi10';

const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function run(cmd, cmdArgs) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  process.stdout.write(out.split('\n').slice(-12).join('\n'));
  return { code: r.status, out };
}

// --- 1. Автотесты и чек-лист ---

function unitTests() {
  const { out } = run(process.execPath, ['scripts/checklist-report.js']);
  const m = out.match(/Пунктов: (\d+)\. OK: (\d+), падает: (\d+), без теста: (\d+), пропущено: (\d+)/);
  const extra = out.match(/Тесты вне чек-листа: пройдено (\d+), упало (\d+)/);
  if (!m || !extra) return { error: 'сверка с чек-листом не дошла до итога', out };
  const [, total, ok, failed, missing, skipped] = m.map(Number);
  // Строки пунктов: «  ❌ Текст  — ПАДАЕТ» / «  ⚠️  Текст  — НЕТ ТЕСТА»
  const items = (status) => out.split('\n')
    .filter((l) => l.endsWith(`— ${status}`))
    .map((l) => l.replace(/^\s*\S+\s+/, '').replace(new RegExp(`\\s+— ${status}$`), ''));
  const extraFailedFile = path.join(ROOT, 'coverage', 'extra-failed.json');
  const extraFailed = fs.existsSync(extraFailedFile)
    ? JSON.parse(fs.readFileSync(extraFailedFile, 'utf8')).map((t) => [...t.ancestors, t.title].join(' › '))
    : [];
  return {
    total, ok, failed, missing, skipped,
    extraPassed: Number(extra[1]), extraFailedCount: Number(extra[2]),
    failedItems: items('ПАДАЕТ'), missingItems: items('НЕТ ТЕСТА'), extraFailed,
  };
}

// --- 2. E2E на телефонах ---

// .maestro/devices.conf: «название|adb-адрес|покупатель|продавец|метка|имя покупателя».
function loadDevices() {
  const file = path.join(ROOT, '.maestro', 'devices.conf');
  return fs.readFileSync(file, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [name, serial, buyer, seller, tag, buyerName] = l.split('|').map((x) => x.trim());
      return { name, serial, buyer, seller, tag, buyerName };
    });
}

// Сбой стенда (телефон не на связи, экран заблокирован) — не вердикт по сборке.
const STAND_FAILURE = /отключился|не готов|нет APK|заблокирован|не записал отчёт/;

function runAsync(cmd, cmdArgs, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, { cwd: ROOT, env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => resolve({ code, out }));
  });
}

async function e2eOn(device) {
  if (!fs.existsSync(apk)) return { device, error: `нет APK ${apk}` };
  console.log(`\n$ run.sh на ${device.name} (${device.serial})`);
  const { out } = await runAsync(path.join(ROOT, '.maestro', 'tools', 'run.sh'), [apk], {
    DEVICE: device.serial,
    LABEL: device.tag,
    BUYER_PHONE: device.buyer,
    SELLER_PHONE: device.seller,
    PRODUCT_TAG: device.tag,
    BUYER_NAME: device.buyerName,
  });
  console.log(`--- ${device.name} ---\n${out.split('\n').filter((l) => /^\[|^❌|Сборка от/.test(l)).join('\n')}`);
  return { device, ...parseE2e(out) };
}

function parseE2e(out) {
  const dir = (out.match(/Отчёт: (.+)$/m) || [])[1];
  const fatal = (out.match(/^❌ (.+)$/m) || [])[1];
  if (fatal) return { error: fatal };
  const report = dir && path.join(dir.trim(), 'report.xml');
  if (!report || !fs.existsSync(report)) return { error: 'Maestro не записал отчёт', out };
  const xml = fs.readFileSync(report, 'utf8');
  const flows = [...xml.matchAll(/<testcase [^>]*name="([^"]+)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g)]
    .map(([, name, , body = '']) => {
      const failure = body.match(/<failure[^>]*message="([^"]*)"/) || body.match(/<failure[^>]*>([^<]*)/);
      return { name, failed: !!failure, message: failure ? failure[1] : '' };
    });
  // Последний скриншот каждого упавшего сценария — в отчёт.
  const shots = flows.filter((f) => f.failed).map((f) => {
    const found = spawnSync('find', [dir.trim(), '-path', `*/${f.name}/*`, '-name', '*.png'], { encoding: 'utf8' })
      .stdout.trim().split('\n').filter(Boolean).sort();
    return found.length ? { flow: f.name, file: found[found.length - 1] } : null;
  }).filter(Boolean);
  const installed = (out.match(/Сборка на телефоне от ([^,]+),/) || [])[1];
  return { flows, shots, installed, dir: dir.trim() };
}

// --- 3. Вердикт и отчёт ---

function gitLabel() {
  const r = spawnSync('git', ['log', '-1', '--format=%h %s'], { cwd: ROOT, encoding: 'utf8' });
  return r.stdout.trim();
}

function compose(unit, phones) {
  const unitOk = !unit.error && unit.failed === 0 && unit.extraFailedCount === 0;
  // Не на связи — «не проверен», вердикт по остальным; хотя бы один должен
  // быть проверен (иначе main() вообще ничего не шлёт).
  const checked = phones.filter((p) => !(p.error && STAND_FAILURE.test(p.error)));
  const phoneOk = (p) => !p.error && p.flows.length > 0 && p.flows.every((f) => !f.failed);
  const recommend = unitOk && (skipE2e || (checked.length > 0 && checked.every(phoneOk)));

  const lines = [
    recommend ? '✅ <b>ARVELL — сборку рекомендую</b>' : '⛔ <b>ARVELL — сборку не рекомендую</b>',
    `APK: ${h(path.basename(fs.existsSync(apk) ? fs.realpathSync(apk) : apk))}`,
    `Автотесты на коде: ${h(gitLabel())}`,
    '',
  ];

  if (unit.error) lines.push(`❌ Автотесты: ${h(unit.error)}`);
  else {
    lines.push(`${unitOk ? '✅' : '❌'} Автотесты: чек-лист ${unit.ok}/${unit.total}`
      + ` · падает ${unit.failed} · без теста ${unit.missing} · устарело ${unit.skipped}`
      + ` · прочие тесты ${unit.extraPassed} ✓ / ${unit.extraFailedCount} ✗`);
    for (const t of unit.failedItems) lines.push(`   ❌ ${h(t)}`);
    for (const t of unit.extraFailed) lines.push(`   ❌ ${h(t)}`);
  }

  if (skipE2e) lines.push('⏭️ Телефоны: E2E пропущены');
  for (const p of skipE2e ? [] : phones) {
    const name = h(p.device.name);
    if (p.error && STAND_FAILURE.test(p.error)) {
      lines.push(`⏭️ ${name}: не проверен — ${h(p.error)}`);
    } else if (p.error) {
      lines.push(`❌ ${name}: ${h(p.error)}`);
    } else {
      const passed = p.flows.filter((f) => !f.failed).length;
      lines.push(`${phoneOk(p) ? '✅' : '❌'} ${name}: сценариев ${passed}/${p.flows.length}`);
      // Зелёный телефон — одной строкой, упавший — с причинами.
      for (const f of p.flows.filter((x) => x.failed)) lines.push(`   ❌ ${h(f.name)} — ${h(f.message)}`);
    }
  }

  if (!unit.error && unit.missingItems.length) {
    lines.push('', '⚠️ Пункты без теста (поправить формулировку в таблице или дописать тест):');
    for (const t of unit.missingItems) lines.push(`   • ${h(t)}`);
  }
  if (!recommend) lines.push('', `Фронт: ${FRONT}`);
  return { recommend, html: lines.join('\n') };
}

(async () => {
  const unit = unitTests();
  // Телефоны — параллельно: у каждого свои аккаунты и свой товар (devices.conf).
  const phones = skipE2e ? [] : await Promise.all(loadDevices().map(e2eOn));
  // Ни один телефон не на связи — сбой стенда, а не вердикт по сборке: в
  // группу ничего не шлём, код 2 — watch-builds.sh попробует сборку снова.
  if (!skipE2e && phones.every((p) => p.error && STAND_FAILURE.test(p.error))) {
    console.error(`\nПриёмка не проведена: ${phones.map((p) => `${p.device.name}: ${p.error}`).join('; ')}`);
    process.exit(2);
  }
  const { recommend, html } = compose(unit, phones);
  const shots = phones.flatMap((p) => (p.shots || []).map((s) => ({ ...s, device: p.device.name })));

  console.log(`\n\n===== Отчёт =====\n${html.replace(/<\/?b>/g, '')}\n`);

  if (send) {
    const { sendMessage, sendDocument } = require('./telegram');
    await sendMessage(html);
    for (const s of shots.slice(0, 4)) await sendDocument(s.file, `Скриншот падения: ${s.device} — ${s.flow}`);
    if (recommend) {
      const real = fs.realpathSync(apk);
      if (fs.statSync(real).size <= TG_FILE_LIMIT) await sendDocument(real, 'Рекомендованная сборка — можно ставить');
      else console.log('APK больше 50 МБ — в Telegram не уйдёт, отправлен только отчёт.');
    }
    console.log('Отчёт отправлен в группу.');
  } else {
    console.log('Не отправлено (нет --send).');
  }
  process.exit(recommend ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
