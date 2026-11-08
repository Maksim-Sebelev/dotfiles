function help
{
  echo "[info] <help message>"
  echo "bash-script for applying preset in shojiwm config"
  echo "usage: $0 <preset name | --help>"
}

if [ $# -ne 1 ]; then
  echo "[error] only 1 argument expected"
  help
  exit 1
fi

if [ "$1" == "h" ] || [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  help
  exit 0
fi

preset="$1"

mydir="$(dirname "$0")"
cd "$mydir" || exit 1

function warning_separate
{
  echo "[warning] ===================================="
}

for d in *; do
  if [ -f "$d" ]; then
    continue
  fi
  apply_preset_script="$d/apply-preset.sh"
  if [ ! -f "$apply_preset_script" ]; then
    warning_separate
    echo "[warning] No apply-preset.sh found in '$d'"
    echo "[info] skipping applying preset for ^ this dir"
    warning_separate
    continue
  fi
  echo "[info] trying to apply preset for '$d':"
  bash "$apply_preset_script" "$preset"
  exit_code=$?
  if [ $exit_code -eq 0 ]; then
    echo "[info] preset was successfully applied for '$d'"
  else
    warning_separate
    echo "[warning] applying preset for '$d' finished with exit code $exit_code"
    echo "[info] continue applying presets further"
    warning_separate
  fi
done
echo "[info] applying presets done"
