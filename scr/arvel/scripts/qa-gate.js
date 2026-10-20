#!/usr/bin/env node
// Приёмка сборки ARVELL: автотесты + E2E на телефоне → вердикт → отчёт в группу.
//
// 1. Jest + сверка с чек-листом (scripts/checklist-report.js).
// 2. APK ставится на телефон по USB, гоняются сценарии Maestro
//    (.maestro/tools/run.sh).
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
const { spawnSync } = require('child_process');

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

// --- 2. E2E на телефоне ---

function e2e() {
  if (!fs.existsSync(apk)) return { error: `нет APK ${apk}` };
  const { out } = run(path.join(ROOT, '.maestro', 'tools', 'run.sh'), [apk]);
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

function compose(unit, phone) {
  const unitOk = !unit.error && unit.failed === 0 && unit.extraFailedCount === 0;
  const phoneFailed = phone.flows ? phone.flows.filter((f) => f.failed) : [];
  const phoneOk = skipE2e || (!phone.error && phone.flows.length > 0 && phoneFailed.length === 0);
  const recommend = unitOk && phoneOk;

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

  if (skipE2e) lines.push('⏭️ Телефон: E2E пропущены');
  else if (phone.error) lines.push(`❌ Телефон: ${h(phone.error)}`);
  else {
    const passed = phone.flows.length - phoneFailed.length;
    lines.push(`${phoneOk ? '✅' : '❌'} Телефон (Redmi Note 11 Pro+): сценариев ${passed}/${phone.flows.length}`);
    for (const f of phone.flows) {
      lines.push(`   ${f.failed ? '❌' : '✓'} ${h(f.name)}${f.failed ? ` — ${h(f.message)}` : ''}`);
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
  const phone = skipE2e ? {} : e2e();
  // Телефон не на связи — это сбой стенда, а не вердикт по сборке: в группу
  // ничего не шлём, код 2 — watch-builds.sh попробует эту сборку снова.
  if (phone.error && /отключился|не готов|нет APK|заблокирован|не записал отчёт/.test(phone.error)) {
    console.error(`\nПриёмка не проведена: ${phone.error}`);
    process.exit(2);
  }
  const { recommend, html } = compose(unit, phone);

  console.log(`\n\n===== Отчёт =====\n${html.replace(/<\/?b>/g, '')}\n`);

  if (send) {
    const { sendMessage, sendDocument } = require('./telegram');
    await sendMessage(html);
    for (const s of (phone.shots || []).slice(0, 3)) await sendDocument(s.file, `Скриншот падения: ${s.flow}`);
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
