import {
  compileEffect,
  dualKawaseBlur,
  backdropSource,
  loadShader,
  shaderStage,
  type WaylandWindow,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";
import { acquireClock } from "./../system/animation-clock";

const clock = acquireClock();

export enum TerminalBackgroundAnimation {
  Nothing,
  LightBlur, MiddleBlur, HardBlur,
  Rain_1, Rain_2, Rain_3, Rain_4, Rain_5,
}

interface WindowInstance {
  animation: TerminalBackgroundAnimation;
  effect: LayerEffectHandle;
}

const windowInstances = new Map<string, WindowInstance>();

export function terminalBackgroundAnimation(
  window: WaylandWindow,
  animation: TerminalBackgroundAnimation,
): LayerEffectHandle {
  let instance = windowInstances.get(window.id);
  if (instance && instance.animation !== animation) {
    instance.effect.dispose?.();
    windowInstances.delete(window.id);
    instance = undefined;
  }
  if (!instance) {
    instance = { animation, effect: createEffect(animation) };
    windowInstances.set(window.id, instance);
  }
  return instance.effect;
}

function createEffect(animation: TerminalBackgroundAnimation): LayerEffectHandle {
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
    pipeline: getPipeline(animation),
  });
}

// ----------------------------------------------------------------------------

function getPipeline(animation: TerminalBackgroundAnimation) {
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
  clock.release();
  for (const instance of windowInstances.values()) {
    instance.effect.dispose?.();
  }
  windowInstances.clear();
}

export function disposeWindowAnimation(windowId: string) {
  const instance = windowInstances.get(windowId);
  if (instance) {
    instance.effect.dispose?.();
    windowInstances.delete(windowId);
  }
}
