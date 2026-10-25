// Window decoration policy.
//
// Определяет, будет ли окно использовать server-side decorations (SSD,
// которые рисует композитор — титлбар с нашими кнопками) или
// client-side (CSD, которые рисует само приложение).
//
// Логика:
//   - appId ещё неизвестен — возвращаем clientPreference от клиента
//     (не навязываем SSD до того, как узнали, что это за приложение;
//     иначе Firefox/Chromium начнут строить reduced chrome и не
//     откатятся назад).
//   - Firefox (и его варианты) — всегда CSD. Firefox любит
//     пересогласовывать декорации, если ему отказывают в CSD.
//   - все остальные — SSD.

import { COMPOSITOR } from "shoji_wm";

export function initDecoration(): void {
  COMPOSITOR.window.decoration.configure((window, context) => {
    const appId = (window.appId() ?? "").toLowerCase();
    const isFirefox =
      appId === "firefox" ||
      appId.endsWith(".firefox") ||
      appId.includes("firefoxdeveloperedition");

    // KDE-менеджер объявляет CSD до того, как доступны per-window metadata.
    // Сохраняем этот baseline, пока appId неизвестен: ранний SSD-ответ
    // заставит некоторые версии Firefox/Chromium постоянно строить
    // reduced chrome.
    if (appId.length === 0) {
      return { mode: context.clientPreference ?? "client" };
    }

    // Firefox может многократно пересогласовывать декорации, если ему
    // отказывают в CSD. Оставляем CSD даже когда он полагается на
    // дефолт менеджера и не отправляет явного preference.
    if (isFirefox) {
      return { mode: "client" };
    }

    return { mode: "server" };
  });
}
