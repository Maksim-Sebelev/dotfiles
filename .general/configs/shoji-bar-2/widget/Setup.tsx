import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Accessor, createComputed, createRoot, createState, onCleanup } from "gnim"
import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import GdkPixbuf from "gi://GdkPixbuf"
import { LayerState } from "../utils/LayerState"
import { isPointInsideWidget } from "../utils/pointInside"
import {
  setupEntries,
  refreshSetups,
  runSetup,
} from "../utils/setupState"

type SetupMenuState = {
  isOpen: ReturnType<typeof createState<boolean>>[0]
  setOpen: (open: boolean) => void
}

const LAYER_STATE = new LayerState<SetupMenuState>()

// =============================================================================
// Trigger button on the bar
// =============================================================================

export function SetupButton({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const isPressed: Accessor<boolean> =
    LAYER_STATE.then(gdkmonitor, (state) => state.isOpen((isOpen) => isOpen)) ??
    createComputed(() => false)

  return (
    <button
      cssName="SetupButton"
      class={isPressed((pressed) => (pressed ? "pressed" : ""))}
      onClicked={() =>
        LAYER_STATE.then(gdkmonitor, (state) => state.setOpen(!state.isOpen()))
      }
    >
      <image
        cssName="SetupButtonIcon"
        // You can add a specific icon for setups, using the wallpaper icon for now
        file={isPressed(
          (pressed) =>
            `${SRC}/assets/wallpaper` + (pressed ? "-dark.svg" : ".svg"),
        )}
        pixelSize={16}
      />
    </button>
  )
}

// =============================================================================
// The pulldown itself
// =============================================================================

const THUMBNAIL_WIDTH = 168
const THUMBNAIL_HEIGHT = 96

const thumbnailCache = new Map<string, GdkPixbuf.Pixbuf>()

function loadThumbnail(path: string | null, scale: number): GdkPixbuf.Pixbuf | null {
  if (!path) return null
  const key = `${path}|${scale}`
  const cached = thumbnailCache.get(key)
  if (cached) return cached
  try {
    const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
      path,
      THUMBNAIL_WIDTH * scale,
      THUMBNAIL_HEIGHT * scale,
      false,
    )
    if (pixbuf) {
      thumbnailCache.set(key, pixbuf)
    }
    return pixbuf
  } catch (err) {
    console.error("[setup] failed to load thumbnail:", path, err)
    return null
  }
}

export function SetupLayer({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const scale = gdkmonitor.get_scale_factor()
  const [isOpen, setIsOpen] = createState(false)
  const [mounted, setMounted] = createState(false)

  let closeTimeoutId: number | null = null
  let openIdleId: number | null = null

  function clearTimers() {
    if (closeTimeoutId !== null) {
      GLib.source_remove(closeTimeoutId)
      closeTimeoutId = null
    }
    if (openIdleId !== null) {
      GLib.source_remove(openIdleId)
      openIdleId = null
    }
  }

  function setOpen(open: boolean) {
    clearTimers()

    if (open) {
      refreshSetups()
      setMounted(true)

      openIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        openIdleId = null
        setIsOpen(true)
        return GLib.SOURCE_REMOVE
      })
    } else {
      setIsOpen(false)

      closeTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        closeTimeoutId = null
        if (!isOpen()) {
          setMounted(false)
        }
        return GLib.SOURCE_REMOVE
      })
    }
  }

  const states: SetupMenuState = { isOpen, setOpen }
  LAYER_STATE.set(gdkmonitor, states)

  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

  const inner = (
    <box
      cssName="WallpaperMenu" // Reusing wallpaper menu styles for consistency
      class={isOpen((open) => (open ? "open" : "close"))}
      orientation={Gtk.Orientation.VERTICAL}
      halign={Gtk.Align.END}
      valign={Gtk.Align.START}
    >
      <box cssName="FirstPadding" />

      <box
        cssName="WallpaperDirIsland"
        orientation={Gtk.Orientation.HORIZONTAL}
        halign={Gtk.Align.FILL}
        hexpand
      >
        <box
          cssName="WallpaperDirInfo"
          orientation={Gtk.Orientation.VERTICAL}
          hexpand
          valign={Gtk.Align.CENTER}
        >
          <label
            cssName="WallpaperDirCaption"
            halign={Gtk.Align.START}
            label="Environment Setups"
          />
        </box>
      </box>

      <scrolledwindow
        cssName="WallpaperGridScroll"
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
        hexpand
        vexpand
      >
        <Gtk.FlowBox
          cssName="WallpaperGrid"
          minChildrenPerLine={3}
          maxChildrenPerLine={3}
          selectionMode={Gtk.SelectionMode.NONE}
          rowSpacing={8}
          columnSpacing={8}
          homogeneous
          $={(self) => {
            let disposeItems: (() => void) | null = null

            const rebuild = () => {
              if (disposeItems) {
                disposeItems()
                disposeItems = null
              }
              let child = self.get_first_child()
              while (child) {
                const next = child.get_next_sibling()
                self.remove(child)
                child = next
              }
              createRoot((dispose) => {
                disposeItems = dispose
                for (const entry of setupEntries()) {
                  const paintable = loadThumbnail(entry.imagePath, scale)
                  const item = buildSetupItem(entry.name, paintable, () => {
                    runSetup(entry.scriptPath)
                    setOpen(false) // Close after applying
                  })
                  self.append(item)
                }
              })
            }
            rebuild()
            setupEntries.subscribe(rebuild)
          }}
        />
      </scrolledwindow>
      
      <box cssName="WallpaperControlIsland" />
    </box>
  ) as Gtk.Box

  const window = (
    <window
      name="setupmenulayer"
      class="WallpaperMenuLayer" // Reuse layer styles
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={Astal.Keymode.ON_DEMAND}
      anchor={TOP | LEFT | RIGHT | BOTTOM}
      $={(self) => onCleanup(() => self.destroy())}
      visible={mounted}
    >
      {inner}
    </window>
  ) as Gtk.Window

  const outsideClick = Gtk.GestureClick.new()
  outsideClick.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
  outsideClick.connect("pressed", (_g, _n, x, y) => {
    if (!isPointInsideWidget(window, inner, x, y)) {
      states.setOpen(false)
    }
  })
  window.add_controller(outsideClick)

  const keyController = Gtk.EventControllerKey.new()
  keyController.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
  keyController.connect("key-pressed", (_c, keyval) => {
    if (keyval === Gdk.KEY_Escape) {
      states.setOpen(false)
      return true
    }
  })
  window.add_controller(keyController)

  return window
}

function buildSetupItem(
  name: string,
  paintable: GdkPixbuf.Pixbuf | null,
  onClick: () => void,
): Gtk.Widget {
  const imageWidget = paintable ? (
    <Gtk.Picture
      cssName="WallpaperThumbnailImage"
      contentFit={Gtk.ContentFit.COVER}
      canShrink
      paintable={Gdk.Texture.new_for_pixbuf(paintable)}
      widthRequest={THUMBNAIL_WIDTH}
      heightRequest={THUMBNAIL_HEIGHT}
    />
  ) : (
    <box
      cssName="WallpaperThumbnailImage"
      widthRequest={THUMBNAIL_WIDTH}
      heightRequest={THUMBNAIL_HEIGHT}
    >
      <label label={name} cssName="SetupFallbackLabel" />
    </box>
  )

  const button = (
    <button
      cssName="WallpaperThumbnail"
      tooltipText={name}
      onClicked={onClick}
    >
      {imageWidget}
    </button>
  ) as Gtk.Widget
  return button
}
