/* global beforeEach */
// Перед каждым тестом — пустое защищённое хранилище, как на новом устройстве.
beforeEach(() => {
  require('expo-secure-store').__store.clear();
});
