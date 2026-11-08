// Recording indicator overlay: red dot, blinking REC, elapsed time,
// side frame lines. Activated by key bind, deactivated by another.

import {
  COMPOSITOR,
  createPoll,
  loadShader,
  shaderStage,
  signal,
  type PollHandle,
} from "shoji_wm";
import { compileEffect } from "shoji_wm"; // overlay использует compileEffect

let active = false;
let startedAtMs = 0;
let poll: PollHandle | null = null;

// Сигналы, которые уходят в шейдер.
const [timeSig, setTime] = signal(0);
const [elapsedSig, setElapsed] = signal(0);
const [aspectSig, setAspect] = signal(16 / 9);

// Кэш оверлеев по output.
const overlays = new Map<string, ReturnType<typeof compileEffect>>();

export function toggleRecording() {
  active = !active;
  if (active) {
    startedAtMs = Date.now();
    startPoll();
  } else {
    stopPoll();
  }
}

export function isRecording(): boolean {
  return active;
}

/**
 * Вызывается из COMPOSITOR.effect.overlay. Возвращает handle, если
 * запись активна, иначе null — тогда оверлей не рисуется.
 */
export function recordingOverlayEffect(outputName: string) {
  if (!active) return null;

  let effect = overlays.get(outputName);
  if (!effect) {
    effect = compileEffect({
      input: backdropSource(), // overlay рисует поверх всего, input не важен
      capturePadding: 0,
      invalidate: { kind: "always" },
      alpha: "preserve",
      pipeline: [
        shaderStage(loadShader("./src/impl/shaders/overlay/recording-overlay.frag"), {
          uniforms: {
            time: timeSig,
            elapsed_seconds: elapsedSig,
            aspect: aspectSig,
          },
        }),
      ],
    });
    overlays.set(outputName, effect);
  }
  return effect;
}

function startPoll() {
  if (poll && !poll.cancelled) return;
  poll = createPoll(16, (handle) => {
    const nowMs = handle.nowMs;
    setTime(nowMs / 1000);
    setElapsed((nowMs - startedAtMs) / 1000);

    // aspect по первому output'у
    const outputs = COMPOSITOR.output.list;
    if (outputs.length > 0) {
      const out = COMPOSITOR.output.get(outputs[0]);
      if (out?.resolution && out?.scale) {
        const w = out.resolution.width / out.scale;
        const h = out.resolution.height / out.scale;
        if (h > 0) setAspect(w / h);
      }
    }
  });
}

function stopPoll() {
  if (poll && !poll.cancelled) poll.cancel();
  poll = null;
  // Оверлеи можно не удалять — они перестанут вызываться, потому что
  // recordingOverlayEffect вернёт null. Но лучше почистить кэш.
  overlays.clear();
}

export function disposeRecording() {
  stopPoll();
  overlays.clear();
  active = false;
}
