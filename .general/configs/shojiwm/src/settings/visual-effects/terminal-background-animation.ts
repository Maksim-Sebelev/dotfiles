/*
how to add new effect:

1) create shader in $SHOJIWM_CFG_PATH/src/shaders/<your theme dir>/<your shader>.frag
2) select a simple description for your effect and put this name in terminalBackgroundAnimation enum
3) in function getSelectedAnimation in switch-case add case for previous enum
   and load <your shader>.frag (see in other cases how to do it) 
4) now, in index.tsx you can just change value of second argument of terminalBackgroundAnimation to your enum 
5) enjoy!
*/

// import {
//   compileEffect,
//   dualKawaseBlur,
//   backdropSource,
//   loadShader,
//   shaderStage,
//   type ShaderStage,
//   type WaylandWindow,
// } from "shoji_wm";
// import type { LayerEffectHandle } from "shoji_wm/types";
// import { acquireClock } from "./../system/animation-clock";

// const clock = acquireClock();

// export enum TerminalBackgroundAnimation {
//   Nothing,
//   BlurOnly,
//   Rain_1, Rain_2, Rain_3, Rain_4, Rain_5,
// }

// interface WindowInstance {
//   animation: TerminalBackgroundAnimation;
//   effect: LayerEffectHandle;
// }

// const windowInstances = new Map<string, WindowInstance>();

// export function terminalBackgroundAnimation(
//   window: WaylandWindow,
//   animation: TerminalBackgroundAnimation,
// ): LayerEffectHandle {
//   let instance = windowInstances.get(window.id);
//   if (instance && instance.animation !== animation) {
//     instance.effect.dispose?.();
//     windowInstances.delete(window.id);
//     instance = undefined;
//   }
//   if (!instance) {
//     instance = { animation, effect: createEffect(animation) };
//     windowInstances.set(window.id, instance);
//   }
//   return instance.effect;
// }

// function createEffect(animation: TerminalBackgroundAnimation): LayerEffectHandle {
//   if (animation === TerminalBackgroundAnimation.BlurOnly) {
//     return compileEffect({
//       input: backdropSource(),
//       capturePadding: 24,
//       invalidate: { kind: "always" },
//       alpha: "opaque",
//       pipeline: [
//         dualKawaseBlur({ radius: 1, passes: 2 }),
//       ],
//     });
//   }

//   return compileEffect({
//     input: backdropSource(),
//     capturePadding: 24,
//     invalidate: { kind: "always" },
//     alpha: "opaque",
//     pipeline: [
//       dualKawaseBlur({ radius: 1, passes: 2 }),
//       getSelectedAnimation(animation),
//     ],
//   });
// }


// const RAIN_WINDOW_SPEED = 5.0;
// const RAIN_WINDOW_ANGLE_DEG = 15;

// function getSelectedAnimation(animation: TerminalBackgroundAnimation): ShaderStage | null {
//   switch (animation) {
//     case TerminalBackgroundAnimation.Rain_1:
//       return shaderStage(loadShader("./src/shaders/window/rain/1.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_WINDOW_SPEED,
//           angle_deg: RAIN_WINDOW_ANGLE_DEG,
//           rain_amount: 0.4,
//         },
//       });
//     case TerminalBackgroundAnimation.Rain_2:
//       return shaderStage(loadShader("./src/shaders/window/rain/2.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_WINDOW_SPEED,
//           angle_deg: 180 - RAIN_WINDOW_ANGLE_DEG,
//           rain_amount: 0.0,
//         },
//       });
//     case TerminalBackgroundAnimation.Rain_3:
//       return shaderStage(loadShader("./src/shaders/window/rain/3.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_WINDOW_SPEED,
//           angle_deg: RAIN_WINDOW_ANGLE_DEG,
//           rain_amount: 0.4,
//         },
//       });
//     case TerminalBackgroundAnimation.Rain_4:
//       return shaderStage(loadShader("./src/shaders/window/rain/4.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_WINDOW_SPEED,
//           angle_deg: RAIN_WINDOW_ANGLE_DEG,
//           rain_amount: 0.4,
//         },
//       });
//     case TerminalBackgroundAnimation.Nothing:
//       console.warn(`TerminalBackgroundAnimation.Nothing should be parsed earlier`);
//       break;
//     default:
//       console.warn(`No shader for animation ${animation}`);
//       break;
//   }
//   return null;
// }

// export function disposeTerminalBackgroundAnimation() {
//   clock.release();
//   for (const instance of windowInstances.values()) {
//     instance.effect.dispose?.();
//   }
//   windowInstances.clear();
// }

// export function disposeWindowAnimation(windowId: string) {
//   const instance = windowInstances.get(windowId);
//   if (instance) {
//     instance.effect.dispose?.();
//     windowInstances.delete(windowId);
//   }
// }

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
  BlurOnly,
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

    case TerminalBackgroundAnimation.BlurOnly:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
      ];

    case TerminalBackgroundAnimation.Rain_1:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/shaders/window/rain/1.frag"), {
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
        shaderStage(loadShader("./src/shaders/window/rain/2.frag"), {
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
        shaderStage(loadShader("./src/shaders/window/rain/3.frag"), {
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
        shaderStage(loadShader("./src/shaders/window/rain/4.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.4,
          },
        }),
      ];

    case TerminalBackgroundAnimation.Rain_5:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/shaders/window/rain/5.frag"), {
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
