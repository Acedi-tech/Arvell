// Разрешения Android-манифеста, без которых ломается выбор фото на старых
// Android. Сборка EAS берёт манифест из android/ — проверяем его напрямую.
const fs = require('fs');
const path = require('path');

const manifest = fs.readFileSync(
  path.resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml'), 'utf8',
);
const appJson = require('../../app.json');

const permissionTag = (name) => manifest.match(new RegExp(`<uses-permission[^>]*android:name="android\\.permission\\.${name}"[^>]*/>`))?.[0];

describe('AndroidManifest: доступ к фото на Android до 12', () => {
  it.each(['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'])('%s объявлено до SDK 32 и не вырезано', (name) => {
    // expo-image-picker на SDK < 33 просит и чтение, и запись: без записи выбор
    // фото и камера молча не открывались на Android 8 (QA 21.10).
    const tag = permissionTag(name);
    expect(tag).toBeDefined();
    expect(tag).not.toMatch(/tools:node="remove"/);
    expect(tag).toMatch(/android:maxSdkVersion="32"/);
  });

  it('app.json не блокирует запись в память (иначе prebuild снова её вырежет)', () => {
    expect(appJson.expo.android.blockedPermissions || [])
      .not.toContain('android.permission.WRITE_EXTERNAL_STORAGE');
  });
});
