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
  loadShader,
  shaderStage,
  ManagedWindow,
  computed,
  read,
  ShaderEffect,
  type SSDStyle,
  type WaylandWindow,
  type WindowDecorationState,
  DefaultComposition,
} from "shoji_wm";
import type {
  CompositionRenderable,
  LayerEffectHandle
} from "shoji_wm/types";

import {
  terminalBackgroundAnimation,
  TerminalBackgroundAnimation,
} from "./terminal-background-animation";
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
  WINDOW_STATE_TILE_REORDERING,
  WINDOW_STATE_WORKSPACE_TILED,
} from "../system/window-manager";
import {
  CloseButton,
  MaximizeButton,
  MinimizeButton,
} from "./window-buttons";
import { type OutlookConfig } from "../visual-effects-config";
import {
 type WindowSwitcher,
 type TitlebarButton,
} from "./window-switcher"

const FULLSCREEN_Z_INDEX = 2_000_000_000;
const FLOATING_WINDOW_Z_INDEX_BASE = 1_500_000_000;
const WINDOW_STACK_Z_INDEX_RANGE = 100_000_000;
const FOCUSED_TILED_WINDOW_Z_INDEX = 1_000_000_000;
const REORDERING_TILED_WINDOW_Z_INDEX = -2_000_000_000;

/** Where a (non-fullscreen) window sits in the stack; higher is on top. */
export function windowZIndex(
  window: WaylandWindow,
  wm: HybridWindowManager,
): number {
  const stackZIndex = wm.getWindowZIndex(window)();
  if (!window.state[WINDOW_STATE_WORKSPACE_TILED]()) {
    return stackZIndex;
  }
  const stackOffset = Math.max(
    -WINDOW_STACK_Z_INDEX_RANGE,
    Math.min(WINDOW_STACK_Z_INDEX_RANGE, stackZIndex),
  );
  if (!window.state[WINDOW_STATE_TILED]()) {
    return FLOATING_WINDOW_Z_INDEX_BASE + stackOffset;
  }
  if (window.state[WINDOW_STATE_TILE_REORDERING]()) {
    return REORDERING_TILED_WINDOW_Z_INDEX;
  }
  return window.isFocused() ? FOCUSED_TILED_WINDOW_Z_INDEX : stackOffset;
}

/**
 * The title bar's button size, padding and gap. `titlebarButtonAt` finds the
 * buttons with the same numbers, so change them here.
 */
const TITLEBAR_BUTTON_SIZE = 16;
const TITLEBAR_PADDING_X = 8;
const TITLEBAR_GAP = 8;

/**
 * The title bar button at `(x, y)`, logical px from the top-left corner of
 * `window.rect` (the frame: border, then the title bar). From the right:
 * close, maximize, minimize. Each button takes the whole title bar height
 * and half the gap on both sides, so a scaled-down card still has a usable
 * target.
 */
export function titlebarButtonAt(
  window: WaylandWindow,
  x: number,
  y: number,
): TitlebarButton | null {
  if (
    window.state[WINDOW_STATE_FULLSCREEN].peek() ||
    usesClientDecoration(window.decoration.peek())
  ) {
    return null;
  }
  if (y < WINDOW_BORDER_PX || y > WINDOW_BORDER_PX + TITLEBAR_HEIGHT) {
    return null;
  }
  const buttons: TitlebarButton[] = ["close", "maximize", "minimize"];
  const pitch = TITLEBAR_BUTTON_SIZE + TITLEBAR_GAP;
  const right = window.rect.width - WINDOW_BORDER_PX - TITLEBAR_PADDING_X;
  for (let i = 0; i < buttons.length; i++) {
    const center = right - TITLEBAR_BUTTON_SIZE / 2 - i * pitch;
    if (Math.abs(x - center) <= pitch / 2) {
      return buttons[i];
    }
  }
  return null;
}

function usesClientDecoration(decoration: WindowDecorationState): boolean {
  return (
    decoration.mode === "client" &&
    !(
      decoration.clientPreference === "server" &&
      decoration.configuredMode === "server"
    )
  );
}

export interface WindowCompositionContext {
  wm: HybridWindowManager;
  config: OutlookConfig;
  windowSwitcher: WindowSwitcher;
}

