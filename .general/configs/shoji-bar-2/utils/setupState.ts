import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { createState } from "gnim"

export type SetupEntry = {
  name: string
  scriptPath: string
  imagePath: string | null
}

export function getSetupDir(): string {
  return `${GLib.get_user_config_dir()}/shoji-bar-2/scripts/presets`
}

export function getSetupAssetsDir(): string {
  // Assuming the bar is running from its root directory where 'assets' is located
  return `${SRC}/assets/setups`
}

export function listSetups(): SetupEntry[] {
  const setupDir = getSetupDir()
  const assetsDir = getSetupAssetsDir()
  const out: SetupEntry[] = []

  const dir = Gio.File.new_for_path(setupDir)
  if (!dir.query_exists(null)) {
    return out
  }

  const enumerator = dir.enumerate_children(
    "standard::name,standard::type",
    Gio.FileQueryInfoFlags.NONE,
    null,
  )

  let info
  while ((info = enumerator.next_file(null)) !== null) {
    if (info.get_file_type() !== Gio.FileType.REGULAR) continue
    const name = info.get_name()
    if (!name.endsWith(".sh")) continue

    const baseName = name.slice(0, -3) // remove .sh
    const scriptPath = `${setupDir}/${name}`

    // Look for a matching image in assets/setups
    let imagePath = null
    const extensions = [".png", ".jpg", ".jpeg", ".webp"]
    for (const ext of extensions) {
      const checkPath = `${assetsDir}/${baseName}${ext}`
      if (GLib.file_test(checkPath, GLib.FileTest.EXISTS)) {
        imagePath = checkPath
        break
      }
    }

    out.push({ name: baseName, scriptPath, imagePath })
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export function runSetup(scriptPath: string) {
  try {
    GLib.spawn_command_line_async(`bash "${scriptPath}"`)
  } catch (err) {
    console.error("[setup] failed to run script:", scriptPath, err)
  }
}

const [setupEntries, setSetupEntries] = createState<SetupEntry[]>([])
export { setupEntries }

export function refreshSetups() {
  setSetupEntries(listSetups())
}
