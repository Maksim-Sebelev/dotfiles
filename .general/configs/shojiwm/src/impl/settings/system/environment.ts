import { COMPOSITOR } from "shoji_wm";

export function initEnvironment(): void {
  COMPOSITOR.env.apply({
    QT_QPA_PLATFORM: "wayland;xcb",
    QT_QPA_PLATFORMTHEME: "qt6ct",
    QT_IM_MODULE: "fcitx",
    XMODIFIERS: "@im=fcitx",
    SDL_IM_MODULE: "fcitx",
    GLFW_IM_MODULE: "ibus",
    ELECTRON_OZONE_PLATFORM_HINT: "wayland",
  });
  COMPOSITOR.env.publish();

  COMPOSITOR.cursor.configure({
    theme: "Bibata-Modern-Ice",
    size: 24,
  });
}