export function initWindowComposition(
  wm: HybridWindowManager,
  config: OutlookConfig,
  windowSwitcher: WindowSwitcher,
): void {
  const backdropFade = () => shaderStage(loadShader("./src/impl/shaders/common/backdrop-fade.frag"), {
    uniforms: { strength: windowSwitcher.backdropStrength },
  });
  COMPOSITOR.rendering.composition = (output) =>
    windowSwitcher.compose(output) ?? <DefaultComposition />;

  COMPOSITOR.window.composition = (window: WaylandWindow) => {
    const useClientDecoration = usesClientDecoration(window.decoration());
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
    
    // force no corner rounding CSD
    const tiled = true;
    
    const zIndex = computed(() => windowZIndex(window, wm));
    const minimizeVisualIdle = window.state[WINDOW_STATE_MINIMIZE_VISUAL_IDLE];
    const inactive = computed(
      () => minimizeVisualIdle() || (!workspaceVisible() && !tileDragging()),
    );
    
    const borderColor = window.isFocused((focused) =>
      focused ? "#d7ba7d" : "#4f5666",
    );
    // A soft drop shadow under the frame; the focused window floats a bit higher.
    // The window selected in the window switcher glows white instead.
    const windowShadow = computed(() =>
      windowSwitcher.selectedWindowId() === window.id
        ? [{ blur: 28, spread: 4, color: "#ffffffd0" }]
        : window.isFocused()
          ? [{ y: 10, blur: 32, spread: -2, color: "#00000090" }]
          : [{ y: 4, blur: 16, spread: -2, color: "#00000060" }],
    );
    const titlebarBackground = window.isFocused((focused) =>
      focused ? "#1f243080" : "#2a2f3a80",
    );
    const titleColor = window.isFocused((focused) =>
      focused ? "#f5f7fa" : "#c9d1d9",
    );
    
    const titlebarStyle: SSDStyle = {
      height: TITLEBAR_HEIGHT,
      paddingX: TITLEBAR_PADDING_X,
      gap: TITLEBAR_GAP,
      alignItems: "center",
      background: titlebarBackground,
    };
    
  
    const titleOnlyShader = compileEffect({
      input: backdropSource(),
      capturePadding: 24,
      invalidate: { kind: "on-source-damage-box", damagePadding: 8 },
      alpha: "preserve",
      pipeline: [dualKawaseBlur({ radius: 4, passes: 2 }), backdropFade()],
    });
    
    const blurSuspended = windowSwitcher.blurSuspended();
    
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
    
    const titlebarContent = [
      appIcon,
      label,
      minimizeButton,
      maximizeButton,
      closeButton,
    ];
    var innerComponents = (
      <Box direction="column">
        {blurSuspended ? (
          <Box direction="row" style={titlebarStyle}>
            {titlebarContent}
          </Box>
        ) : (
          <ShaderEffect
            shader={titleOnlyShader}
            direction="row"
            style={titlebarStyle}
          >
            {titlebarContent}
          </ShaderEffect>
        )}
        <ClientWindow />
      </Box>
    );
    
    const TERMINALS = ["kitty", "ghostty"];
    
    if (
      TERMINALS.includes(window.appId() ?? "") &&
      config.terminalBackground !== TerminalBackgroundAnimation.Nothing
    ) {
      // `terminalBackgroundAnimation` reads `backdropSource()` under the hood,
      // which is empty inside the switcher's render texture - the terminal
      // would render black there. Skip the effect while the switcher is open
      // and let it come back when the switcher closes, the same way
      // `titleOnlyShader` is suspended.
      innerComponents = blurSuspended ? (
        <Box direction="column">
          <Box direction="row" style={titlebarStyle}>
            {titlebarContent}
          </Box>
          <ClientWindow />
        </Box>
      ) : (
        <ShaderEffect
          shader={terminalBackgroundAnimation(
            window,
            config.terminalBackground,
          )}
          direction="column"
        >
          <Box direction="row" style={titlebarStyle}>
            {titlebarContent}
          </Box>
          <ClientWindow />
        </ShaderEffect>
      );
    }

    // Fullscreen: drop all chrome and let the client surface fill its managed rect.
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
    
    // use less Server-Side Decoration
    if (useClientDecoration) {
      return (
        <ManagedWindow
          rect={managedRect}
          zIndex={zIndex}
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
              boxShadow: windowShadow,
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
            <ClientWindow />
          </WindowBorder>
        </ManagedWindow>
      );
    }
    
    // use full Server-Side Decoration
    return (
      <ManagedWindow
        rect={managedRect}
        zIndex={zIndex}
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
            boxShadow: windowShadow,
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
  // const titleOnlyShader = compileEffect({
  //   input: backdropSource(),
  //   capturePadding: 24,
  //   invalidate: { kind: "on-source-damage-box", damagePadding: 8 },
  //   pipeline: [dualKawaseBlur({ radius: 4, passes: 2 })],
  // });

  // COMPOSITOR.window.composition = (window: WaylandWindow) => {
  //   const decoration = window.decoration();
  //   const useClientDecoration =
  //     decoration.mode === "client" &&
  //     !(
  //       decoration.clientPreference === "server" &&
  //       decoration.configuredMode === "server"
  //     );
  //   const workspaceVisible = window.state[WINDOW_STATE_WORKSPACE_VISIBLE];
  //   const workspaceOffsetY = window.state[WINDOW_STATE_WORKSPACE_OFFSET_Y];
  //   const workspaceOpacity = window.state[WINDOW_STATE_WORKSPACE_OPACITY];
  //   const tileDragging = window.state[WINDOW_STATE_TILE_DRAGGING];

  //   const managedRect = computed(() => {
  //     const rect = window.state[WINDOW_STATE_RECT]();
  //     return {
  //       x: read(rect.x),
  //       y: read(rect.y) + workspaceOffsetY(),
  //       width: read(rect.width),
  //       height: read(rect.height),
  //     };
  //   });
  //   const forceRectSize = computed(
  //     () => window.isResizable() && !window.isTransient(),
  //   );
  //   const tiled = computed(
  //     () => window.appId() === "mpv" || window.state[WINDOW_STATE_TILED](),
  //   );
  //   const minimizeVisualIdle = window.state[WINDOW_STATE_MINIMIZE_VISUAL_IDLE];
  //   const inactive = computed(
  //     () => minimizeVisualIdle() || (!workspaceVisible() && !tileDragging()),
  //   );

  //   const borderColor = window.isFocused((focused) =>
  //     focused ? "#d7ba7d" : "#4f5666",
  //   );
  //   const titlebarBackground = window.isFocused((focused) =>
  //     focused ? "#1f243080" : "#2a2f3a80",
  //   );
  //   const titleColor = window.isFocused((focused) =>
  //     focused ? "#f5f7fa" : "#c9d1d9",
  //   );

  //   const titlebarStyle: SSDStyle = {
  //     height: TITLEBAR_HEIGHT,
  //     paddingX: 8,
  //     gap: 8,
  //     alignItems: "center",
  //     background: titlebarBackground,
  //   };

  //   const appIcon = (
  //     <AppIcon icon={window.icon} style={{ width: 16, height: 16 }} />
  //   );
  //   const label = (
  //     <Label
  //       text={window.title}
  //       style={{
  //         color: titleColor,
  //         fontFamily: ["Noto Sans CJK JP", "Noto Color Emoji"],
  //         fontSize: 13,
  //         fontWeight: 600,
  //         flexGrow: 1,
  //         flexShrink: 1,
  //         minWidth: 0,
  //       }}
  //     />
  //   );
  //   const minimizeButton = <MinimizeButton window={window} />;
  //   const maximizeButton = <MaximizeButton window={window} />;
  //   const closeButton = <CloseButton window={window} />;

  //   var innerComponents: CompositionRenderable = (
  //     <Box direction="column">
  //       <ShaderEffect
  //         shader={titleOnlyShader}
  //         direction="row"
  //         style={titlebarStyle}
  //       >
  //         {appIcon}
  //         {label}
  //         {minimizeButton}
  //         {maximizeButton}
  //         {closeButton}
  //       </ShaderEffect>
  //       <ClientWindow />
  //     </Box>
  //   );

  //   if (
  //     TERMINALS.includes(window.appId() ?? "") &&
  //     config.terminalBackground !== TerminalBackgroundAnimation.Nothing
  //   ) {
  //     innerComponents = (
  //       <ShaderEffect
  //         shader={terminalBackgroundAnimation(
  //           window,
  //           config.terminalBackground,
  //         )}
  //         direction="column"
  //       >
  //         <Box direction="row" style={titlebarStyle}>
  //           {appIcon}
  //           {label}
  //           {minimizeButton}
  //           {maximizeButton}
  //           {closeButton}
  //         </Box>
  //         <ClientWindow />
  //       </ShaderEffect>
  //     );
  //   }

  //   if (window.state[WINDOW_STATE_FULLSCREEN]()) {
  //     return (
  //       <ManagedWindow
  //         rect={managedRect}
  //         zIndex={FULLSCREEN_Z_INDEX}
  //         visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
  //         opacity={workspaceOpacity}
  //         forceRectSize={forceRectSize}
  //         tiled={tiled}
  //         idle={inactive}
  //         interactive={inactive((value) => !value)}
  //         allowTearing={true}
  //       >
  //         <ClientWindow />
  //       </ManagedWindow>
  //     );
  //   }

  //   if (useClientDecoration) {
  //     return (
  //       <ManagedWindow
  //         rect={managedRect}
  //         zIndex={wm.getWindowZIndex(window)}
  //         visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
  //         opacity={workspaceOpacity}
  //         forceRectSize={forceRectSize}
  //         tiled={tiled}
  //         idle={inactive}
  //         interactive={inactive((value) => !value)}
  //       >
  //         <ClientWindow />
  //       </ManagedWindow>
  //     );
  //   }

  //   return (
  //     <ManagedWindow
  //       rect={managedRect}
  //       zIndex={wm.getWindowZIndex(window)}
  //       visibleOutputs={window.state[WINDOW_STATE_VISIBLE_OUTPUTS]}
  //       opacity={workspaceOpacity}
  //       forceRectSize={forceRectSize}
  //       tiled={tiled}
  //       idle={inactive}
  //       interactive={inactive((value) => !value)}
  //     >
  //       <WindowBorder
  //         style={{
  //           border: { px: WINDOW_BORDER_PX, color: borderColor },
  //           borderRadius: 10,
  //           background: "#10131900",
  //           padding: 0,
  //           paddingX: 0,
  //           paddingRight: 0,
  //         }}
  //         interaction={{
  //           resizeHitArea: {
  //             edgePx: 8,
  //             cornerPx: 14,
  //           },
  //         }}
  //       >
  //         <Box direction="row">{innerComponents}</Box>
  //       </WindowBorder>
  //     </ManagedWindow>
  //   );
  // };
}
