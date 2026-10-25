// Window composition: рисует окно с титлбаром, кнопками и рамкой.
//
// COMPOSITOR.window.composition вызывается для каждого окна. Возвращает
// JSX-дерево: титлбар (appIcon + label + кнопки) + ClientWindow (клиентская
// поверхность). Для терминалов (kitty/ghostty) добавляется shader-фон
// через terminalBackgroundAnimation.
//
// ВАЖНО: файл должен быть .tsx (JSX-синтаксис), иначе Deno-парсер
// ShojiWM не сможет его скомпилировать.

import {
  AppIcon,
  Box,
  ClientWindow,
  Label,
  COMPOSITOR,
  WindowBorder,
  backdropSource,
  compileEffect,
  dualKawaseBlur,
  ManagedWindow,
  computed,
  read,
  shaderStage,
  loadShader,
  ShaderEffect,
  type SSDStyle,
  type WaylandWindow,
} from "shoji_wm";
import type { CompositionRenderable } from "shoji_wm/types";

import {
  terminalBackgroundAnimation,
  TerminalBackgroundAnimation,
} from "./terminal-background-animation.ts";
import type { HybridWindowManager } from "../system/window-manager";
import {
  WINDOW_BORDER_PX,
  TITLEBAR_HEIGHT,
  WINDOW_STATE_FULLSCREEN,
  WINDOW_STATE_MINIMIZE_VISUAL_IDLE,
  WINDOW_STATE_TILE_DRAGGING,
  WINDOW_STATE_TILED,
  WINDOW_STATE_VISIBLE_OUTPUTS,
  WINDOW_STATE_RECT,
  WINDOW_STATE_WORKSPACE_VISIBLE,
  WINDOW_STATE_WORKSPACE_OFFSET_Y,
  WINDOW_STATE_WORKSPACE_OPACITY,
} from "../system/window-manager.ts";
import {
  CloseButton,
  MaximizeButton,
  MinimizeButton,
} from "./window-buttons.tsx";
import { type OutlookConfig } from "../visual-effects-config.ts";

const FULLSCREEN_Z_INDEX = 2_000_000_000;

// Терминалы, для которых включается дождевой фон.
const TERMINALS = ["kitty", "ghostty"];

export function initWindowComposition(wm: HybridWindowManager, config: OutlookConfig): void {
  // Простой blur для титлбара (без дождя).
  const titleOnlyShader = compileEffect({
    input: backdropSource(),
    capturePadding: 24,
    invalidate: { kind: "on-source-damage-box", damagePadding: 8 },
    pipeline: [dualKawaseBlur({ radius: 4, passes: 2 })],
  });

  COMPOSITOR.window.composition = (window: WaylandWindow) => {
    const decoration = window.decoration();
    const useClientDecoration =
      decoration.mode === "client" &&
      !(
        decoration.clientPreference === "server" &&
        decoration.configuredMode === "server"
      );
    const workspaceVisible = window.state[WINDOW_STATE_WORKSPACE_VISIBLE];
    const workspaceOffsetY = window.state[WINDOW_STATE_WORKSPACE_OFFSET_Y];
    const workspaceOpacity = window.state[WINDOW_STATE_WORKSPACE_OPACITY];
    const tileDragging = window.state[WINDOW_STATE_TILE_DRAGGING];

    const managedRect = computed(() => {
      const rect = window.state[WINDOW_STATE_RECT]();
      return {
        x: read(rect.x),
        y: read(rect.y) + workspaceOffsetY(),
        width: read(rect.width),
        height: read(rect.height),
      };
    });
    const forceRectSize = computed(
      () => window.isResizable() && !window.isTransient(),
    );
    const tiled = computed(
      () => window.appId() === "mpv" || window.state[WINDOW_STATE_TILED](),
    );
    const minimizeVisualIdle = window.state[WINDOW_STATE_MINIMIZE_VISUAL_IDLE];
    const inactive = computed(
      () => minimizeVisualIdle() || (!workspaceVisible() && !tileDragging()),
    );

    const borderColor = window.isFocused((focused) =>
      focused ? "#d7ba7d" : "#4f5666",
    );
    const titlebarBackground = window.isFocused((focused) =>
      focused ? "#1f243080" : "#2a2f3a80",
    );
    const titleColor = window.isFocused((focused) =>
      focused ? "#f5f7fa" : "#c9d1d9",
    );

    const titlebarStyle: SSDStyle = {
      height: TITLEBAR_HEIGHT,
      paddingX: 8,
      gap: 8,
      alignItems: "center",
      background: titlebarBackground,
    };

    const appIcon = (
      <AppIcon icon={window.icon} style={{ width: 16, height: 16 }} />
    );
    const label = (
      <Label
        text={window.title}
        style={{
          color: titleColor,
          fontFamily: ["Noto Sans CJK JP", "Noto Color Emoji"],
          fontSize: 13,
          fontWeight: 600,
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
        }}
      />
    );
    const minimizeButton = <MinimizeButton window={window} />;
    const maximizeButton = <MaximizeButton window={window} />;
    const closeButton = <CloseButton window={window} />;

    var innerComponents: CompositionRenderable = (
      <Box direction="column">
        <ShaderEffect
          shader={titleOnlyShader}
          direction="row"
          style={titlebarStyle}
        >
          {appIcon}
          {label}
          {minimizeButton}
          {maximizeButton}
          {closeButton}
        </ShaderEffect>
        <ClientWindow />
      </Box>
    );

    if (
      TERMINALS.includes(window.appId() ?? "") &&
      config.terminalBackground !== TerminalBackgroundAnimation.Nothing
    ) {
      innerComponents = (
        <ShaderEffect
          shader={terminalBackgroundAnimation(
            window,
            config.terminalBackground,
          )}
          direction="column"
        >
          <Box direction="row" style={titlebarStyle}>
            {appIcon}
            {label}
            {minimizeButton}
            {maximizeButton}
            {closeButton}
          </Box>
          <ClientWindow />
        </ShaderEffect>
      );
    }

    if (window.state[WINDOW_STATE_FULLSCREEN]()) {
      return (
        <ManagedWindow
          rect={managedRect}
          zIndex={FULLSCREEN_Z_INDEX}
          visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
          opacity={workspaceOpacity}
          forceRectSize={forceRectSize}
          tiled={tiled}
          idle={inactive}
          interactive={inactive((value) => !value)}
          allowTearing={true}
        >
          <ClientWindow />
        </ManagedWindow>
      );
    }

    if (useClientDecoration) {
      return (
        <ManagedWindow
          rect={managedRect}
          zIndex={wm.getWindowZIndex(window)}
          visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
          opacity={workspaceOpacity}
          forceRectSize={forceRectSize}
          tiled={tiled}
          idle={inactive}
          interactive={inactive((value) => !value)}
        >
          <ClientWindow />
        </ManagedWindow>
      );
    }

    return (
      <ManagedWindow
        rect={managedRect}
        zIndex={wm.getWindowZIndex(window)}
        visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
        opacity={workspaceOpacity}
        forceRectSize={forceRectSize}
        tiled={tiled}
        idle={inactive}
        interactive={inactive((value) => !value)}
      >
        <WindowBorder
          style={{
            border: { px: WINDOW_BORDER_PX, color: borderColor },
            borderRadius: 10,
            background: "#10131900",
            padding: 0,
            paddingX: 0,
            paddingRight: 0,
          }}
          interaction={{
            resizeHitArea: {
              edgePx: 8,
              cornerPx: 14,
            },
          }}
        >
          <Box direction="row">{innerComponents}</Box>
        </WindowBorder>
      </ManagedWindow>
    );
  };
}
