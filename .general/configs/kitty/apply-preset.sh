function help
{
  echo "[info] <help message>"
  echo "bash-script for applying preset in kitty config"
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

presets_dir="presets"
if [ ! -d "$presets_dir" ]; then
  echo "[error] Expected '$presets_dir' in '$mydir'"
  echo "[error] Exiting without doing anything"
  exit 1
fi

preset_config="$presets_dir/$preset.conf"
if [ ! -f "$preset_config" ]; then
  echo "[error] No preset '$preset' found."
  echo "[error] Searching by file name: '$(basename "$preset_config")'"
  echo "[error] In the following directory: '$mydir/$presets_dir'"
  echo "[error] Exiting without doing anything"
  exit 1
fi

echo "[info] preset found: '$mydir/$presets_dir/$preset_config'"

config="kitty.conf"
if [ -e "$config" ]; then
  if [ ! -L "$config" ]; then
    echo "[error] '$config' already exists and was created not by this tool, so i will not do anything."
    echo "[error] Please make a backup of it and remove it from current path before using this script"
    echo "[error] Exiting without doing anything"
    exit 1
  fi
  rm "$config"
  echo "[info] removed old preset (symlink, NOT a file with unique data): '$mydir/$presets_dir/$config'"
fi

ln -s "$preset_config" "$config"

# force kitty to apply new settings
# if [ -n "$KITTY_PID" ]; then
#   kill -SIGUSR1 "$KITTY_PID"
# else
  # pkill -SIGUSR1 -x kitty
# fi
kill -SIGUSR1 $(pgrep -f kitty)

echo "[info] successfully created new symlink on a preset '$preset':"
echo "[info] '$mydir/$presets_dir/$config'"
