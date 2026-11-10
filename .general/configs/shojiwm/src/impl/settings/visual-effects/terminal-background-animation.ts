import {
  compileEffect,
  dualKawaseBlur,
  backdropSource,
  loadShader,
  shaderStage,
  type WaylandWindow,
  COMPOSITOR,
} from "shoji_wm";
import type { CompiledEffectHandle } from "shoji_wm/types";
import { acquireClock } from "./../system/animation-clock";

export enum TerminalBackgroundAnimation {
  Nothing,
  LightBlur, MiddleBlur, HardBlur,
  Rain_1, Rain_2, Rain_3, Rain_4, Rain_5,
}

interface WindowInstance {
  animation: TerminalBackgroundAnimation;
  effect: CompiledEffectHandle;
  clock: ReturnType<typeof acquireClock>;
}

const windowInstances = new Map<string, WindowInstance>();

export function terminalBackgroundAnimation(
  window: WaylandWindow,
  animation: TerminalBackgroundAnimation,
): CompiledEffectHandle {
  let instance = windowInstances.get(window.id);
  if (instance && instance.animation !== animation) {
    instance.clock.release();
    windowInstances.delete(window.id);
    instance = undefined;
  }
  if (!instance) {
    const outputName = (() => {
      // Prefer the output the window is actually on (by its centre), since
      // `window.output` may still be stale on the first render of a new window.
      const rect = window.rect;
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      for (const name of COMPOSITOR.output.list) {
        const out = COMPOSITOR.output.get(name);
        if (!out?.resolution) continue;
        const w = out.resolution.width / out.scale;
        const h = out.resolution.height / out.scale;
        if (
          cx >= out.position.x &&
          cx < out.position.x + w &&
          cy >= out.position.y &&
          cy < out.position.y + h
        ) {
          return name;
        }
      }
      return window.output.peek() ?? "eDP-1";
    })();
    const clock = acquireClock(outputName);
    
    instance = { 
      animation, 
      effect: createEffect(animation, clock),
      clock
    };
    windowInstances.set(window.id, instance);
  }
  return instance.effect;
}

function createEffect(
  animation: TerminalBackgroundAnimation,
  clock: ReturnType<typeof acquireClock>
): CompiledEffectHandle {
  if (animation === TerminalBackgroundAnimation.Nothing) {
    return compileEffect({
      input: backdropSource(),
      capturePadding: 24,
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [],
    });
  }

  return compileEffect({
    input: backdropSource(),
    capturePadding: 24,
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: getPipeline(animation, clock),
  });
}

// ----------------------------------------------------------------------------

function getPipeline(
  animation: TerminalBackgroundAnimation,
  clock: ReturnType<typeof acquireClock>
) {
  const RAIN_WINDOW_SPEED = 5.0;
  const RAIN_WINDOW_ANGLE_DEG = 15;

  switch (animation) {
    case TerminalBackgroundAnimation.Nothing:
      return [];

    case TerminalBackgroundAnimation.LightBlur:
      return [dualKawaseBlur({ radius: 1, passes: 2 })];

    case TerminalBackgroundAnimation.MiddleBlur:
      return [dualKawaseBlur({ radius: 2, passes: 3 })];

    case TerminalBackgroundAnimation.HardBlur:
      return [dualKawaseBlur({ radius: 3, passes: 3 })];

    case TerminalBackgroundAnimation.Rain_1:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/window/rain/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.4,
          },
        }),
      ];

    case TerminalBackgroundAnimation.Rain_2:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/window/rain/2.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: 180 - RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.0,
          },
        }),
      ];

    case TerminalBackgroundAnimation.Rain_3:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/window/rain/3.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.4,
          },
        }),
      ];

    case TerminalBackgroundAnimation.Rain_4:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/window/rain/4.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: 15,
            rain_amount: 0.4,
          },
        }),
      ];

    case TerminalBackgroundAnimation.Rain_5:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/window/rain/5.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.4,
          },
        }),
      ];

    default:
      console.warn(`No shader for animation ${animation}`);
      return [];
  }
}

export function disposeTerminalBackgroundAnimation() {
  for (const instance of windowInstances.values()) {
    instance.clock.release();
  }
  windowInstances.clear();
}

export function disposeWindowAnimation(windowId: string) {
  const instance = windowInstances.get(windowId);
  if (instance) {
    instance.clock.release();
    windowInstances.delete(windowId);
  }
}

COMPOSITOR.onDisable((event) => {
  if (event.isReloading) {
    disposeTerminalBackgroundAnimation();
  }
});
