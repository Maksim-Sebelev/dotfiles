// Jupiter + Io + feedback clouds simulation for ShojiWM wallpaper.
//
// Три стадии:
//   1. renderTo(state, jupiter-feedback.frag) — симуляция облаков
//   2. shaderStage(jupiter-sharpen.frag)     — sharpen
//   3. shaderStage(jupiter.frag)             — финальная сцена

import {
  COMPOSITOR,
  compileLayerEffect,
  createPoll,
  layerSource,
  loadShader,
  renderTo,
  shaderStage,
  signal,
  stateSource,
  stateTexture,
  type PollHandle,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";

const POLL_INTERVAL_MS = 16;

const JUPITER_COLOR = [1.0, 1.0, 1.0];
const IO_COLOR      = [1.0, 0.95, 0.8];
const NEBULA_COLOR  = [0.9, 0.3, 0.4];
const STARS_COLOR   = [1.0, 0.9, 0.8];
const SPIN_SPEED    = 1.0;

// Nonce для сброса state при hot reload.
const RESET_NONCE = Date.now().toString(36);

const instances = new Map<string, LayerEffectHandle>();
let poll: PollHandle | null = null;

const [timeSig, setTime] = signal(0);
const [aspectSig, setAspect] = signal(16 / 9);
// first_frame: 1.0 в первом кадре, потом 0.0.
const [firstFrameSig, setFirstFrame] = signal(1.0);
let firstFrameConsumed = false;

export function jupiterWallpaperEffect(outputName: string): LayerEffectHandle {
  let effect = instances.get(outputName);
  if (!effect) {
    effect = createInstance(outputName);
    instances.set(outputName, effect);
    startPoll();
  }
  return effect;
}

function createInstance(outputName: string): LayerEffectHandle {
  const state = stateTexture(`jupiter-state-${RESET_NONCE}-${outputName}`, {
    scale: 1.0,
    format: "rgba16f",
    resize: "clear",
  });

  return compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: [
      // 1. Feedback: пишем в state.
      renderTo(state, {
        input: stateSource(state),
        pipeline: [
          shaderStage(loadShader("./shaders/common/jupiter-feedback.frag"), {
            uniforms: {
              time: timeSig,
              aspect: aspectSig,
              first_frame: firstFrameSig,
            },
          }),
        ],
      }),

      // 2. Sharpen: tex = state после feedback.
      shaderStage(loadShader("./shaders/common/jupiter-sharpen.frag"), {
        uniforms: {
          aspect: aspectSig,
        },
      }),

      // 3. Финал: рисуем сцену, используя state как текстуру Юпитера.
      shaderStage(loadShader("./shaders/background/jupiter.frag"), {
        uniforms: {
          time: timeSig,
          aspect: aspectSig,
          spin_speed: SPIN_SPEED,
          jupiter_color: JUPITER_COLOR,
          io_color: IO_COLOR,
          nebula_color: NEBULA_COLOR,
          stars_color: STARS_COLOR,
        },
      }),
    ],
  });
}

function startPoll() {
  if (poll && !poll.cancelled) return;
  poll = createPoll(POLL_INTERVAL_MS, (handle) => {
    setTime((handle.nowMs / 1000) % 600);

    const outputs = COMPOSITOR.output.list;
    if (outputs.length > 0) {
      const out = COMPOSITOR.output.get(outputs[0]);
      if (out?.resolution && out?.scale) {
        const w = out.resolution.width / out.scale;
        const h = out.resolution.height / out.scale;
        if (h > 0) setAspect(w / h);
      }
    }

    // После первого тика гасим флаг first_frame.
    if (!firstFrameConsumed) {
      firstFrameConsumed = true;
      setFirstFrame(0.0);
    }
  });
}

export function disposeJupiter() {
  if (poll && !poll.cancelled) poll.cancel();
  poll = null;
  firstFrameConsumed = false;
  setFirstFrame(1.0);
  instances.clear();
}
