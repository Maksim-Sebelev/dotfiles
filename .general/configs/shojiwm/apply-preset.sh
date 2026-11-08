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

src_dir="src"
if [ ! -d "$src_dir" ]; then
  echo "[error] Expected '$src_dir' in '$mydir'"
  echo "[error] Exiting without doing anything"
  exit 1
fi

cd "$src_dir" || exit 1

preset_index="impl/index-presets/$preset.tsx"
if [ ! -f "$preset_index" ]; then
  echo "[error] No preset '$preset' found."
  echo "[error] Searching by file name: '$preset_index'"
  echo "[error] In the following directory: '$mydir/$src_dir'"
  echo "[error] Exiting without doing anything"
  exit 1
fi

echo "[info] preset found: '$mydir/$src_dir/$preset_index'"

index="index.tsx"
if [ -e "$index" ]; then
  if [ ! -L "$index" ]; then
    echo "[error] '$index' already exists and was created not by this tool, so i will not do anything."
    echo "[error] Please make a backup of it and remove it from current path before using this script"
    echo "[error] Exiting without doing anything"
    exit 1
  fi
  rm "$index"
  echo "[info] removed old preset (symlink, NOT a file with unique data): '$mydir/$src_dir/$index'"
fi

ln -s "$preset_index" "$index"
echo "[info] successfully created new symlink on a preset '$preset':"
echo "[info] '$mydir/$src_dir/$index'"

# super+shift+R  - shojiwm hot reload
ydotool key 125:1 42:1 19:1 19:0 42:0 125:0
