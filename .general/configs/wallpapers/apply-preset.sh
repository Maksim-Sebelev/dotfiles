function help
{
  echo "[info] <help message>"
  echo "bash-script for applying wallpapers by preset"
  echo "usage: $0 <preset name | --help>"
}

if [ $# -ne 1 ]; then
  echo "[error] only 1 argument expected (preset name)"
  help
  exit 1
fi

if [ "$1" == "h" ] || [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  help
  exit 0
fi

if [ "$1" == "PowerSaver" ] || [ "$1" == "RainyBubbles_1" ]; then
  echo "[info] $1 preset requested, no wallpapers needed"
  echo "[info] exiting without doing anything"
  exit 0
fi

preset="$1"

mydir="$(dirname "$0")"
cd "$mydir" || exit 1

function kill_old_wp
{
  old_wallpapers="$(pgrep -f swaybg 2>/dev/null)"
  if [ "$old_wallpapers" == "" ]; then
    return
  fi
  kill $old_wallpapers
}

wallpapers_dir="wallpapers"
if [ ! -d "$wallpapers_dir" ]; then
  echo "[error] Expected '$wallpapers_dir' in '$mydir'"
  echo "[error] Exiting without doing anything"
  exit 1
fi
cd "$wallpapers_dir" || exit 1

function run_new_wp
{
  new_wp_image="$(find . -name "$preset.*" 2>/dev/null | head -n 1 2>/dev/null)"
  if [ "$new_wp_image" == "" ]; then
    echo "[warning] non wallpapers found by preset name '$preset'"
    echo "[info] searching by name '$preset.*'"
    echo "[info] exiting witnout doing anything"
    exit 1
  fi
  swaybg --image "$new_wp_image" --mode fill 1>/dev/null 2>&1 & disown
}


kill_old_wp
run_new_wp
