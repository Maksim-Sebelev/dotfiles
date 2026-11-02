function help
{
  echo "Usage:"
  echo "$0 <playlist-dir> <order>"
  echo "song will be searching in <playlist-dir> and if it will be failed, searching will be repeat in all ~/Music directory"
}

for opt in "$@"; do
  if [ "$opt" == "--help" ] || [ "$opt" == "-h" ]; then
    help
    exit 0
  fi
done

if [ $# -ne 2 ]; then
  help
  exit 1
fi

playlist_dir="$1"
order="$2"

# MPC_API="-h 127.0.0.1"
# MPC_API="-h /run/user/1000/mpd/socket"

mpc $MPC_API clear

songs="$(cat $order)"
for song in $songs; do
  path_to_song="$playlist_dir/$song"
  if ! [ -f "$path_to_song" ]; then
    # first, searching in ~/Music
    # mpd will provide searching in ~/Music by himself
    path_to_song="$(find "/home/ananasik/Music/" -type f -name "$song" -printf '%P\n' 2>/dev/null | head -n1)"
    if [ -z "$path_to_song" ]; then
      echo "[ERROR] Song not found: $song"
      exit 1
    fi
  fi
  # mpc $MPC_API add "$path_to_song"
  path_for_mpd="${path_to_song#/home/ananasik/Music/}"
  echo "$path_for_mpd"
  mpc $MPC_API add "$path_for_mpd"
done

mpc $MPC_API repeat on
mpc $MPC_API play
