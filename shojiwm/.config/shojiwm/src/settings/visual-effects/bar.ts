import { COMPOSITOR } from "shoji_wm";
import { type OutlookConfig } from "../visual-effects-config.ts";

export enum Bar {
  Nothing,
  ShojiBar2, ShojiBar3,
  Waybar,
}

export function initBar(config: OutlookConfig) {
  switch (config.bar) {
  case Bar.ShojiBar2:
    // COMPOSITOR.process.once("shell", {
    //   command: "cd ~/.config/shoji-bar-2 && GTK_A11Y=none ags run app.tsx",
    //   runPolicy: "once-per-session",
    // });
    COMPOSITOR.process.once("shell", {
      command: "shoji-bar-2",
      // runPolicy: "once-per-session",
    });

    break;
  case Bar.ShojiBar3:
    COMPOSITOR.process.once("shell", {
      command: "cd ~/.config/shoji-bar-3 && bash build.sh; exec quickshell --path .",
      runPolicy: "once-per-session",
    });
    break;
  case Bar.Waybar:
    COMPOSITOR.process.once("shell", {
      command: "waybar",
      runPolicy: "once-per-session",
    });
    break;
  case Bar.Nothing:
    break;
  default:
    console.error(`Unknown bar type.`)
    break;
  }
}
