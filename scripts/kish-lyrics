set -eou pipefail

function help()
{
  if [ "$opt" == "--help" ] || [ "$opt" == "-h" ]; then
    echo "Usage:"
    echo "$0 <playlist-dir> <order>"
    echo "song will be searching in <playlist-dir> and if this will be failed, searching will be repeat in all ~/Music directory"
    exit 0
  fi
}

playlist_dir="/home/ananasik/Music/playlist/КиШ"
order_dir="/home/ananasik/Music/playlist/orders/КиШ"
order="$order_dir/lyrics.cfg"

play-music "$playlist_dir" "$order"
